/**
 * ============================================================================
 * Page: Interview Strategy Dashboard & ATS Tailored Resume Launcher
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & FRONTEND STATE MANAGEMENT:
 * -----------------------------------------------------------
 * 1. REACT COMPONENT LIFECYCLE & EFFECT HOOKS:
 *    - `useEffect` monitors route parameters (`useParams`) to re-hydrate state on
 *      direct URL visits or page refreshes.
 *    - Cached resume state (`resumeData`) prevents redundant AI calls while enabling
 *      instant modal re-opening and fast user experience.
 *
 * 2. SEPARATION OF CONCERNS:
 *    - The Interview page displays technical questions, behavioral STAR scenarios,
 *      skill gap matrix, and the 7-day preparation roadmap.
 *    - The ATS Resume Generator is decoupled into a dedicated studio (`ResumeModal`)
 *      with inline editing, print stylesheets, and custom prompt regeneration.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import "../styles/interview.scss";
import { useinterview } from "../hooks/useinterview";
import { generateTailoredResumeApi } from "../services/interview.api";
import { ResumeModal } from "../components/ResumeModal";

const severityMap = {
  low: "low",
  med: "medium",
  high: "high"
};

export const Interview = () => {
  const { interviewid } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("technical");
  const { report, loading, error, getreportbyid } = useinterview();
  const [openQuestion, setOpenQuestion] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  // ATS Resume Modal & Generation States
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(null);

  // Fetch report by ID on direct visit or page refresh
  useEffect(() => {
    if (interviewid && (!report || report._id !== interviewid)) {
      getreportbyid(interviewid).catch((err) => {
        console.error("Error loading interview report:", err);
      });
    }
  }, [interviewid]);

  // Handler to open resume modal (fetches resume from AI if not already loaded)
  const handleOpenResume = async () => {
    if (resumeData) {
      setIsResumeModalOpen(true);
      return;
    }

    setResumeLoading(true);
    setResumeError(null);

    try {
      console.log("[Client] Requesting ATS Tailored Resume for interview report:", interviewid);
      const data = await generateTailoredResumeApi(interviewid);
      if (data?.resume) {
        setResumeData(data.resume);
        setIsResumeModalOpen(true);
      } else {
        throw new Error(data?.message || "Failed to generate tailored resume.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to generate tailored resume.";
      console.error("Resume Generation Error:", msg);
      setResumeError(msg);
      alert(`Resume Generation Notice: ${msg}`);
    } finally {
      setResumeLoading(false);
    }
  };

  // Handler for custom instruction regeneration from inside the modal
  const handleRegenerateResume = async (customInstruction) => {
    setResumeLoading(true);
    try {
      const data = await generateTailoredResumeApi(interviewid, {
        customInstructions: customInstruction
      });
      if (data?.resume) {
        setResumeData(data.resume);
        return data.resume;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to regenerate tailored resume.";
      console.error("Regenerate Error:", msg);
      alert(msg);
      throw err;
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading && !report) {
    return (
      <main className="loading-screen">
        <div className="spinner-icon">⚡</div>
        <h1>Loading interview report...</h1>
        <p>Fetching your personalized questions and preparation roadmap.</p>
      </main>
    );
  }

  if (error && !report) {
    return (
      <main className="loading-screen error-state">
        <div className="error-icon">⚠️</div>
        <h1>Report Not Found</h1>
        <p>{error || "We couldn't retrieve this interview report."}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")} style={{ marginTop: "1.5rem" }}>
          ← Back to Generator
        </button>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="loading-screen">
        <h1>Loading interview report...</h1>
      </main>
    );
  }

  const tabs = [
    {
      id: "technical",
      label: "Technical questions",
      short: "Technical"
    },
    {
      id: "behavioral",
      label: "Behavioral questions",
      short: "Behavioral"
    },
    {
      id: "roadmap",
      label: "Road Map",
      short: "Roadmap"
    }
  ];

  const technicalList = report.technicalQuestions || [];
  const behavioralList = report.behavioralQuestions || [];
  const skillGapsList = report.skillGaps || [];
  const prepPlanList = report.preparationPlan || [];
  const matchScore = typeof report.matchscore === "number" ? report.matchscore : 70;

  const currentQuestions =
    activeTab === "technical"
      ? technicalList
      : activeTab === "behavioral"
      ? behavioralList
      : [];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setOpenQuestion(null);
    setOpenDay(null);
  };

  return (
    <div className="interview-page">
      {/* Top Navbar */}
      <header className="interview-topbar" style={{
        width: "100%",
        maxWidth: "1250px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.85rem 1.5rem",
        marginBottom: "1rem",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(12px)",
        flexWrap: "wrap",
        gap: "0.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>←</span> Back to Dashboard
          </Link>
          <span style={{ color: "#475569" }}>|</span>
          <span style={{ color: "#f8fafc", fontWeight: 600, fontSize: "1rem" }}>
            {report.title || "Target Role Interview Strategy"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Prominent Tailored ATS Resume Generator Button */}
          <button
            onClick={handleOpenResume}
            disabled={resumeLoading}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#ffffff",
              border: "1px solid #38bdf8",
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 0 15px rgba(56, 189, 248, 0.25)",
              transition: "all 0.2s ease"
            }}
          >
            <span>{resumeLoading ? "⚡ Generating Resume..." : "📄 Generate 1-Page ATS Resume"}</span>
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(56, 189, 248, 0.1)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500
            }}
          >
            + New Plan
          </button>
        </div>
      </header>

      <div className="interview-board">
        {/* SIDEBAR */}
        <aside className="interview-sidebar">
          <div className="sidebar-heading">
            <span className="sidebar-dot"></span>
            INTERVIEW
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-item ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => changeTab(tab.id)}
            >
              <span className="sidebar-icon">
                {tab.id === "technical" && "⌘"}
                {tab.id === "behavioral" && "◉"}
                {tab.id === "roadmap" && "↗"}
              </span>

              <span>{tab.label}</span>

              <span className="sidebar-arrow">›</span>
            </button>
          ))}

          {/* Sidebar Resume Shortcut */}
          <div style={{ marginTop: "auto", padding: "0 0.5rem" }}>
            <button
              onClick={handleOpenResume}
              disabled={resumeLoading}
              style={{
                width: "100%",
                background: "rgba(56, 189, 248, 0.1)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "0.55rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem"
              }}
            >
              <span>📄</span>
              <span>{resumeLoading ? "Generating..." : "ATS Resume Studio"}</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <span>INTERVIEW PREP</span>
            <strong>READY</strong>
          </div>
        </aside>

        {/* MAIN */}
        <main className="interview-main">
          {/* SCORE WIDGET */}
          <div className="score-widget">
            <div
              className="score-ring"
              style={{
                "--score": `${matchScore * 3.6}deg`
              }}
            >
              <div className="score-ring-inner">
                <span>Match</span>
                <strong>{matchScore}%</strong>
              </div>
            </div>

            <div className="score-info">
              <span className="score-label">INTERVIEW MATCH</span>

              <h2>
                {matchScore >= 80 ? "Strong Match" : matchScore >= 60 ? "Moderate Match" : "Growth Opportunity"}
              </h2>

              <p>
                {matchScore >= 80
                  ? "High alignment between candidate qualifications and job expectations."
                  : matchScore >= 60
                  ? "Good baseline with specific targeted skill gaps to review before interview."
                  : "Requires focused preparation on the highlighted skill gaps."}
              </p>

              <div className="score-progress">
                <div
                  className="score-progress-fill"
                  style={{
                    width: `${matchScore}%`
                  }}
                ></div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <span className="score-status">
                  ● Profile alignment: {matchScore}%
                </span>

                <button
                  onClick={handleOpenResume}
                  disabled={resumeLoading}
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <span>✨ {resumeLoading ? "Crafting..." : "View Tailored ATS Resume"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="main-panel">
            {/* HEADER */}
            <div className="content-heading">
              <div>
                <span className="panel-header">
                  {activeTab === "technical" && "Technical Interview"}
                  {activeTab === "behavioral" && "Behavioral Interview"}
                  {activeTab === "roadmap" && "Preparation Road Map"}
                </span>

                <h1>
                  {activeTab === "technical" && "Technical Questions"}
                  {activeTab === "behavioral" && "Behavioral Questions"}
                  {activeTab === "roadmap" && `${prepPlanList.length || 7}-Day Preparation Plan`}
                </h1>
              </div>

              <div className="content-stats">
                {activeTab !== "roadmap" ? (
                  <>
                    <div>
                      <strong>{currentQuestions.length}</strong>
                      <span>Questions</span>
                    </div>

                    <div>
                      <strong>Medium</strong>
                      <span>Difficulty</span>
                    </div>

                    <div>
                      <strong>~25m</strong>
                      <span>Estimated</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>{prepPlanList.length}</strong>
                      <span>Days</span>
                    </div>

                    <div>
                      <strong>Actionable</strong>
                      <span>Roadmap</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SMALL NOTICE */}
            {activeTab !== "roadmap" && (
              <div className="question-tip">
                <span className="tip-icon">✦</span>

                <div>
                  <strong>Interview tip</strong>
                  <p>
                    Tap any question to reveal the interviewer intention and a suggested answer.
                  </p>
                </div>
              </div>
            )}

            {/* TECHNICAL QUESTIONS */}
            {activeTab === "technical" && (
              <div className="question-list">
                {technicalList.length === 0 ? (
                  <p style={{ color: "#94a3b8", padding: "2rem", textAlign: "center" }}>
                    No technical questions generated for this report.
                  </p>
                ) : (
                  technicalList.map((item, index) => (
                    <article
                      key={index}
                      className={`info-card ${
                        openQuestion === index ? "expanded" : ""
                      }`}
                      onClick={() => toggleQuestion(index)}
                    >
                      <div className="question-top">
                        <div className="question-title">
                          <span className="card-badge">
                            Q{String(index + 1).padStart(2, "0")}
                          </span>

                          <h3>{item.question}</h3>
                        </div>

                        <button
                          className="question-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleQuestion(index);
                          }}
                        >
                          {openQuestion === index ? "−" : "+"}
                        </button>
                      </div>

                      <div className="question-meta">
                        <span>Technical</span>
                        <span>Key Assessment</span>
                        <span>~4 min</span>
                      </div>

                      {openQuestion === index && (
                        <div className="question-details">
                          <div className="detail-box">
                            <span>INTERVIEWER INTENTION</span>
                            <p>{item.intention}</p>
                          </div>

                          <div className="detail-box answer-box">
                            <span>EXPECTED ANSWER</span>
                            <p>{item.answer}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {/* BEHAVIORAL QUESTIONS */}
            {activeTab === "behavioral" && (
              <div className="question-list">
                {behavioralList.length === 0 ? (
                  <p style={{ color: "#94a3b8", padding: "2rem", textAlign: "center" }}>
                    No behavioral questions generated for this report.
                  </p>
                ) : (
                  behavioralList.map((item, index) => (
                    <article
                      key={index}
                      className={`info-card ${
                        openQuestion === index ? "expanded" : ""
                      }`}
                      onClick={() => toggleQuestion(index)}
                    >
                      <div className="question-top">
                        <div className="question-title">
                          <span className="card-badge behavioral-badge">
                            B{String(index + 1).padStart(2, "0")}
                          </span>

                          <h3>{item.question}</h3>
                        </div>

                        <button
                          className="question-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleQuestion(index);
                          }}
                        >
                          {openQuestion === index ? "−" : "+"}
                        </button>
                      </div>

                      <div className="question-meta">
                        <span>Behavioral</span>
                        <span>STAR Method</span>
                        <span>~3 min</span>
                      </div>

                      {openQuestion === index && (
                        <div className="question-details">
                          <div className="detail-box">
                            <span>INTERVIEWER INTENTION</span>
                            <p>{item.intention}</p>
                          </div>

                          <div className="detail-box answer-box">
                            <span>SUGGESTED ANSWER (STAR)</span>
                            <p>{item.answer}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {/* ROADMAP */}
            {activeTab === "roadmap" && (
              <div className="roadmap-list">
                {prepPlanList.length === 0 ? (
                  <p style={{ color: "#94a3b8", padding: "2rem", textAlign: "center" }}>
                    No preparation plan generated for this report.
                  </p>
                ) : (
                  prepPlanList.map((day) => (
                    <div
                      className={`roadmap-card ${
                        openDay === day.day ? "expanded" : ""
                      }`}
                      key={day.day}
                      onClick={() =>
                        setOpenDay(openDay === day.day ? null : day.day)
                      }
                    >
                      <div className="roadmap-head">
                        <div className="day-number">
                          <span>DAY</span>
                          <strong>{day.day}</strong>
                        </div>

                        <div className="roadmap-title">
                          <span>FOCUS</span>
                          <strong>{day.focus}</strong>
                        </div>

                        <button
                          className="roadmap-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDay(
                              openDay === day.day ? null : day.day
                            );
                          }}
                        >
                          {openDay === day.day ? "−" : "+"}
                        </button>
                      </div>

                      {openDay === day.day && (
                        <ul>
                          {Array.isArray(day.tasks) &&
                            day.tasks.map((task, index) => (
                              <li key={index}>
                                <span className="task-check">✓</span>
                                {task}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="interview-side-panel">
          {/* SKILL GAPS */}
          <section className="side-section">
            <div className="side-title">
              <div>
                <span>PROFILE ANALYSIS</span>
                <h4>Skill Gaps</h4>
              </div>

              <span className="side-count">
                {skillGapsList.length}
              </span>
            </div>

            <div className="skill-list">
              {skillGapsList.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                  No major skill gaps detected!
                </p>
              ) : (
                skillGapsList.map(({ skill, severity }, idx) => (
                  <div key={idx} className="skill-row">
                    <span
                      className={`skill-dot ${
                        severityMap[severity] || "low"
                      }`}
                    ></span>

                    <span className="skill-name">{skill}</span>

                    <span
                      className={`skill-level ${
                        severityMap[severity] || "low"
                      }`}
                    >
                      {severity === "med"
                        ? "Medium"
                        : severity === "high"
                        ? "High"
                        : "Low"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="side-section">
            <div className="side-title">
              <div>
                <span>QUICK ANALYSIS</span>
                <h4>Interview Insights</h4>
              </div>
            </div>

            <div className="insight-list">
              <div className="insight-item positive">
                <span>✓</span>
                <p>Personalized role assessment complete</p>
              </div>

              <div className="insight-item positive">
                <span>✓</span>
                <p>STAR behavioral answers prepared</p>
              </div>

              <div className="insight-item warning">
                <span>!</span>
                <p>Review high severity skill gaps first</p>
              </div>

              <div className="insight-item warning">
                <span>!</span>
                <p>Follow daily roadmap sequentially</p>
              </div>
            </div>
          </section>

          {/* SELECTION OUTLOOK */}
          <section className="selection-card">
            <div className="selection-icon">✦</div>

            <div>
              <span>SELECTION OUTLOOK</span>
              <h3>{matchScore >= 75 ? "High Probability" : matchScore >= 50 ? "Moderate Probability" : "Needs Prep"}</h3>
              <p>
                {matchScore >= 75
                  ? "Your current profile matches the key role requirements."
                  : "Focus on your custom preparation roadmap to maximize chances."}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* ATS 1-PAGE TAILORED RESUME STUDIO MODAL */}
      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        initialResume={resumeData}
        reportTitle={report.title}
        interviewId={interviewid}
        onRegenerateResume={handleRegenerateResume}
        loading={resumeLoading}
      />
    </div>
  );
};

export default Interview;