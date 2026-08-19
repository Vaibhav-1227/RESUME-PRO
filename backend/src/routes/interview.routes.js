/**
 * ============================================================================
 * Interview & Tailored Resume Express Routes
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & REST API DESIGN:
 * ------------------------------------------------
 * 1. RESTFUL ROUTE CONVENTIONS:
 *    - POST /api/interview -> Create a new interview preparation report
 *    - GET  /api/interview -> Retrieve all reports for the logged-in user
 *    - GET  /api/interview/report/:interviewid -> Fetch a specific report by ID
 *    - POST /api/interview/resume/generate/:interviewid -> Generate an ATS-friendly
 *           1-page tailored resume specifically linked to this interview strategy.
 *
 * 2. MIDDLEWARE CHAINING IN EXPRESS:
 *    - `authmiddleware.authuser` intercepts the request first, verifies the JWT token
 *      from HTTP-only cookies, attaches decoded user info to `req.user`, and calls `next()`.
 *    - `upload.single("resumefile")` parses multipart form data (PDF resume) into `req.file.buffer`.
 *    - Controller executes final business logic.
 * ============================================================================
 */

const express = require("express");
const authmiddleware = require("../middleware/auth.middleware");
const interviewcontroller = require("../controller/interview.controller");
const upload = require("../middleware/file.middleware");

const interviewrouter = express.Router();

// Generate interview report (private route with multipart PDF upload)
interviewrouter.post(
  "/",
  authmiddleware.authuser,
  upload.single("resumefile"),
  interviewcontroller.generateinterviewreportcontroller
);

// Get all interview reports for logged in user
interviewrouter.get(
  "/",
  authmiddleware.authuser,
  interviewcontroller.getallinterviewrreportcontroller
);

// Generate ATS-Friendly Tailored 1-Page Resume for a given report
interviewrouter.post(
  "/resume/generate/:interviewid",
  authmiddleware.authuser,
  interviewcontroller.generateTailoredResumeController
);

// Alias route for tailored resume generation
interviewrouter.post(
  "/:interviewid/resume",
  authmiddleware.authuser,
  interviewcontroller.generateTailoredResumeController
);

// Get specific interview report by ID
interviewrouter.get(
  "/report/:interviewid",
  authmiddleware.authuser,
  interviewcontroller.getinterviewreportbyidcontroller
);

interviewrouter.get(
  "/:interviewid",
  authmiddleware.authuser,
  interviewcontroller.getinterviewreportbyidcontroller
);

// Delete specific interview report by ID
interviewrouter.delete(
  "/report/:interviewid",
  authmiddleware.authuser,
  interviewcontroller.deleteinterviewreportcontroller
);

interviewrouter.delete(
  "/:interviewid",
  authmiddleware.authuser,
  interviewcontroller.deleteinterviewreportcontroller
);

module.exports = interviewrouter;