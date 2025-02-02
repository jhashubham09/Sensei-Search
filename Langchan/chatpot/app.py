from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain.schema import Document
from PIL import Image
import ollama
import pytesseract
from pathlib import Path
from typing import List, Dict, Any
import asyncio
import json

api = FastAPI()

# Configure CORS
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OllamaEmbeddings:
    def __init__(self, model_name="deepseek-r1"):
        self.model_name = model_name
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            embedding = ollama.embeddings(model=self.model_name, prompt=text)
            embeddings.append(embedding['embedding'])
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        embedding = ollama.embeddings(model=self.model_name, prompt=text)
        return embedding['embedding']
    
    def __call__(self, text: str) -> List[float]:
        return self.embed_query(text)

async def get_vector_store():
    if not hasattr(get_vector_store, "vector_store"):
        get_vector_store.vector_store = await initialize_vector_store()
    return get_vector_store.vector_store

async def initialize_vector_store():
    documents = []
    
    # Load PDF documents
    if Path("./documents").exists():
        pdf_loader = PyPDFDirectoryLoader("./documents")
        documents.extend(pdf_loader.load())
    
    # Load images
    if Path("./images").exists():
        for img_path in Path("./images").glob("*"):
            if img_path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.gif', '.bmp'}:
                try:
                    image = Image.open(img_path)
                    text = pytesseract.image_to_string(image)
                    if text.strip():
                        doc = Document(
                            page_content=text,
                            metadata={
                                'source': str(img_path),
                                'type': 'image'
                            }
                        )
                        documents.append(doc)
                except Exception as e:
                    print(f"Error processing image {img_path}: {str(e)}")
    
    # Create empty vector store if no documents found
    if not documents:
        return FAISS.from_texts([""], OllamaEmbeddings())
    
    # Process documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_documents = text_splitter.split_documents(documents)
    
    embedding_model = OllamaEmbeddings()
    texts = [doc.page_content for doc in split_documents]
    metadatas = [doc.metadata for doc in split_documents]
    
    return FAISS.from_texts(
        texts=texts,
        embedding=embedding_model,
        metadatas=metadatas
    )

async def process_query(text: str, image_file: UploadFile = None) -> Dict[str, Any]:
    try:
        # Get vector store
        vector_store = await get_vector_store()
        
        # Process image if provided
        combined_text = text
        if image_file:
            image = Image.open(image_file.file)
            image_text = pytesseract.image_to_string(image)
            combined_text = f"{text}\nImage Content: {image_text}"
            
            # Add image content to vector store
            embedding_model = OllamaEmbeddings()
            vector_store.add_texts(
                texts=[image_text],
                metadatas=[{"source": image_file.filename, "type": "image"}],
                embedding=embedding_model
            )

        # Get relevant documents
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )
        
        docs = await asyncio.to_thread(retriever.get_relevant_documents, combined_text)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Create prompt
        prompt = f"""Answer the following question based on the provided context only.
        If the information isn't in the context, say you don't have enough information.
        
        Context: {context}
        
        Question: {text}
        
        Answer: """
        
        # Get response from Ollama
        response = await asyncio.to_thread(
            lambda: ollama.chat(
                model="deepseek-r1",
                messages=[{"role": "user", "content": prompt}]
            )
        )
        
        return {
            "answer": response.message['content'],
            "context": [
                {
                    "page_content": doc.page_content,
                    "metadata": doc.metadata
                } for doc in docs
            ]
        }
    
    except Exception as e:
        return {"error": f"Error processing query: {str(e)}"}

@api.post("/api/query")
async def handle_query(
    text: str = Form(...),
    image: UploadFile = File(None)
) -> JSONResponse:
    try:
        result = await process_query(text, image)
        
        if "error" in result:
            return JSONResponse(
                content=[{
                    "title": "Error",
                    "content": "An error occurred while processing your query. Please try again.",
                    "source": None
                }],
                status_code=500
            )
        
        formatted_results = [{
            "title": "Answer",
            "content": result["answer"].strip(),
            "source": None
        }]
        
        # Add context documents if available
        if result.get("context"):
            for doc in result["context"]:
                formatted_results.append({
                    "title": f"Source: {doc['metadata'].get('source', 'Unknown')}",
                    "content": doc["page_content"].strip(),
                    "source": doc["metadata"].get("source")
                })
        
        return JSONResponse(content=formatted_results)
    
    except Exception as e:
        return JSONResponse(
            content=[{
                "title": "Error",
                "content": "An unexpected error occurred. Please try again.",
                "source": None
            }],
            status_code=500
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(api, host="0.0.0.0", port=8000)