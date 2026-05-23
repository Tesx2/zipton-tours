const crypto = require("crypto");
const https = require("https");

const WORDPRESS_POSTS_URL = "https://ziptontours.great-site.net/wp-json/wp/v2/posts";

function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          resolve({
            body,
            headers: response.headers,
            statusCode: response.statusCode
          });
        });
      })
      .on("error", reject);
  });
}

function buildWordPressUrl(postId) {
  const safePostId = postId ? String(postId).replace(/[^0-9]/g, "") : "";
  const path = safePostId ? `${WORDPRESS_POSTS_URL}/${safePostId}` : WORDPRESS_POSTS_URL;
  return `${path}?_embed`;
}

function solveProtectionCookie(html) {
  const values = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)].map((match) => match[1]);

  if (values.length < 3) {
    return "";
  }

  const [keyHex, ivHex, encryptedHex] = values;
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(keyHex, "hex"),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAutoPadding(false);

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]).toString("hex");
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  try {
    const wordpressUrl = buildWordPressUrl(event.queryStringParameters?.id);
    const firstResponse = await request(wordpressUrl);
    const firstContentType = firstResponse.headers["content-type"] || "";

    if (firstContentType.includes("application/json")) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: firstResponse.body
      };
    }

    const cookieValue = solveProtectionCookie(firstResponse.body);

    if (!cookieValue) {
      return jsonResponse(502, {
        message: "WordPress API did not return JSON and the protection cookie could not be solved."
      });
    }

    const separator = wordpressUrl.includes("?") ? "&" : "?";
    const jsonUrl = `${wordpressUrl}${separator}i=1`;
    const jsonResponseFromWordPress = await request(jsonUrl, {
      Cookie: `__test=${cookieValue}`
    });
    const jsonContentType = jsonResponseFromWordPress.headers["content-type"] || "";

    if (!jsonContentType.includes("application/json")) {
      return jsonResponse(502, {
        message: "WordPress API still did not return JSON after the protection cookie was applied."
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: jsonResponseFromWordPress.body
    };
  } catch (error) {
    return jsonResponse(500, {
      message: "Failed to load WordPress posts.",
      error: error.message
    });
  }
};
