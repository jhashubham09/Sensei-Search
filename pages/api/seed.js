// pages/api/seed.js
import { ChromaClient } from 'chromadb';

export default async function handler(req, res) {
    const chroma = new ChromaClient();
    const collection = await chroma.getOrCreateCollection({ name: 'sensei-search' });

    await collection.add({
        ids: ['doc1', 'doc2'],
        documents: ['AI winter history', 'Neural network architectures'],
        metadatas: [{ source: 'wiki' }, { source: 'textbook' }]
    });

    res.status(200).json({ status: 'Database seeded' });
}
