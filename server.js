const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

/**
 * CORS CONFIG
 */
app.use(
  cors({
    origin: [
      "https://portfolio-1-9ajc.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * RESEND SETUP
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
  });
});

/**
 * CONTACT API
 */
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      reply_to: email,
      html: `
        <div style="font-family:Arial;padding:20px;background:#f4f6f9;">
          <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #eee;">
            <div style="background:#4f46e5;color:#fff;padding:15px;text-align:center;">
              <h2 style="margin:0;">📩 New Contact Form Submission</h2>
            </div>

            <div style="padding:20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px;font-weight:bold;">Name</td>
                  <td style="padding:10px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px;font-weight:bold;">Email</td>
                  <td style="padding:10px;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:10px;font-weight:bold;">Phone</td>
                  <td style="padding:10px;">${phone}</td>
                </tr>
                <tr>
                  <td style="padding:10px;font-weight:bold;">Message</td>
                  <td style="padding:10px;">${message}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully 🚀",
    });
  } catch (error) {
    console.error("❌ Resend Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
});

/**
 * 404
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});