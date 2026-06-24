const dotenv = require("dotenv")
dotenv.config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();


app.use(cors({
  origin: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",") : "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Nodemailer Transport
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  requireTLS: true,
  family: 4,
  connectionTimeout: 10000,
  socketTimeout: 10000,
  pool: {
    maxConnections: 5,
    maxMessages: 200,
    rateDelta: 4000,
    rateLimit: true,
  },
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