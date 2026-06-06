const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

/**
 * Script to automate the generation of team-manifest.json and knowledge-manifest.json
 * Run this using: node generate-manifest.js
 */

const TEAM_IMAGES_DIR = path.join(__dirname, 'images', 'team');
const MANIFEST_PATH = path.join(__dirname, 'team-manifest.json');
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge-manifest.json');
const WORDPRESS_URL = (process.env.WORDPRESS_URL || "https://ziptontours.great-site.net").replace(/\/$/, "");

/**
 * Helper for WordPress sites with JS-based protection
 */
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
        const req = https.get(url, { headers, timeout: 5000 }, (res) => { 
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
        if (!cookie) return [];
        const separator = url.includes("?") ? "&" : "?";
        const finalRes = await wpRequest(`${url}${separator}i=1`, { Cookie: `__test=${cookie}` });
        if (!finalRes.headers["content-type"]?.includes("application/json")) return [];
        return JSON.parse(finalRes.body);
    } catch (e) {
        console.error(`Error fetching ${url}:`, e.message);
        return [];
    }
}

async function generateManifests() {
    const teamManifest = {};
    const siteKnowledge = {
        lastUpdated: new Date().toISOString(),
        wordpressContent: "",
        tours: []
    };
    
    try {
        // 1. Generate Team Manifest
        if (!fs.existsSync(TEAM_IMAGES_DIR)) {
            console.error(`❌ Directory not found: ${TEAM_IMAGES_DIR}`);
        } else {
            const files = fs.readdirSync(TEAM_IMAGES_DIR);
            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                const basename = path.basename(file, ext);
                if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;
                if (basename.toLowerCase() === 'placeholder') {
                    teamManifest['Default'] = file;
                } else {
                    const humanName = basename.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    teamManifest[humanName] = file;
                }
            });
            fs.writeFileSync(MANIFEST_PATH, JSON.stringify(teamManifest, null, 2), 'utf8');
            console.log(`✅ Successfully generated team manifest.`);
        }

        // 2. Fetch WordPress Content for Knowledge Base
        console.log(`⏳ Fetching knowledge from WordPress...`);
        const posts = await fetchWpJson(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=20`);
        const pages = await fetchWpJson(`${WORDPRESS_URL}/wp-json/wp/v2/pages?per_page=10`);
        
        const allItems = [...(Array.isArray(posts) ? posts : []), ...(Array.isArray(pages) ? pages : [])];
        
        siteKnowledge.wordpressContent = allItems.map(item => {
            const title = item.title?.rendered || "Untitled";
            const excerpt = (item.excerpt?.rendered || "").replace(/<\/?[^>]+(>|$)/g, ""); 
            const slug = item.slug || "";
            
            // Build a searchable tours array for the local fallback
            siteKnowledge.tours.push({ title, slug });
            
            return `ITEM: ${title}\nDETAILS: ${excerpt}`;
        }).join("\n\n");

        fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(siteKnowledge, null, 2), 'utf8');
        console.log(`✅ Successfully generated knowledge manifest.`);

    } catch (error) {
        console.error('❌ Error generating manifest:', error);
    }
}

generateManifests();