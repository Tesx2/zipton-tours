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

function getPesaPalHost() {
  return process.env.PESAPAL_ENV === "live"
    ? "pay.pesapal.com"
    : "cybqa.pesapal.com";
}

function getPesaPalBasePath() {
  return process.env.PESAPAL_ENV === "live" ? "/v3" : "/pesapalv3";
}

function requestJSON(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const request = https.request(
      {
        ...options,
        headers: {
          Accept: "application/json",
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
          let parsed = {};

          if (data) {
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              reject(new Error(data));
              return;
            }
          }

          if (response.statusCode >= 400 || parsed.error) {
            reject(new Error(parsed.error?.message || parsed.message || "PesaPal request failed."));
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

async function getAccessToken(host, basePath) {
  const response = await requestJSON(
    {
      hostname: host,
      path: `${basePath}/api/Auth/RequestToken`,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    },
    {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }
  );

  if (!response.token) {
    throw new Error("PesaPal did not return an access token.");
  }

  return response.token;
}

async function registerIPN(host, basePath, token, siteURL) {
  if (process.env.PESAPAL_NOTIFICATION_ID) {
    return process.env.PESAPAL_NOTIFICATION_ID;
  }

  const response = await requestJSON(
    {
      hostname: host,
      path: `${basePath}/api/URLSetup/RegisterIPN`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    },
    {
      url: process.env.PESAPAL_IPN_URL || `${siteURL}/.netlify/functions/pesapal-ipn`,
      ipn_notification_type: "GET"
    }
  );

  if (!response.ipn_id) {
    throw new Error("PesaPal did not return an IPN notification ID.");
  }

  return response.ipn_id;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method not allowed." });
  }

  const missingEnv = ["PESAPAL_CONSUMER_KEY", "PESAPAL_CONSUMER_SECRET"].filter((key) => !process.env[key]);

  if (missingEnv.length) {
    return jsonResponse(500, {
      message: `PesaPal is not configured. Missing: ${missingEnv.join(", ")}.`
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const tourSlug = String(body.tour || "");
    const tourName = tourNames[tourSlug];

    if (!tourName) {
      return jsonResponse(400, { message: "Unknown tour selected." });
    }

    const host = getPesaPalHost();
    const basePath = getPesaPalBasePath();
    const siteURL = process.env.URL || event.headers.origin || "https://ziptontour.netlify.app";
    const token = await getAccessToken(host, basePath);
    const notificationID = await registerIPN(host, basePath, token, siteURL);
    const currency = process.env.PESAPAL_CURRENCY || "KES";
    const amountFromBody = Number(body.amount);
    const amount = Number.isFinite(amountFromBody) && amountFromBody > 0
      ? Math.round(amountFromBody)
      : Number(process.env.PESAPAL_RESERVATION_AMOUNT || 5000);
    const isDeposit = Boolean(body.isDeposit);
    const bookingRef = String(body.bookingRef || "");
    const reference = `ZT-${tourSlug}-${Date.now()}`.slice(0, 50);

    const order = await requestJSON(
      {
        hostname: host,
        path: `${basePath}/api/Transactions/SubmitOrderRequest`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      },
      {
        id: reference,
        currency,
        amount,
        description: tourSlug === "support-our-mission"
          ? "Donation to support local tourism and Zipton Tours community work"
          : isDeposit ? `${tourName} deposit reservation` : `${tourName} full reservation`,
        callback_url: `${siteURL}/pesapal-return.html?tour=${encodeURIComponent(tourSlug)}&bookingRef=${encodeURIComponent(
          bookingRef
        )}`,
        notification_id: notificationID,
        billing_address: {
          email_address: process.env.PESAPAL_CUSTOMER_EMAIL || "ziptontours@gmail.com",
          phone_number: process.env.PESAPAL_CUSTOMER_PHONE || "254710142850",
          country_code: process.env.PESAPAL_CUSTOMER_COUNTRY || "KE",
          first_name: "Zipton",
          last_name: "Guest"
        }
      }
    );

    if (!order.redirect_url) {
      return jsonResponse(500, { message: "PesaPal did not return a redirect URL." });
    }

    return jsonResponse(200, {
      url: order.redirect_url,
      orderTrackingID: order.order_tracking_id,
      merchantReference: order.merchant_reference
    });
  } catch (error) {
    return jsonResponse(500, { message: error.message || "PesaPal order creation failed." });
  }
};
