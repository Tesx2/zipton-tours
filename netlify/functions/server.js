const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
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
const WORDPRESS_URL = process.env.WORDPRESS_URL ? process.env.WORDPRESS_URL.replace(/\/$/, "") : "https://ziptontours.great-site.net";

if (!NVIDIA_API_KEY) {
    console.warn("Backend Warning: NVIDIA_API_KEY is missing from environment variables.");
}
if (!WORDPRESS_URL) {
    console.warn("Backend Warning: WORDPRESS_URL is missing from environment variables.");
}

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

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

        filesToRead.forEach(file => {
            const filePath = path.resolve(__dirname, "../../", file);
            if (fs.existsSync(filePath)) {
                const html = fs.readFileSync(filePath, "utf8");
                const text = html
                    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi, "") // Skip navigation
                    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi, "") // Skip footer
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "") // Skip scripts
                    .replace(/<\/?[^>]+(>|$)/g, " ") // Strip tags
                    .replace(/\s+/g, " ") // Clean whitespace
                    .trim();
                staticContext += `FROM ${file}: ${text.substring(0, 1500)}\n\n`;
            }
        });
        return staticContext;
    } catch (err) {
        return "Static website info unavailable.";
    }
}

async function getWebsiteContent() {
    const now = Date.now();
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

        const context = `${staticContext}\n\nDYNAMIC UPDATES:\n${wpContext}`;

        cachedContext = context;
        lastCacheUpdate = now;
        return context;
    } catch (e) {
        return cachedContext || "Website content currently unavailable.";
    }
}

const router = express.Router();
app.use('/.netlify/functions/server', router);
app.use('/', router);

router.post('/api/chat', async (req, res) => {
    try {
        console.log('Function started for /api/chat');
        if (!NVIDIA_API_KEY) {
            console.error("NVIDIA_API_KEY is not configured.");
            return res.status(500).json({ error: "NVIDIA_API_KEY is not configured on the server." });
        }

        console.log('Fetching website content...');
        const websiteContext = await getWebsiteContent();
        console.log('Website content fetched. Length:', websiteContext.length);
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
            4. Be extremely concise and keep your responses very brief (under 100 words).
            5. Always encourage users to book or ask for contact details.`
        };

        console.log('Sending request to NVIDIA API...');
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
                max_tokens: 300
            })
        });
        console.log('Received response from NVIDIA API. Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('NVIDIA API returned error:', errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        console.log('NVIDIA API data received successfully.');
        res.json(data);
    } catch (error) {
        console.error('Server Error in /api/chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the app wrapped in serverless-http for Netlify
module.exports.handler = serverless(app);