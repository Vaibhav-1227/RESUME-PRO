const jwt = require("jsonwebtoken");
const tokenblacklistmodel = require("../model/blacklist.model");

async function authuser(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Authentication token not provided. Please log in."
    });
  }

  const istokenblacklisted = await tokenblacklistmodel.findOne({ token });
  if (istokenblacklisted) {
    return res.status(401).json({
      message: "Session expired or logged out. Please log in again."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = {
  authuser
};