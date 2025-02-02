// lib/ragConfig.js
import { HfInference } from '@huggingface/inference';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';

// Initialize Hugging Face Inference
const hf = new HfInference(process.env.HF_TOKEN);

// Initialize ChromaDB client
const chromaClient = new ChromaClient({
    path: process.env.CHROMA_SERVER
});

// Initialize embedding function
const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.HF_TOKEN,
    model_name: "sentence-transformers/all-mpnet-base-v2"
});

// Get or create collection
let collection;
(async () => {
    collection = await chromaClient.getOrCreateCollection({
        name: process.env.CHROMA_COLLECTION,
        embeddingFunction
    });
})();

export const config = {
    textEncoder: async (text) => {
        const result = await hf.featureExtraction({
            model: 'sentence-transformers/all-mpnet-base-v2',
            inputs: text
        });
        return result;
    },

    imageEncoder: async (image) => {
        const result = await hf.featureExtraction({
            model: 'openai/clip-vit-base-patch32',
            inputs: image
        });
        return result;
    },

    hybridSearch: async (queryEmbedding, textQuery, topK = 10) => {
        const vectorResults = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: topK
        });

        const keywordResults = await collection.query({
            queryTexts: [textQuery],
            nResults: topK
        });

        // Combine and deduplicate results
        const combinedResults = [...vectorResults.ids[0], ...keywordResults.ids[0]];
        return [...new Set(combinedResults)];
    },

    generatorPrompt: `Answer the following question using the provided context. Be concise and accurate. If the answer is not in the context, say "I don't have enough information to answer that."

Context: {context}

Question: {query}

Answer:`,

    reranker: async (results, query) => {
        // Implement re-ranking logic here if needed
        // This could involve using a cross-encoder model for more accurate relevance scoring
        return results;
    }
};

export const initializeRAG = async () => {
    // Any additional initialization logic can go here
    console.log('RAG system initialized');
};
