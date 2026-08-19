const mongoose = require("mongoose");
const dns = require("node:dns");

// Fix for Windows/ISP DNS blocking MongoDB SRV queries (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  console.warn("DNS server override not applied:", e.message);
}

async function connectmongodb() {
  const uri =
    process.env.mongo_url ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/resumepro";

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ MongoDB Database Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message || err);
    console.error(
      "👉 TIP: If using MongoDB Atlas, make sure:\n" +
      "  1. Your IP is Whitelisted in Atlas (Network Access -> Add IP -> Allow Access From Anywhere: 0.0.0.0/0)\n" +
      "  2. Your Cluster is Active (not paused/deleted in cloud.mongodb.com)\n" +
      "  3. Alternatively, you can use local MongoDB: mongodb://127.0.0.1:27017/resumepro in .env"
    );
  }
}

module.exports = connectmongodb;
