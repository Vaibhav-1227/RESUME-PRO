const mongoose = require("mongoose");
const dns = require("node:dns");

/**
 * Configure DNS resolution for MongoDB Atlas SRV connection strings.
 * On Windows/some ISPs, custom DNS servers (8.8.8.8) prevent SRV query failures.
 * BUT on Linux/Render cloud hosts, overriding DNS servers breaks container networking!
 * Therefore, we only apply DNS server override if on Windows.
 */
function configureDNS() {
  if (process.platform === "win32") {
    try {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    } catch (e) {
      console.warn("⚠️ DNS server override warning:", e.message);
    }
  }
}

async function connectmongodb() {
  configureDNS();

  const uri =
    process.env.mongo_url ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/resumepro";

  const maskedUri = uri.replace(/:([^@]+)@/, ":****@");
  console.log(`📡 Connecting to MongoDB (${maskedUri})...`);

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log("✅ MongoDB Database Connected Successfully");
      return;
    } catch (err) {
      console.error(`❌ MongoDB Connection Error (Attempt ${attempts}/${maxAttempts}):`, err.message || err);

      // If SRV lookup failed on non-Windows environment, try applying Google DNS fallback
      if (err.message && err.message.includes("querySrv") && process.platform !== "win32") {
        try {
          dns.setServers(["8.8.8.8", "8.8.4.4"]);
        } catch (e) {}
      }

      if (attempts >= maxAttempts) {
        console.error(
          "👉 CRITICAL: Could not connect to MongoDB Atlas after multiple attempts.\n" +
          "  1. Verify environment variable key on Render (e.g. MONGO_URL or MONGODB_URI)\n" +
          "  2. Confirm IP Whitelist on Atlas includes 0.0.0.0/0\n" +
          "  3. Check username & password in connection string"
        );
      } else {
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }
}

module.exports = connectmongodb;
