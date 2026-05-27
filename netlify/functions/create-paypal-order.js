const https = require("https");

const tourNames = {
  "classic-safari-trail": "Classic Safari Trail",
  "highland-culture-route": "Highland Culture Route",
  "coastal-heritage-stay": "Coastal Heritage Stay",
  "market-makers-weekend": "Market & Makers Weekend",
  "mountain-valley-trek": "Mountain & Valley Trek",
  "private-bespoke-journey": "Private Bespoke Journey",
  "support-our-mission": "Support Zipton Tours Mission"
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const payload = body ? JSON.stringify(body) : null;
    const request = https.request(
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          let parsed;

          try {
            parsed = JSON.parse(data);
          } catch (error) {
            reject(new Error(data || "Invalid PayPal response."));
            return;
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

    if (payload) {
      request.write(payload);
    }

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
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

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
    const tourSlug = String(body.tour || "");
    const tourName = tourNames[tourSlug];

    if (!tourName) {
      return jsonResponse(400, { message: "Unknown tour selected." });
    }

    const host = getPayPalHost();
    const accessToken = await requestPayPalToken(host, clientId, clientSecret);
    const siteURL = process.env.URL || event.headers.origin || "https://ziptontour.netlify.app";
    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const amountFromBody = body.amount != null ? String(body.amount) : null;
    const amount = amountFromBody || process.env.PAYPAL_RESERVATION_AMOUNT || "50.00";
    const isDeposit = Boolean(body.isDeposit);
    const bookingRef = String(body.bookingRef || "");

    const order = await requestJSON(
      {
        hostname: host,
        path: "/v2/checkout/orders",
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      },
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: tourSlug,
            description: tourSlug === "support-our-mission"
              ? "Donation to support local tourism and Zipton Tours community work"
              : isDeposit ? `${tourName} deposit reservation` : `${tourName} full reservation`,
            amount: {
              currency_code: currency,
              value: amount
            }
          }
        ],
        application_context: {
          brand_name: "Zipton Tours",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${siteURL}/paypal-return.html?tour=${encodeURIComponent(tourSlug)}&bookingRef=${encodeURIComponent(bookingRef)}`,
          cancel_url: `${siteURL}/tour-detail.html?tour=${encodeURIComponent(tourSlug)}`
        }
      }
    );

    console.log("PayPal Order Response:", JSON.stringify(order, null, 2));

    const approveLink = order.links?.find((link) => link.rel === "approve")?.href;

    if (!approveLink) {
      return jsonResponse(500, { message: "PayPal did not return an approval link." });
    }

    return jsonResponse(200, {
      id: order.id,
      approvalUrl: approveLink, // Ensure approvalUrl is explicitly returned for client-side check
      url: approveLink
    });
  } catch (error) {
    return jsonResponse(500, { message: error.message || "PayPal order creation failed." });
  }
};
