const https = require("https");
const querystring = require("querystring");

const tourPrices = {
  "classic-safari-trail": {
    name: "Classic Safari Trail reservation",
    amount: 5000
  },
  "highland-culture-route": {
    name: "Highland Culture Route reservation",
    amount: 5000
  },
  "coastal-heritage-stay": {
    name: "Coastal Heritage Stay reservation",
    amount: 5000
  },
  "market-makers-weekend": {
    name: "Market & Makers Weekend reservation",
    amount: 5000
  },
  "mountain-valley-trek": {
    name: "Mountain & Valley Trek reservation",
    amount: 5000
  },
  "private-bespoke-journey": {
    name: "Private Bespoke Journey reservation",
    amount: 5000
  },
  "support-our-mission": {
    name: "Support Zipton Tours Mission",
    amount: 100000
  }
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

function createCheckoutSession(payload, secretKey) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(payload);
    const request = https.request(
      {
        hostname: "api.stripe.com",
        path: "/v1/checkout/sessions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
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
            reject(new Error(parsed.error?.message || "Stripe Checkout failed."));
            return;
          }

          resolve(parsed);
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

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return jsonResponse(500, {
      message: "Stripe is not configured. Add STRIPE_SECRET_KEY in Netlify environment variables."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const tourSlug = String(body.tour || "");
    const tour = tourPrices[tourSlug] || { 
      name: body.tourName || "Zipton Tours reservation", 
      amount: 5000 
    };

    const siteURL = process.env.URL || event.headers.origin || "https://ziptontour.netlify.app";
    const currency = process.env.STRIPE_CURRENCY || "usd";
    const currencyLower = String(currency || "").toLowerCase();

    const payloadAmount = body.amount != null ? Number(body.amount) : null;
    let amountMinor = Number(process.env.STRIPE_RESERVATION_AMOUNT_CENTS || tour.amount);
    // Safety: only convert the UI `body.amount` when Stripe currency is set to KES.
    if (currencyLower === "kes" && Number.isFinite(payloadAmount) && payloadAmount > 0) {
      amountMinor = Math.round(payloadAmount * 100);
    }

    const isDeposit = Boolean(body.isDeposit);
    const bookingRef = String(body.bookingRef || "");
    const checkout = await createCheckoutSession(
      {
        mode: "payment",
        success_url: `${siteURL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteURL}/tour-detail.html?tour=${tourSlug}`,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": currency,
        "line_items[0][price_data][unit_amount]": String(amountMinor),
        "line_items[0][price_data][product_data][name]": tour.name,
        "line_items[0][price_data][product_data][description]": tourSlug === "support-our-mission"
          ? "Donation to support local tourism and Zipton Tours community work."
          : isDeposit
          ? "Reservation deposit for Zipton Tours."
          : "Full payment for Zipton Tours.",
        "metadata[tour]": tourSlug,
        "metadata[payment_type]": tourSlug === "support-our-mission" ? "donation" : isDeposit ? "deposit" : "full_payment",
        "metadata[booking_ref]": bookingRef
      },
      secretKey
    );

    return jsonResponse(200, { url: checkout.url });
  } catch (error) {
    return jsonResponse(500, { message: error.message });
  }
};
