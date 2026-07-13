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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const WORDPRESS_URL = process.env.WORDPRESS_URL; // e.g., https://yourwebsite.com

if (!NVIDIA_API_KEY) {
    console.warn("Backend Warning: NVIDIA_API_KEY is missing from environment variables.");
}
if (!GEMINI_API_KEY) {
    console.warn("Backend Warning: GEMINI_API_KEY is missing from environment variables. Gemini chat will be skipped.");
}

if (!WORDPRESS_URL) {
    console.warn("Backend Warning: WORDPRESS_URL is missing from environment variables.");
}

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

function toGeminiContents(messages) {
    return messages
        .filter((message) => message && message.role !== "system" && message.content)
        .map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: String(message.content) }]
        }));
}

function toChatCompletionResponse(text, provider = "gemini") {
    return {
        id: `${provider}-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: provider === "gemini" ? GEMINI_MODEL : "meta/llama-3.1-70b-instruct",
        provider,
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: text || "I could not generate a response right now."
                },
                finish_reason: "stop"
            }
        ]
    };
}

async function requestGemini(systemMessage, messages) {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemMessage.content }]
            },
            contents: toGeminiContents(messages),
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 300
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const error = new Error("Gemini API returned an error.");
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    return toChatCompletionResponse(text, "gemini");
}

async function requestNvidia(systemMessage, messages) {
    if (!NVIDIA_API_KEY) {
        throw new Error("NVIDIA_API_KEY is not configured.");
    }

    const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages: [systemMessage, ...messages],
            temperature: 0.5,
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const error = new Error("NVIDIA API returned an error.");
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
}

const router = express.Router();
app.use('/.netlify/functions/server', router);
app.use('/', router);

router.post('/api/chat', async (req, res) => {
    try {
        if (!GEMINI_API_KEY && !NVIDIA_API_KEY) {
            return res.status(500).json({ error: "No AI provider API key is configured on the server." });
        }

        const websiteContext = await getWebsiteContent();
        const { messages } = req.body;

        // Inject system instructions and live website data
        const systemMessage = {
            role: "system",
            content: `You are a world-class Safari and Travel Consultant for Zipton Tours. 
            Your expertise covers East Africa (Kenya, Tanzania, Uganda, Rwanda).

            COMPANY IDENTITY:
            - CEO & Founder: Anthony Achayo
            - Communications Manager: Musya Mercy Mutheu
            - Mission: Creating travel experiences where adventure meets culture.
            
            CURRENT WEBSITE KNOWLEDGE:
            ${websiteContext}

            GUIDELINES:
            1. Use the website knowledge above as your primary source for Zipton-specific packages.
            2. Be professional, warm, and use emojis (🦁, 🐘, 🏔️) to build excitement.
            3. If a specific price or itinerary isn't in the context, provide general estimates based on your expertise but advise the user to contact Zipton for a final quote.
            4. Be extremely concise and keep your responses very brief (under 100 words).
            5. Always encourage users to book or ask for contact details.`
        };

        const providers = GEMINI_API_KEY
            ? [
                { name: "Gemini", run: () => requestGemini(systemMessage, messages) },
                { name: "NVIDIA", run: () => requestNvidia(systemMessage, messages) }
            ]
            : [
                { name: "NVIDIA", run: () => requestNvidia(systemMessage, messages) }
            ];

        let lastError = null;
        for (const provider of providers) {
            try {
                const data = await provider.run();
                return res.json(data);
            } catch (providerError) {
                lastError = providerError;
                console.error(`${provider.name} API error:`, providerError.data || providerError.message);
            }
        }

        res.status(lastError?.status || 500).json(lastError?.data || { error: "All AI providers failed." });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the app wrapped in serverless-http for Netlify
module.exports.handler = serverless(app);
