const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const serverless = require('serverless-http');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for audio data

const PORT = process.env.PORT || 3000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
// Sanitize URL by removing potential trailing slash to prevent double slashes in fetch calls
const WORDPRESS_URL = process.env.WORDPRESS_URL ? process.env.WORDPRESS_URL.replace(/\/$/, "") : "https://ziptontours.great-site.net";

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
const NVIDIA_ASR_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Cache variables to prevent hitting WP site on every request
let cachedContext = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Helper for WordPress sites with JS-based protection (InfinityFree/ByetHost)
function solveProtectionCookie(html) {
    try {
        const values = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)].map((match) => match[1]);
        if (values.length < 3) return "";
        const [keyHex, ivHex, encryptedHex] = values;
        const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from(keyHex, "hex"), Buffer.from(ivHex, "hex"));
        decipher.setAutoPadding(false);
        return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("hex");
    } catch (e) {
        return "";
    }
}

function wpRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers, timeout: 3500 }, (res) => { 
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => resolve({ body, headers: res.headers }));
        });
        req.on("error", reject);
        req.on("timeout", () => { req.destroy(); reject(new Error("WP Timeout")); });
    });
}

async function fetchWpJson(url) {
    try {
        const res = await wpRequest(url);
        if (res.headers["content-type"]?.includes("application/json")) return JSON.parse(res.body);
        const cookie = solveProtectionCookie(res.body);
        if (!cookie) {
            console.warn(`Protection cookie could not be solved for ${url}. Returning empty array.`);
            return [];
        }
        const separator = url.includes("?") ? "&" : "?";
        const finalRes = await wpRequest(`${url}${separator}i=1`, { Cookie: `__test=${cookie}` });
        
        if (!finalRes.headers["content-type"]?.includes("application/json")) {
            console.warn(`WordPress API still did not return JSON after protection cookie for ${url}. Returning empty array.`);
            return [];
        }
        return JSON.parse(finalRes.body);
    } catch (e) {
        console.error(`Error fetching ${url}:`, e.message);
        return [];
    }
}

/**
 * Reads local HTML files to extract "static" knowledge like contact info, 
 * team details, and company mission without hardcoding.
 */
function getStaticKnowledge() {
    try {
        const filesToRead = ["index.html", "about.html", "contact.html", "tours.html"];
        let staticContext = "CORE WEBSITE INFORMATION:\n";
        const MAX_STATIC_CHARS = 2000; // Limit static info to 2000 chars total

        filesToRead.forEach(file => {
            const filePath = path.resolve(__dirname, "../../", file);
            if (fs.existsSync(filePath)) {
                const html = fs.readFileSync(filePath, "utf8").substring(0, 5000); // Only parse start of file
                const text = html
                    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi, "") // Skip navigation
                    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi, "") // Skip footer
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "") // Skip scripts
                    .replace(/<\/?[^>]+(>|$)/g, " ") // Strip tags
                    .replace(/\s+/g, " ") // Clean whitespace
                    .trim();
                staticContext += `FROM ${file}: ${text.substring(0, 500)}\n\n`;
            }
        });
        return staticContext.substring(0, MAX_STATIC_CHARS);
    } catch (err) {
        return "Static website info unavailable.";
    }
}

async function getWebsiteContent() {
    const now = Date.now();
    
    const MAX_TOTAL_CONTEXT = 6000; // Total character limit for AI context

    // Check for build-time manifest in multiple potential locations
    try {
        const potentialPaths = [
            path.resolve(__dirname, "../../knowledge-manifest.json"),
            path.resolve(__dirname, "knowledge-manifest.json")
        ];
        const validPath = potentialPaths.find(p => fs.existsSync(p));

        if (validPath) {
            const manifest = JSON.parse(fs.readFileSync(validPath, "utf8"));
            const staticContext = getStaticKnowledge();
            const combined = `${staticContext}\n\nPRE-BUILT UPDATES (Last Synced: ${manifest.lastUpdated}):\n${manifest.wordpressContent}`;
            return combined.substring(0, MAX_TOTAL_CONTEXT);
        }
    } catch (e) {
        console.warn("Could not read knowledge manifest, falling back to runtime fetch.");
    }

    if (cachedContext && (now - lastCacheUpdate < CACHE_TTL)) {
        return cachedContext;
    }

    const staticContext = getStaticKnowledge();

    try {
        // Use a race to ensure slow WordPress responses don't cause 504 timeouts
        const wpPromise = Promise.all([
            fetchWpJson(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=5`),
            fetchWpJson(`${WORDPRESS_URL}/wp-json/wp/v2/pages?per_page=5`)
        ]);
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([[], []]), 4000));

        const [posts, pages] = await Promise.race([wpPromise, timeoutPromise]);

        const allItems = [...(Array.isArray(posts) ? posts : []), ...(Array.isArray(pages) ? pages : [])];

        const wpContext = allItems.map(item => {
            const title = item.title?.rendered || "Untitled";
            const excerpt = (item.excerpt?.rendered || "").replace(/<\/?[^>]+(>|$)/g, ""); 
            return `TOUR/PAGE: ${title}\nDETAILS: ${excerpt}`;
        }).join("\n\n");

        const context = `${staticContext}\n\nDYNAMIC UPDATES:\n${wpContext}`.substring(0, MAX_TOTAL_CONTEXT);

        cachedContext = context;
        lastCacheUpdate = now;
        return context;
    } catch (e) {
        return cachedContext || "Website content currently unavailable.";
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
        console.log('Function started for /api/chat');
        if (!GEMINI_API_KEY && !NVIDIA_API_KEY) {
            console.error("No AI provider API key is configured.");
            return res.status(500).json({ error: "No AI provider API key is configured on the server." });
        }

        console.log('Fetching website content...');
        const websiteContext = await getWebsiteContent();
        console.log('Website content fetched. Length:', websiteContext.length);
        const { messages } = req.body;

        // Inject system instructions and live website data
        const systemMessage = {
            role: "system",
            content: `You are a dual-persona AI Assistant for Zipton Tours.
            
            PERSONA 1: Safari and Travel Consultant (Default)
            Expertise: East Africa (Kenya, Tanzania, Uganda, Rwanda). Use the provided website knowledge.

            PERSONA 2: World-Class Software Engineer (Trigger: When code is provided)
            When you see code, perform a "Deep Code Review" including:
            1. Summary: What the code does.
            2. Structure: Functions and classes used.
            3. Analysis: Potential bugs, Security vulnerabilities (OWASP), and Performance bottlenecks.
            4. Engineering: Best practices, Big O complexity, and suggested refactoring.
            5. Documentation: JSDoc or comments for the provided code.
            6. Verdict: A Code Quality Score out of 100.

            GENERAL GUIDELINES:
            - If the user provides code, prioritize Persona 2.
            - Be concise but thorough.
            - Use Markdown (triple backticks) for code blocks.
            
            COMPANY CONTEXT:
            - CEO: ${process.env.COMPANY_CEO || "Anthony Achayo"}
            - Mission: Adventure meets culture.

            CURRENT WEBSITE KNOWLEDGE:
            ${websiteContext}

            GUIDELINES:
            1. Use the website knowledge above as your primary source for Zipton-specific packages.
            2. Be professional, warm, and use emojis (🦁, 🐘, 🏔️) to build excitement.
            3. If a specific price or itinerary isn't in the context, provide general estimates based on your expertise but advise the user to contact Zipton for a final quote.
            4. Always encourage users to book or ask for contact details if they are asking about tours.`
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
                console.log(`Sending request to ${provider.name} API...`);
                const data = await provider.run();
                console.log(`${provider.name} API data received successfully.`);
                return res.json(data);
            } catch (providerError) {
                lastError = providerError;
                console.error(`${provider.name} API error:`, providerError.data || providerError.message);
            }
        }

        res.status(lastError?.status || 500).json(lastError?.data || { error: "All AI providers failed." });
    } catch (error) {
        console.error('Server Error in /api/chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/transcribe', async (req, res) => {
    try {
        const { audio } = req.body;
        if (!audio) return res.status(400).json({ error: "No audio data provided" });

        const audioBuffer = Buffer.from(audio, 'base64');
        
        // Construct Multipart Form for NVIDIA NIM (Whisper)
        const form = new FormData();
        form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
        form.append('model', 'openai/whisper-v3'); // or your preferred NIM ASR model
        form.append('response_format', 'json');

        const response = await fetch(NVIDIA_ASR_URL, {
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${NVIDIA_API_KEY}`
            },
            body: form
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("NVIDIA ASR Error:", err);
            return res.status(response.status).json(err);
        }

        const data = await response.json();
        res.json({ text: data.text });

    } catch (error) {
        console.error('Transcription Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the app wrapped in serverless-http for Netlify
module.exports.handler = serverless(app);
