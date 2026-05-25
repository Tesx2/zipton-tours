const https = require("https");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

function getPayPalHost() {
  return process.env.PAYPAL_ENV === "live"
    ? "api-m.paypal.com"
    : "api-m.sandbox.paypal.com";
}

function requestJSON(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const request = https.request(
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          let parsed = {};

          if (data) {
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              reject(new Error(data));
              return;
            }
          }

          if (response.statusCode >= 400) {
            reject(new Error(parsed.message || parsed.error_description || "PayPal request failed."));
            return;
          }

          resolve(parsed);
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function requestPayPalToken(host, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const body = "grant_type=client_credentials";
    const request = https.request(
      {
        hostname: host,
        path: "/v1/oauth2/token",
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const parsed = JSON.parse(data);

          if (response.statusCode >= 400) {
            reject(new Error(parsed.error_description || "PayPal authentication failed."));
            return;
          }

          resolve(parsed.access_token);
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method not allowed." });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return jsonResponse(500, {
      message: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Netlify environment variables."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const orderID = String(body.orderID || "");

    if (!orderID) {
      return jsonResponse(400, { message: "Missing PayPal order ID." });
    }

    const host = getPayPalHost();
    const accessToken = await requestPayPalToken(host, clientId, clientSecret);
    const capture = await requestJSON(
      {
        hostname: host,
        path: `/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      },
      {}
    );

    return jsonResponse(200, {
      status: capture.status,
      id: capture.id
    });
  } catch (error) {
    return jsonResponse(500, { message: error.message || "PayPal capture failed." });
  }
};
