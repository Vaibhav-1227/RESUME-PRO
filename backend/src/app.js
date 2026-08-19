const express = require("express");
const cookieparser = require("cookie-parser");
const cors = require("cors");
const app = express();

const allowedOrigins = [
  "https://resume-pro-ten.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173"
];

if (process.env.FRONTEND_URL) {
  const cleanFrontendUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
  if (!allowedOrigins.includes(cleanFrontendUrl)) {
    allowedOrigins.push(cleanFrontendUrl);
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieparser());

const authrouter = require("./routes/auth.routes");
const interviewrouter = require("./routes/interview.routes");

app.use("/api/auth", authrouter);
app.use("/api/interview", interviewrouter);

module.exports = app;