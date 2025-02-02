from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image
import pytesseract
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from transformers import pipeline
import torch
import PyPDF2
from typing import List
import asyncio

api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    async def process_file(self, file: UploadFile) -> List[Document]:
        documents = []
        file_ext = file.filename.lower().split('.')[-1]
        
        try:
            contents = await file.read()
            file_stream = io.BytesIO(contents)

            if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'bmp']:
                image = Image.open(file_stream)
                text = pytesseract.image_to_string(image)
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={'source': file.filename, 'type': 'image'}
                    ))

            elif file_ext == 'pdf':
                pdf_reader = PyPDF2.PdfReader(file_stream)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={'source': file.filename, 'type': 'pdf'}
                    ))

            elif file_ext == 'txt':
                text = contents.decode('utf-8')
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={'source': file.filename, 'type': 'text'}
                    ))

        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")

        return self.text_splitter.split_documents(documents) if documents else []

class RAGSystem:
    def __init__(self):
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        self.generator = pipeline(
            "text-generation",
            model="facebook/opt-350m",
            torch_dtype=torch.float32,
            device="cpu"
        )

        self.vector_store = None
        self.prompt = ChatPromptTemplate.from_template("""
        Provide a clear and direct answer based on the following context:
        
        Context:
        {context}
        
        Question: {input}
        
        Answer:
        """)

    async def process_file(self, file: UploadFile):
        processor = DocumentProcessor()
        documents = await processor.process_file(file)
        
        if documents:
            try:
                if not self.vector_store:
                    self.vector_store = FAISS.from_documents(
                        documents,
                        self.embedding_model
                    )
                else:
                    self.vector_store.add_documents(documents)
                return len(documents)
            except Exception as e:
                print(f"Error updating vector store: {str(e)}")
                raise
        return 0

    def get_completion(self, prompt: str) -> str:
        try:
            response = self.generator(
                prompt,
                max_length=512,
                num_return_sequences=1,
                temperature=0.2
            )
            return response[0]['generated_text'].replace(prompt, "").strip()
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def get_response(self, question: str):
        if not self.vector_store:
            return {
                "answer": "No documents have been processed yet. Please upload some documents first.",
                "context": []
            }

        try:
            retriever = self.vector_store.as_retriever()

            def document_chain_fn(inputs):
                context = inputs["context"]
                question = inputs["input"]
                prompt_text = self.prompt.format(context=context, input=question)
                response = self.get_completion(prompt_text)
                return {"answer": response}

            retrieval_chain = create_retrieval_chain(retriever, document_chain_fn)
            response = await asyncio.to_thread(
                lambda: retrieval_chain.invoke({'input': question})
            )

            return response
        except Exception as e:
            return {
                "answer": f"Error: {str(e)}",
                "context": []
            }

# Initialize RAG system
rag_system = RAGSystem()

@api.post("/api/query")
async def process_query(text: str = Form(...), image: UploadFile = None):
    try:
        # Process image if provided
        if image:
            await rag_system.process_file(image)
            
        # Get response using RAG
        response = await rag_system.get_response(text)
        
        # Format response
        formatted_response = [{
            "title": "Answer",
            "content": response["answer"],
            "source": None
        }]
        
        # Add context documents if available
        if "context" in response:
            formatted_response.extend([
                {
                    "title": f"Source: {doc.metadata.get('source', 'Unknown')}",
                    "content": doc.page_content,
                    "source": doc.metadata.get('source')
                }
                for doc in response.get("context", [])
            ])
            
        return formatted_response
        
    except Exception as e:
        return [{
            "title": "Error",
            "content": f"An error occurred: {str(e)}",
            "source": None
        }]

@api.post("/api/upload")
async def upload_file(file: UploadFile):
    try:
        num_chunks = await rag_system.process_file(file)
        return {
            "status": "success",
            "message": f"Processed {num_chunks} chunks from {file.filename}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error processing file: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(api, host="0.0.0.0", port=8000)