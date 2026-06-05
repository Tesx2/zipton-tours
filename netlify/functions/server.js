const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
// Sanitize URL by removing potential trailing slash to prevent double slashes in fetch calls
const WORDPRESS_URL = process.env.WORDPRESS_URL ? process.env.WORDPRESS_URL.replace(/\/$/, "") : "";

if (!NVIDIA_API_KEY) {
    console.warn("Backend Warning: NVIDIA_API_KEY is missing from environment variables.");
}

if (!WORDPRESS_URL) {
    console.warn("Backend Warning: WORDPRESS_URL is missing from environment variables.");
}

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

async function getWebsiteContent() {
    try {
        const [posts, pages] = await Promise.all([
            fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=20`).then(r => r.json().catch(() => [])),
            fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages?per_page=20`).then(r => r.json().catch(() => []))
        ]);

        const allItems = [...(Array.isArray(posts) ? posts : []), ...(Array.isArray(pages) ? pages : [])];
        
        if (allItems.length === 0) return "No specific tour data found on the website.";

        return allItems.map(item => {
            const title = item.title?.rendered || "Untitled";
            const excerpt = (item.excerpt?.rendered || "").replace(/<\/?[^>]+(>|$)/g, ""); 
            return `TOUR/PAGE: ${title}\nDETAILS: ${excerpt}`;
        }).join("\n\n");
    } catch (e) {
        return "Website content currently unavailable.";
    }
}

const router = express.Router();
app.use('/.netlify/functions/server', router);
app.use('/', router);

router.post('/api/chat', async (req, res) => {
    try {
        if (!NVIDIA_API_KEY) {
            return res.status(500).json({ error: "NVIDIA_API_KEY is not configured on the server." });
        }

        const websiteContext = await getWebsiteContent();
        const { messages } = req.body;

        // Inject system instructions and live website data
        const systemMessage = {
            role: "system",
            content: `You are a world-class Safari and Travel Consultant for Zipton Tours. 
            Your expertise covers East Africa (Kenya, Tanzania, Uganda, Rwanda).
            
            CURRENT WEBSITE KNOWLEDGE:
            ${websiteContext}

            GUIDELINES:
            1. Use the website knowledge above as your primary source for Zipton-specific packages.
            2. Be professional, warm, and use emojis (🦁, 🐘, 🏔️) to build excitement.
            3. If a specific price or itinerary isn't in the context, provide general estimates based on your expertise but advise the user to contact Zipton for a final quote.
            4. Always encourage users to book or ask for contact details.`
        };

        const response = await fetch(NVIDIA_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
                model: "meta/llama-3.1-70b-instruct", // or your preferred NVIDIA NIM model
                messages: [systemMessage, ...messages],
                temperature: 0.5,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the app wrapped in serverless-http for Netlify
module.exports.handler = serverless(app);