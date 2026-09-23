/**
 * Women's Safety App — Relay Server
 *
 * Responsibilities:
 *   1. Receives GPS coordinates from the mobile app (POST /api/location)
 *   2. Serves the latest coordinates to downstream consumers (GET /api/location)
 *   3. Sends SMS alerts via Twilio (POST /send-sms)
 *
 * All credentials come from environment variables — see .env.example
 */
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

// --- Twilio client (credentials from env) ---
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "+14155552671";

if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
  console.warn(
    "⚠️  TWILIO_SID / TWILIO_AUTH_TOKEN not set — /send-sms will not work."
  );
}

const client =
  TWILIO_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_SID, TWILIO_AUTH_TOKEN)
    : null;

// --- In-memory GPS store ---
let lastLocation = { latitude: null, longitude: null };

// 1) Mobile app sends its GPS here (e.g. when SOS is triggered)
app.post("/api/location", (req, res) => {
  const { latitude, longitude } = req.body || {};

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({
      success: false,
      error: "latitude and longitude (number) required",
    });
  }

  lastLocation = { latitude, longitude };
  console.log("Got location:", lastLocation);
  res.json({ success: true });
});

// 2) Consumers read the latest GPS from here
app.get("/api/location", (req, res) => {
  if (lastLocation.latitude == null || lastLocation.longitude == null) {
    return res.status(404).json({
      success: false,
      error: "No location yet",
    });
  }

  res.json({
    success: true,
    latitude: lastLocation.latitude,
    longitude: lastLocation.longitude,
  });
});

// 3) Twilio SMS endpoint
app.post("/send-sms", async (req, res) => {
  if (!client) {
    return res.status(503).json({
      success: false,
      error: "Twilio not configured (missing TWILIO_SID / TWILIO_AUTH_TOKEN)",
    });
  }
  try {
    const { to, message } = req.body;

    console.log(`Sending SMS to ${to}: ${message}`);

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: to,
    });

    console.log(`SMS sent successfully: ${result.sid}`);
    res.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error("SMS Error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Relay server running on port ${PORT}`);
});
