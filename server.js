const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/**
 * CORS (safe for production)
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URLS
      ? process.env.FRONTEND_URLS.split(",")
      : "*",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * SMTP TRANSPORT (FIXED)
 * ⚠️ Gmail + Render = unstable, but this is best possible config
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // IMPORTANT: true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

/**
 * Verify SMTP on startup
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error.message);
  } else {
    console.log("✅ SMTP Connected Successfully");
  }
});

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

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: "New Contact Form Submission",
      html: `
  <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e5e5;">
      
      <!-- Header -->
      <div style="background:#4f46e5;color:#ffffff;padding:16px 20px;text-align:center;">
        <h2 style="margin:0;font-size:20px;">📩 New Contact Form Submission</h2>
      </div>

      <!-- Body -->
      <div style="padding:20px;">

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          
          <tr>
            <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;width:120px;color:#333;">Name</td>
            <td style="padding:12px;border-bottom:1px solid #eee;color:#555;">${name}</td>
          </tr>

          <tr>
            <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;color:#333;">Email</td>
            <td style="padding:12px;border-bottom:1px solid #eee;color:#555;">${email}</td>
          </tr>

          <tr>
            <td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;color:#333;">Phone</td>
            <td style="padding:12px;border-bottom:1px solid #eee;color:#555;">${phone}</td>
          </tr>

          <tr>
            <td style="padding:12px;font-weight:bold;color:#333;vertical-align:top;">Message</td>
            <td style="padding:12px;color:#555;line-height:1.5;">
              ${message}
            </td>
          </tr>

        </table>

        <!-- Footer Note -->
        <div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:6px;font-size:12px;color:#777;text-align:center;">
          This message was sent from your website contact form
        </div>

      </div>
    </div>

  </div>
`,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
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
