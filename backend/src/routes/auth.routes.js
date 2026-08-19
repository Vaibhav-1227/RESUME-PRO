const express = require("express");
const mongoose = require("mongoose");
const authrouter = express.Router();
const authcontroller = require("../controller/auth.controller");
const authmiddleware = require("../middleware/auth.middleware");

authrouter.get("/health", (req, res) => {
  const mongoEnvKeys = [
    "mongo_url",
    "MONGO_URL",
    "MONGODB_URI",
    "MONGO_URI",
    "MONGODB_URL",
    "DATABASE_URL",
  ];
  const foundKeys = mongoEnvKeys.filter((key) => !!process.env[key]);
  res.json({
    status: "ok",
    readyState: mongoose.connection.readyState,
    readyStateText:
      ["disconnected", "connected", "connecting", "disconnecting"][
        mongoose.connection.readyState
      ] || "unknown",
    foundEnvKeys: foundKeys,
    hasMongoUri: foundKeys.length > 0,
  });
});

authrouter.post("/register", authcontroller.registercontroller);
authrouter.post("/login", authcontroller.logincontroller);
authrouter.get("/logout", authcontroller.logoutcontroller);
authrouter.get(
  "/get-me",
  authmiddleware.authuser,
  authcontroller.getmecontroller
);

module.exports = authrouter; 