/**
 * ============================================================================
 * Interview & Tailored Resume Controller
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & BACKEND ARCHITECTURE:
 * -----------------------------------------------------
 * 1. MVC ARCHITECTURE (Model-View-Controller):
 *    - Controllers manage the business logic between incoming HTTP requests (req),
 *      database interactions (via Mongoose models), external AI services (Google GenAI),
 *      and standard HTTP responses (res).
 *
 * 2. AUTHENTICATION & MULTI-TENANCY SECURITY:
 *    - In multi-tenant SaaS apps, always filter database queries by `user: req.user.id`.
 *      This prevents Insecure Direct Object Reference (IDOR) vulnerabilities where
 *      User A could view or manipulate User B's generated resumes or interview reports.
 *
 * 3. AI ORCHESTRATION:
 *    - Reuses parsed PDF text / self-description stored in the interview report document
 *      to save re-uploading and parsing overhead on subsequent resume generation requests.
 * ============================================================================
 */

const pdfparse = require("pdf-parse");
const mongoose = require("mongoose");
const {
  generateinterviewreports,
  generateTailoredResumeAI
} = require("../services/ai.services");
const interviewreportmodel = require("../model/interviewreport");

function checkDbConnection(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database connection unavailable. Please check your MongoDB connection and Atlas IP whitelist."
    });
    return false;
  }
  return true;
}

// Controller to generate interview report based on resume file/self-description and job description
async function generateinterviewreportcontroller(req, res) {
  if (!checkDbConnection(res)) return;
  try {
    const { selfdescription, jobdescription } = req.body;

    if (!jobdescription || !jobdescription.trim()) {
      return res.status(400).json({
        message: "Job description is required"
      });
    }

    if (!req.file && (!selfdescription || !selfdescription.trim())) {
      return res.status(400).json({
        message: "Either a resume file or a self-description is required"
      });
    }

    let resumecontent = "";
    if (req.file && req.file.buffer) {
      try {
        const parser = new pdfparse.PDFParse({ data: req.file.buffer });
        const parsedResult = await parser.getText();
        resumecontent = parsedResult?.text || "";
        if (typeof parser.destroy === "function") {
          await parser.destroy();
        }
      } catch (parseErr) {
        console.error("PDF Parsing error, attempting text fallback:", parseErr);
        resumecontent = req.file.buffer.toString("utf-8");
      }
    }

    console.log("Generating interview report via AI...");
    const interviewreportai = await generateinterviewreports({
      resume: resumecontent,
      selfdescription: selfdescription || "",
      jobdescription
    });

    const interviewreport = await interviewreportmodel.create({
      user: req.user.id,
      title: interviewreportai.title || "Target Role",
      matchscore: interviewreportai.matchscore ?? 70,
      technicalQuestions: interviewreportai.technicalQuestions || [],
      behavioralQuestions: interviewreportai.behavioralQuestions || [],
      skillGaps: interviewreportai.skillGaps || [],
      preparationPlan: interviewreportai.preparationPlan || [],
      resume: resumecontent,
      selfdescription: selfdescription || "",
      jobdescription: jobdescription || ""
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewreport
    });
  } catch (err) {
    console.error("Error in generateinterviewreportcontroller:", err);
    return res.status(500).json({
      message: err.message || "Failed to generate interview report"
    });
  }
}

// Controller to get interview report on the basis of id
async function getinterviewreportbyidcontroller(req, res) {
  try {
    const { interviewid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewid)) {
      return res.status(400).json({
        message: "Invalid interview report ID format"
      });
    }

    const interviewreport = await interviewreportmodel.findOne({
      _id: interviewid,
      user: req.user.id
    });

    if (!interviewreport) {
      return res.status(404).json({
        message: "Interview report not found"
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      interviewreport
    });
  } catch (err) {
    console.error("Error in getinterviewreportbyidcontroller:", err);
    return res.status(500).json({
      message: "Failed to fetch interview report",
      error: err.message
    });
  }
}

// Controller which fetches all the reports of the current logged in user
async function getallinterviewrreportcontroller(req, res) {
  try {
    const interviewreports = await interviewreportmodel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -selfdescription -jobdescription -__v");

    return res.status(200).json({
      message: "Interview reports fetched successfully",
      interviewreports
    });
  } catch (err) {
    console.error("Error in getallinterviewrreportcontroller:", err);
    return res.status(500).json({
      message: "Failed to fetch interview reports",
      error: err.message
    });
  }
}

/**
 * Controller to generate an ATS-Friendly 1-Page Tailored Resume
 * 
 * Fetches the user's specific interview report (which contains their original resume/selfdescription
 * and target job description) and uses Gemini AI to tailor an ATS-compliant, human-sounding resume.
 */
async function generateTailoredResumeController(req, res) {
  if (!checkDbConnection(res)) return;
  try {
    const { interviewid } = req.params;
    const { customInstructions, tone } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(interviewid)) {
      return res.status(400).json({
        message: "Invalid interview report ID format"
      });
    }

    const report = await interviewreportmodel.findOne({
      _id: interviewid,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        message: "Interview report not found"
      });
    }

    console.log(`[Resume-Gen] Synthesizing tailored 1-page resume for report ${interviewid}...`);
    const tailoredResume = await generateTailoredResumeAI({
      resume: report.resume || "",
      selfdescription: report.selfdescription || "",
      jobdescription: report.jobdescription || "",
      customInstructions: customInstructions || "",
      tone: tone || "impactful"
    });

    return res.status(200).json({
      message: "ATS-friendly tailored resume generated successfully",
      resume: tailoredResume,
      reportTitle: report.title,
      targetJob: report.jobdescription
    });
  } catch (err) {
    console.error("Error in generateTailoredResumeController:", err);
    return res.status(500).json({
      message: err.message || "Failed to generate tailored resume"
    });
  }
}

// Controller to delete an interview report by ID for the logged in user
async function deleteinterviewreportcontroller(req, res) {
  try {
    const { interviewid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewid)) {
      return res.status(400).json({
        message: "Invalid interview report ID format"
      });
    }

    const deletedReport = await interviewreportmodel.findOneAndDelete({
      _id: interviewid,
      user: req.user.id
    });

    if (!deletedReport) {
      return res.status(404).json({
        message: "Interview report not found or unauthorized"
      });
    }

    return res.status(200).json({
      message: "Interview report deleted successfully",
      deletedId: interviewid
    });
  } catch (err) {
    console.error("Error in deleteinterviewreportcontroller:", err);
    return res.status(500).json({
      message: "Failed to delete interview report",
      error: err.message
    });
  }
}

module.exports = {
  generateinterviewreportcontroller,
  getinterviewreportbyidcontroller,
  getallinterviewrreportcontroller,
  generateTailoredResumeController,
  deleteinterviewreportcontroller
};