/**
 * ============================================================================
 * Interview & Tailored Resume API Service
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & FRONTEND API DESIGN:
 * -----------------------------------------------------
 * 1. AXIOS CLIENT CONFIGURATION:
 *    - `withCredentials: true` ensures that HTTP-only authentication cookies (JWT tokens)
 *      are automatically attached across Cross-Origin (CORS) requests between frontend (Vite: 5173)
 *      and backend (Express: 3000).
 *
 * 2. MULTIPART VS JSON REQUESTS:
 *    - `generateinterviewreport`: Uses `FormData` because of binary PDF file upload.
 *    - `generateTailoredResumeApi`: Uses standard JSON payload for passing custom tuning
 *      instructions, desired tone, and interview strategy IDs.
 * ============================================================================
 */

import axios from "axios";

const api = axios.create({
  baseURL: "https://resume-pro-7yxu.onrender.com",
  withCredentials: true,
});

// Service to generate interview report with optional PDF upload
export const generateinterviewreport = async ({
  selfdescription,
  jobdescription,
  resumefile,
}) => {
  const formdata = new FormData();

  if (jobdescription) {
    formdata.append("jobdescription", jobdescription);
  }
  if (selfdescription) {
    formdata.append("selfdescription", selfdescription);
  }
  if (resumefile) {
    formdata.append("resumefile", resumefile);
  }

  const response = await api.post("/api/interview", formdata, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Get interview report by ID
export const getinterviewbyid = async (interviewid) => {
  const response = await api.get(`/api/interview/report/${interviewid}`);
  return response.data;
};

// Get all interview reports for current user
export const getallinterviewreports = async () => {
  const response = await api.get("/api/interview");
  return response.data;
};

/**
 * Service to generate or regenerate an ATS-friendly 1-Page Tailored Resume
 * @param {string} interviewid - ID of the interview report
 * @param {object} options - Optional { customInstructions, tone }
 */
export const generateTailoredResumeApi = async (interviewid, options = {}) => {
  const response = await api.post(
    `/api/interview/resume/generate/${interviewid}`,
    options
  );
  return response.data;
};

// Delete interview report by ID
export const deleteinterviewreport = async (interviewid) => {
  const response = await api.delete(`/api/interview/${interviewid}`);
  return response.data;
};