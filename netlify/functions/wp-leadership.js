const crypto = require("crypto");
const https = require("https");

const WORDPRESS_BASE_URL = "https://ziptontours.great-site.net/wp-json/wp/v2";

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

async function fetchJson(url) {
  const firstResponse = await request(url);
  const firstContentType = firstResponse.headers["content-type"] || "";

  if (firstContentType.includes("application/json")) {
    return JSON.parse(firstResponse.body);
  }

  const cookieValue = solveProtectionCookie(firstResponse.body);

  if (!cookieValue) {
    throw new Error("WordPress API did not return JSON and the protection cookie could not be solved.");
  }

  const separator = url.includes("?") ? "&" : "?";
  const jsonUrl = `${url}${separator}i=1`;
  const jsonResponseFromWordPress = await request(jsonUrl, {
    Cookie: `__test=${cookieValue}`
  });
  const jsonContentType = jsonResponseFromWordPress.headers["content-type"] || "";

  if (!jsonContentType.includes("application/json")) {
    throw new Error("WordPress API still did not return JSON after the protection cookie was applied.");
  }

  return JSON.parse(jsonResponseFromWordPress.body);
}

exports.handler = async () => {
  try {
    const params = new URLSearchParams({
      _embed: "1",
      per_page: "100",
      orderby: "menu_order",
      order: "asc"
    });

    const endpoint = `${WORDPRESS_BASE_URL}/leadership?${params.toString()}`;
    console.log("Leadership WordPress Endpoint:", endpoint);

    const leadership = await fetchJson(endpoint);
    return jsonResponse(200, leadership);
  } catch (error) {
    return jsonResponse(500, {
      message: "Failed to load WordPress leadership members.",
      error: error.message
    });
  }
};
