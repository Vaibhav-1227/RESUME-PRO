const usermodel = require("../model/user");
const tokenblacklistmodel = require("../model/blacklist.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function checkDbConnection(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database connection unavailable. Please check your MongoDB connection and Atlas IP whitelist."
    });
    return false;
  }
  return true;
}

/**
 * @name registercontroller
 * @description Register a new user with username, email and password
 * @access public
 */
async function registercontroller(req, res) {
  if (!checkDbConnection(res)) return;
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    const existing = await usermodel.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "User with given email or username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await usermodel.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || true;
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

/**
 * @name logincontroller
 * @description login a user with email and password
 * @access public
 */
async function logincontroller(req, res) {
  if (!checkDbConnection(res)) return;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await usermodel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const ispassword = await bcrypt.compare(password, user.password);
    if (!ispassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || true;
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    });

    return res.status(200).json({
      message: "User login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// logout controller
async function logoutcontroller(req, res) {
  try {
    const token = req.cookies?.token;
    if (token) {
      await tokenblacklistmodel.create({ token });
    }
    res.clearCookie("token");
    return res.status(200).json({
      message: "User logout successful"
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.clearCookie("token");
    return res.status(200).json({
      message: "User logged out"
    });
  }
}

// get the current logged in user details
async function getmecontroller(req, res) {
  try {
    const user = await usermodel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User details fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = {
  registercontroller,
  logincontroller,
  logoutcontroller,
  getmecontroller
};