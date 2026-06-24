const dotenv = require("dotenv")
dotenv.config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();


// Validate required environment variables early so deploys fail fast with clear logs
function validateEnv() {
  const required = ["EMAIL_USER", "EMAIL_PASS", "RECEIVER_EMAIL"];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    // Exit so the platform (Render) shows a clear failure and the logs contain the reason
    process.exit(1);
  }
}

validateEnv();


const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman, mobile apps, server-side requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0) {
      console.warn(
        "No FRONTEND_URLS configured: allowing all origins for CORS. Set FRONTEND_URLS in Render to restrict allowed origins."
      );
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(cors(corsOptions));

app.use(express.json());

/**
 * Nodemailer Transport
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP transporter on startup to catch auth/connect issues immediately
transporter
  .verify()
  .then(() => {
    console.log("✅ SMTP transporter verified and ready to send emails");
  })
  .catch((err) => {
    console.error("✖ SMTP transporter verification failed:", err);
    // Exit so hosting platform surfaces the error (prevent silent 500s)
    process.exit(1);
  });

/**
 * Health Check
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
  });
});

/**
 * Contact Form API
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

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>New Contact Form Submission</h2>

          <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%;">
            <tr>
              <td><strong>Name</strong></td>
              <td>${name}</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>${email}</td>
            </tr>
            <tr>
              <td><strong>Phone</strong></td>
              <td>${phone}</td>
            </tr>
            <tr>
              <td><strong>Message</strong></td>
              <td>${message}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * 404 Route
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