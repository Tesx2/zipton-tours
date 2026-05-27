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

function requestJSON(options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        let parsed;

        try {
          parsed = JSON.parse(data);
        } catch (error) {
          reject(new Error(data || "Invalid JSON response."));
          return;
        }

        if (response.statusCode >= 400) {
          reject(new Error(parsed.errorMessage || parsed.error || parsed.message || "M-Pesa request failed."));
          return;
        }

        resolve(parsed);
      });
    });

    request.on("error", reject);

    if (body) {
      request.write(JSON.stringify(body));
    }

    request.end();
  });
}

function getHost() {
  return process.env.MPESA_ENV === "production"
    ? "api.safaricom.co.ke"
    : "sandbox.safaricom.co.ke";
}

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;

  return digits;
}

async function getAccessToken(host, consumerKey, consumerSecret) {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await requestJSON({
    hostname: host,
    path: "/oauth/v1/generate?grant_type=client_credentials",
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`
    }
  });

  return response.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method not allowed." });
  }

  const requiredEnv = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY"
  ];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length) {
    return jsonResponse(500, {
      message: `M-Pesa is not configured. Missing: ${missingEnv.join(", ")}.`
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const tourSlug = String(body.tour || "");
    const phone = normalizePhone(body.phone);
    const tourName = body.tourName || tourNames[tourSlug] || "Zipton Tours reservation";

    if (!/^254[17]\d{8}$/.test(phone)) {
      return jsonResponse(400, {
        message: "Enter a valid Kenyan M-Pesa phone number, for example 0710142850."
      });
    }

    const isProduction = process.env.MPESA_ENV === "production";
    const amountFromBody = Number(body.amount);
    const amount = Number.isFinite(amountFromBody) && amountFromBody > 0
      ? Math.round(amountFromBody)
      : Number(process.env.MPESA_RESERVATION_AMOUNT_KES || (isProduction ? 0 : 1));

    if (!amount || amount < 1) {
      return jsonResponse(500, {
        message: "Set MPESA_RESERVATION_AMOUNT_KES in Netlify before using production M-Pesa payments."
      });
    }

    const host = getHost();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = formatTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const callbackURL = process.env.MPESA_CALLBACK_URL || `${process.env.URL || "https://ziptontour.netlify.app"}/.netlify/functions/mpesa-callback`;
    const accessToken = await getAccessToken(host, process.env.MPESA_CONSUMER_KEY, process.env.MPESA_CONSUMER_SECRET);

    const stkResponse = await requestJSON(
      {
        hostname: host,
        path: "/mpesa/stkpush/v1/processrequest",
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      },
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_PARTY_B || shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackURL,
        AccountReference: `Zipton-${tourSlug || "Tour"}`.slice(0, 12),
        TransactionDesc: tourName.slice(0, 100)
      }
    );

    return jsonResponse(200, {
      message: stkResponse.CustomerMessage || "M-Pesa STK Push sent. Check your phone.",
      checkoutRequestID: stkResponse.CheckoutRequestID,
      merchantRequestID: stkResponse.MerchantRequestID,
      responseCode: stkResponse.ResponseCode
    });
  } catch (error) {
    return jsonResponse(500, {
      message: error.message || "M-Pesa STK Push failed."
    });
  }
};
