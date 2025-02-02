// pages/api/search.js
import formidable from 'formidable';
import { Readable } from 'stream';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = {
    api: {
        bodyParser: false,
    },
};

const parseForm = async (req) => {
    return new Promise((resolve, reject) => {
        const form = formidable();
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

async function callPythonBackend(query, imageFile = null) {
    try {
        // Ensure query is a string, not an array
        const queryText = Array.isArray(query) ? query[0] : query;

        const formData = new FormData();
        formData.append('text', queryText);

        if (imageFile) {
            const fileStream = Readable.from(await imageFile.toBuffer());
            formData.append('image', fileStream, {
                filename: imageFile.originalFilename,
                contentType: imageFile.mimetype,
            });
        }

        const backendUrl = 'http://localhost:8000/api/query';

        console.log('Sending request to Python backend:', {
            url: backendUrl,
            method: 'POST',
            query: queryText,
            hasImage: !!imageFile
        });

        const response = await fetch(backendUrl, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend responded with status: ${response.status}. ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect to Python backend. Please ensure the Python server is running on port 8000.');
        }
        throw error;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fields, files } = await parseForm(req);
        const textQuery = fields.text;
        const imageFile = files.image;
        const searchMode = req.query.mode || 'hybrid';

        console.log('Received request:', {
            textQuery,
            hasImage: !!imageFile,
            searchMode
        });

        const pythonResponse = await callPythonBackend(textQuery, imageFile);

        // Handle different response formats from the Python backend
        let formattedResults = [];

        if (pythonResponse.answer) {
            formattedResults.push({
                title: 'AI Response',
                content: typeof pythonResponse.answer === 'string'
                    ? pythonResponse.answer
                    : JSON.stringify(pythonResponse.answer), // Convert objects to string
                source: null
            });
        } else {
            formattedResults.push({
                title: 'AI Response',
                content: 'Invalid response format',
                source: null
            });
        }

        if (pythonResponse.context) {
            formattedResults.push(...pythonResponse.context.map(doc => ({
                title: `Source: ${doc.metadata?.source || 'Unknown'}`,
                content: doc.page_content,
                source: doc.metadata?.source
            })));
        }

        // If no formatted results, use the raw response
        if (formattedResults.length === 0) {
            formattedResults = [{
                title: 'Response',
                content: typeof pythonResponse === 'string' ? pythonResponse : JSON.stringify(pythonResponse),
                source: null
            }];
        }

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}