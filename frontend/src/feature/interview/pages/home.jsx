import React, { useState, useRef, useEffect } from "react";
import "../styles/home.scss";
import { useinterview } from "../hooks/useinterview";
import { useAuth } from "../../auth/hooks/authhooks.js";
import { useNavigate, Link } from "react-router";

export const Home = () => {
  const { loading, generatereport, getreports, reports, deletereport } = useinterview();
  const { user, handlelogout } = useAuth();

  const [jobdescription, setjobdescription] = useState("");
  const [selfdescription, setselfdescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const resumeinputref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // Load past reports history on mount
    getreports().catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationError("");
    }
  };

  const removeFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    if (resumeinputref.current) {
      resumeinputref.current.value = "";
    }
  };

  const handleDeleteReport = async (e, reportId) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this interview plan? This cannot be undone.")) {
      try {
        setDeletingId(reportId);
        await deletereport(reportId);
      } catch (err) {
        alert("Failed to delete interview report: " + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handlegeneratereport = async () => {
    setValidationError("");

    if (!jobdescription.trim()) {
      setValidationError("Please paste a target job description before continuing.");
      return;
    }

    if (!selectedFile && !selfdescription.trim()) {
      setValidationError("Please either upload a resume file (PDF) or provide a quick self-description.");
      return;
    }

    try {
      console.log("Generating report with file:", selectedFile?.name);
      const data = await generatereport({
        jobdescription: jobdescription.trim(),
        selfdescription: selfdescription.trim(),
        resumefile: selectedFile
      });

      console.log("GENERATED REPORT DATA:", data);

      if (data?._id) {
        navigate(`/interview/${data._id}`);
      } else {
        setValidationError("Interview report generated, but received invalid report ID.");
      }
    } catch (err) {
      console.error("Generate report error:", err);
      setValidationError(err.message || "Failed to generate report. Please verify your API key and input.");
    }
  };

  if (loading) {
    return (
      <main className="loading-screen" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 1.5s infinite" }}>🚀</div>
        <h1 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>Generating Your Interview Strategy...</h1>
        <p style={{ color: "#94a3b8", maxWidth: "460px", textAlign: "center" }}>
          Gemini AI is analyzing role requirements, matching skill overlaps, crafting tailored technical & behavioral questions, and building a 7-day preparation roadmap.
        </p>
      </main>
    );
  }

  return (
    <main className="home">
      {/* Navigation Bar */}
      <header style={{
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        background: "rgba(15, 23, 42, 0.4)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🎯</span>
          <strong style={{ color: "#f8fafc", fontSize: "1.1rem" }}>ResumePro AI</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Welcome, <strong style={{ color: "#38bdf8" }}>{user?.username || "Candidate"}</strong>
          </span>
          <button
            onClick={handlelogout}
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "0.35rem 0.8rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="home-heading">
        <h1>
          Create Your Custom <span>Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile
          <br />
          to build a winning strategy.
        </p>
      </div>

      {validationError && (
        <div style={{
          maxWidth: "960px",
          margin: "0 auto 1.5rem",
          padding: "1rem 1.25rem",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "8px",
          color: "#fca5a5",
          fontSize: "0.95rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      <section className="interview-card">
        <div className="job-section">
          <div className="section-title">
            <h3>💼 Target Job Description</h3>
            <span>REQUIRED</span>
          </div>

          <textarea
            value={jobdescription}
            onChange={(e) => setjobdescription(e.target.value)}
            name="jobDescription"
            id="jobDescription"
            placeholder={`Paste the full job description here...
e.g. 'Frontend Developer requires proficiency in React, JavaScript, TypeScript, and modern CSS...'`}
          />

          <div className="character-count">
            {jobdescription.length} / 5000 chars
          </div>
        </div>

        <div className="profile-section">
          <div className="input-group">
            <label htmlFor="resume">
              Upload Resume
              <span>BEST RESULTS</span>
            </label>

            <label className="upload-box" htmlFor="resume" style={{ cursor: "pointer" }}>
              <div className="upload-icon">⇧</div>

              {selectedFile ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <strong style={{ color: "#38bdf8" }}>📄 {selectedFile.name}</strong>
                  <small style={{ color: "#94a3b8" }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to replace
                  </small>
                  <button
                    onClick={removeFile}
                    style={{
                      marginTop: "0.5rem",
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "none",
                      color: "#f87171",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.75rem"
                    }}
                  >
                    ✕ Remove File
                  </button>
                </div>
              ) : (
                <>
                  <strong>Click to upload or drag & drop</strong>
                  <small>PDF format (Max 5MB)</small>
                </>
              )}

              <input
                ref={resumeinputref}
                type="file"
                name="resume"
                id="resume"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div className="or">
            <span>OR</span>
          </div>

          <div className="input-group">
            <label htmlFor="selfdescription">
              Quick Self-Description
            </label>

            <textarea
              value={selfdescription}
              onChange={(e) => setselfdescription(e.target.value)}
              name="selfdescription"
              id="selfdescription"
              placeholder="Briefly describe your experience, key tech stack, projects, and strengths..."
            />
          </div>

          <div className="info-box">
            <span>●</span>
            <p>
              Either a Resume PDF or a Self Description is required to generate your personalized plan.
            </p>
          </div>
        </div>

        <div className="card-footer">
          <p>
            AI-Powered Strategy Generation • Gemini 3.6 Flash / 3.7 Flash
          </p>

          <button
            onClick={handlegeneratereport}
            disabled={loading}
            className="generate-btn"
          >
            ★ Generate My Interview Strategy
          </button>
        </div>
      </section>

      {/* Past Reports History */}
      {Array.isArray(reports) && reports.length > 0 && (
        <section style={{ maxWidth: "960px", margin: "3rem auto 0", width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", color: "#f8fafc", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🕒</span> Previous Interview Plans ({reports.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {reports.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/interview/${item._id}`)}
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s ease"
                }}
                className="report-history-card"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", paddingRight: "1.8rem" }}>
                  <h4 style={{ color: "#f8fafc", margin: 0, fontSize: "1rem" }}>{item.title || "Interview Strategy"}</h4>
                  <span style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap"
                  }}>
                    {item.matchscore || 0}%
                  </span>
                </div>

                {/* Delete / Cross Button */}
                <button
                  onClick={(e) => handleDeleteReport(e, item._id)}
                  disabled={deletingId === item._id}
                  title="Delete this interview report"
                  style={{
                    position: "absolute",
                    top: "0.85rem",
                    right: "0.85rem",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    lineHeight: 1,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.35)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                >
                  {deletingId === item._id ? "…" : "✕"}
                </button>

                <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
                  Generated on {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bottom-links">
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>Help Center</span>
      </div>
    </main>
  );
};

export default Home;