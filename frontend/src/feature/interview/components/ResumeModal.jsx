/**
 * ============================================================================
 * Component: AI ATS-Friendly 1-Page Tailored Resume Studio (Modal & Editor)
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & FRONTEND ARCHITECTURE:
 * ------------------------------------------------------
 * 1. ATS COMPATIBILITY DESIGN:
 *    - Uses a semantic single-column hierarchy that ATS parsers parse reliably.
 *    - All links (LinkedIn, GitHub, Portfolio) are properly sanitized and formatted
 *      as live interactive links (`target="_blank" rel="noopener noreferrer"`).
 *
 * 2. REAL-TIME CLIENT-SIDE STATE & INLINE EDITING:
 *    - Allows the user to fine-tune any AI-generated metric, skill, or bullet point
 *      without requiring another round-trip API call.
 *
 * 3. ZERO-DEPENDENCY PRINT-TO-PDF:
 *    - Instead of heavy client-side canvas rasterizers that ruin text crispness and links,
 *      we leverage CSS `@media print` + `window.print()`. This preserves sharp vector fonts
 *      and active hyperlinks in the downloaded PDF.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/resume.scss";

export const ResumeModal = ({
  isOpen,
  onClose,
  initialResume,
  reportTitle,
  interviewId,
  onRegenerateResume,
  loading: parentLoading
}) => {
  const [resume, setResume] = useState(initialResume);
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "coach"
  const [isEditing, setIsEditing] = useState(false);
  const [showRegenBox, setShowRegenBox] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.9); // Default 90% scale for fit

  // Sync state if initialResume changes
  useEffect(() => {
    if (initialResume) {
      setResume(initialResume);
    }
  }, [initialResume]);

  // Handle PDF Download via native print engine
  const handleDownloadPDF = () => {
    window.print();
  };

  // Handle Copy as Plain Text / Markdown for ATS job board input fields
  const handleCopyText = () => {
    if (!resume) return;

    const { personalInfo, summary, skills, experience, projects, achievements, education, certifications } = resume;

    let text = `${(personalInfo?.name || "CANDIDATE").toUpperCase()}\n`;
    if (personalInfo?.phone || personalInfo?.email || personalInfo?.linkedin || personalInfo?.github) {
      text += `Phone: ${personalInfo.phone || ""} | Email: ${personalInfo.email || ""}\n`;
      text += `LinkedIn: ${personalInfo.linkedin || ""} | GitHub: ${personalInfo.github || ""}\n`;
    }
    if (personalInfo?.location) {
      text += `Location: ${personalInfo.location}\n`;
    }
    text += `\n`;

    if (summary) {
      text += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
    }

    if (skills) {
      text += `TECHNICAL SKILLS\n`;
      if (skills.languages?.length) text += `• Languages: ${skills.languages.join(", ")}\n`;
      if (skills.frameworks?.length) text += `• Frameworks & Libraries: ${skills.frameworks.join(", ")}\n`;
      if (skills.mlAndDataScience?.length) text += `• Machine Learning & Data Science: ${skills.mlAndDataScience.join(", ")}\n`;
      if (skills.toolsAndDatabases?.length) text += `• Tools & Databases: ${skills.toolsAndDatabases.join(", ")}\n`;
      if (skills.coreCompetencies?.length) text += `• Core Concepts: ${skills.coreCompetencies.join(", ")}\n`;
      text += `\n`;
    }

    if (experience?.length) {
      text += `PROFESSIONAL EXPERIENCE\n`;
      experience.forEach((exp) => {
        text += `${exp.role} - ${exp.company} (${exp.duration || ""}) ${exp.location ? "| " + exp.location : ""}\n`;
        exp.highlights?.forEach((h) => {
          text += `  • ${h}\n`;
        });
      });
      text += `\n`;
    }

    if (projects?.length) {
      text += `KEY PROJECTS\n`;
      projects.forEach((proj) => {
        text += `${proj.title} ${proj.techStack ? "[" + proj.techStack + "]" : ""}\n`;
        if (proj.liveLink || proj.githubLink) text += `  Live: ${proj.liveLink || ""} | GitHub: ${proj.githubLink || ""}\n`;
        proj.highlights?.forEach((h) => {
          text += `  • ${h}\n`;
        });
      });
      text += `\n`;
    }

    if (achievements?.length) {
      text += `ACHIEVEMENTS & HONORS\n`;
      achievements.forEach((ach) => {
        text += `• ${ach}\n`;
      });
      text += `\n`;
    }

    if (education?.length) {
      text += `EDUCATION\n`;
      education.forEach((edu) => {
        text += `${edu.degree} — ${edu.institution} (${edu.year || ""}) ${edu.score ? "[" + edu.score + "]" : ""}\n`;
      });
      text += `\n`;
    }

    if (certifications?.length) {
      text += `CERTIFICATIONS\n`;
      certifications.forEach((c) => {
        text += `• ${c}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle Regeneration with custom options
  const handleRegenerate = async (presetInstruction = "") => {
    if (!onRegenerateResume) return;
    setIsRegenerating(true);
    try {
      const instruction = presetInstruction || customPrompt || "Tailor tightly using strictly candidate facts for the target role";
      const updated = await onRegenerateResume(instruction);
      if (updated) {
        setResume(updated);
        setShowRegenBox(false);
        setCustomPrompt("");
      }
    } catch (err) {
      console.error("Regeneration error:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Helper to safely format URLs for clickable links
  const formatUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  // Inline update helper for contentEditable elements
  const handleInlineEdit = (path, value) => {
    setResume((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let target = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const isLoading = parentLoading || isRegenerating;

  if (!isOpen) return null;

  return createPortal(
    <div className="resume-modal-overlay" onClick={onClose}>
      <div
        className="resume-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <header className="resume-modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📄</span>
            <div>
              <h2>AI Tailored 1-Page Resume</h2>
              <small style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                Role: {reportTitle || "Target Role"}
              </small>
            </div>
            <span className="ats-badge">
              <span>●</span> 100% ATS-Optimized
            </span>
          </div>

          <div className="modal-actions">
            {/* Zoom Controls */}
            {activeTab === "preview" && (
              <div className="zoom-controls" style={{ display: "inline-flex", gap: "0.25rem", marginRight: "0.5rem" }}>
                <button
                  className={`btn-action btn-tab ${zoomLevel === 0.75 ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => setZoomLevel(0.75)}
                  title="75% Zoom (Full Page View)"
                >
                  75%
                </button>
                <button
                  className={`btn-action btn-tab ${zoomLevel === 0.9 ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => setZoomLevel(0.9)}
                  title="90% Zoom (Default Fit)"
                >
                  90%
                </button>
                <button
                  className={`btn-action btn-tab ${zoomLevel === 1 ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => setZoomLevel(1)}
                  title="100% Zoom (Actual Size)"
                >
                  100%
                </button>
              </div>
            )}

            {/* View Switcher Tabs */}
            <button
              className={`btn-action btn-tab ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              👁 Preview Resume
            </button>

            <button
              className={`btn-action btn-tab ${activeTab === "coach" ? "active" : ""}`}
              onClick={() => setActiveTab("coach")}
            >
              🎯 Interview Prep Coach
            </button>

            {/* Edit Mode Toggle */}
            <button
              className={`btn-action btn-edit ${isEditing ? "active" : ""}`}
              onClick={() => setIsEditing(!isEditing)}
              title="Click to edit any text directly"
            >
              {isEditing ? "✓ Done Editing" : "✏️ Edit Text"}
            </button>

            {/* Regenerate Button */}
            <button
              className="btn-action btn-regen"
              onClick={() => setShowRegenBox(!showRegenBox)}
              disabled={isLoading}
            >
              🔄 {isLoading ? "Synthesizing..." : "Regenerate"}
            </button>

            {/* Copy Markdown / Text */}
            <button
              className="btn-action btn-tab"
              onClick={handleCopyText}
              title="Copy plain text formatted for job application forms"
            >
              {copied ? "✓ Copied!" : "📋 Copy Text"}
            </button>

            {/* Download PDF Button */}
            <button
              className="btn-action btn-download"
              onClick={handleDownloadPDF}
              title="Save as 1-Page PDF"
            >
              📥 Download PDF
            </button>

            {/* Close Modal Button */}
            <button
              className="btn-action btn-close"
              onClick={onClose}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* MODAL BODY */}
        <div className="resume-modal-body">
          {/* Custom Regeneration Control Bar */}
          {showRegenBox && (
            <div className="regen-controls-bar">
              <div className="regen-input-group">
                <span>Custom Tuning:</span>
                <input
                  type="text"
                  placeholder="e.g. Focus more on React performance, NLP algorithms, or SQL queries..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
                />
                <button
                  className="btn-action btn-download"
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => handleRegenerate()}
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Apply & Regenerate"}
                </button>
              </div>

              <div className="preset-buttons">
                <button onClick={() => handleRegenerate("Strictly highlight data science & machine learning focus")}>
                  ⚡ ML Focus
                </button>
                <button onClick={() => handleRegenerate("Highlight full-stack MERN engineering depth")}>
                  💻 MERN Stack
                </button>
                <button onClick={() => handleRegenerate("Ultra-concise single page high-density phrasing")}>
                  📏 Compact
                </button>
              </div>
            </div>
          )}

          {/* Edit Mode Instructions Banner */}
          {isEditing && (
            <div className="edit-mode-banner">
              <span>
                <strong>Edit Mode Active:</strong> You can click on any text (name, summary, bullet points, skills, achievements) to modify it directly.
              </span>
              <button
                style={{
                  background: "#fbbf24",
                  color: "#1e1b4b",
                  border: "none",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
                onClick={() => setIsEditing(false)}
              >
                Save & Lock
              </button>
            </div>
          )}

          {/* TAB 1: ATS 1-PAGE RESUME PREVIEW (LaTeX Style) */}
          {activeTab === "preview" && resume && (
            <div
              className="resume-paper-wrapper"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease"
              }}
            >
              <div className={`resume-paper-sheet ${isEditing ? "is-editable" : ""}`} id="ats-resume-printable">
                {/* RESUME HEADER (LaTeX Centered Format) */}
                <header className="resume-header">
                  <h1
                    className="candidate-name"
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => handleInlineEdit("personalInfo.name", e.target.innerText)}
                  >
                    {resume.personalInfo?.name || "Candidate Name"}
                  </h1>

                  <div className="contact-links-bar">
                    {resume.personalInfo?.phone && (
                      <span
                        className="contact-item"
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => handleInlineEdit("personalInfo.phone", e.target.innerText)}
                      >
                        {resume.personalInfo.phone}
                      </span>
                    )}

                    {resume.personalInfo?.email && (
                      <>
                        {resume.personalInfo?.phone && <span className="separator">–</span>}
                        <a
                          className="contact-item active-link"
                          href={`mailto:${resume.personalInfo.email}`}
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlineEdit("personalInfo.email", e.target.innerText)}
                        >
                          {resume.personalInfo.email}
                        </a>
                      </>
                    )}

                    {resume.personalInfo?.linkedin && (
                      <>
                        <span className="separator">–</span>
                        <a
                          className="contact-item active-link"
                          href={formatUrl(resume.personalInfo.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlineEdit("personalInfo.linkedin", e.target.innerText)}
                        >
                          LinkedIn
                        </a>
                      </>
                    )}

                    {resume.personalInfo?.github && (
                      <>
                        <span className="separator">–</span>
                        <a
                          className="contact-item active-link"
                          href={formatUrl(resume.personalInfo.github)}
                          target="_blank"
                          rel="noopener noreferrer"
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlineEdit("personalInfo.github", e.target.innerText)}
                        >
                          GitHub
                        </a>
                      </>
                    )}

                    {resume.personalInfo?.portfolio && (
                      <>
                        <span className="separator">–</span>
                        <a
                          className="contact-item active-link"
                          href={formatUrl(resume.personalInfo.portfolio)}
                          target="_blank"
                          rel="noopener noreferrer"
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlineEdit("personalInfo.portfolio", e.target.innerText)}
                        >
                          Portfolio
                        </a>
                      </>
                    )}
                  </div>

                  {resume.personalInfo?.location && (
                    <div
                      className="candidate-location"
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineEdit("personalInfo.location", e.target.innerText)}
                    >
                      {resume.personalInfo.location}
                    </div>
                  )}
                </header>

                {/* 1. PROFESSIONAL SUMMARY */}
                {resume.summary && (
                  <section className="resume-section">
                    <h2 className="section-title">Professional Summary</h2>
                    <p
                      className="summary-content"
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineEdit("summary", e.target.innerText)}
                    >
                      {resume.summary}
                    </p>
                  </section>
                )}

                {/* 2. TECHNICAL SKILLS */}
                {resume.skills && (
                  <section className="resume-section">
                    <h2 className="section-title">Technical Skills</h2>
                    <div className="skills-category-list">
                      {resume.skills.languages?.length > 0 && (
                        <div className="skill-row">
                          <span className="category-label">Languages:</span>
                          <span
                            className="category-values"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const items = e.target.innerText.split(",").map((s) => s.trim()).filter(Boolean);
                              handleInlineEdit("skills.languages", items);
                            }}
                          >
                            {resume.skills.languages.join(", ")}
                          </span>
                        </div>
                      )}

                      {resume.skills.frameworks?.length > 0 && (
                        <div className="skill-row">
                          <span className="category-label">Frameworks & Libraries:</span>
                          <span
                            className="category-values"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const items = e.target.innerText.split(",").map((s) => s.trim()).filter(Boolean);
                              handleInlineEdit("skills.frameworks", items);
                            }}
                          >
                            {resume.skills.frameworks.join(", ")}
                          </span>
                        </div>
                      )}

                      {resume.skills.mlAndDataScience?.length > 0 && (
                        <div className="skill-row">
                          <span className="category-label">Machine Learning & Data Science:</span>
                          <span
                            className="category-values"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const items = e.target.innerText.split(",").map((s) => s.trim()).filter(Boolean);
                              handleInlineEdit("skills.mlAndDataScience", items);
                            }}
                          >
                            {resume.skills.mlAndDataScience.join(", ")}
                          </span>
                        </div>
                      )}

                      {resume.skills.toolsAndDatabases?.length > 0 && (
                        <div className="skill-row">
                          <span className="category-label">Databases & Tools:</span>
                          <span
                            className="category-values"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const items = e.target.innerText.split(",").map((s) => s.trim()).filter(Boolean);
                              handleInlineEdit("skills.toolsAndDatabases", items);
                            }}
                          >
                            {resume.skills.toolsAndDatabases.join(", ")}
                          </span>
                        </div>
                      )}

                      {resume.skills.coreCompetencies?.length > 0 && (
                        <div className="skill-row">
                          <span className="category-label">Core Concepts:</span>
                          <span
                            className="category-values"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const items = e.target.innerText.split(",").map((s) => s.trim()).filter(Boolean);
                              handleInlineEdit("skills.coreCompetencies", items);
                            }}
                          >
                            {resume.skills.coreCompetencies.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* 3. WORK EXPERIENCE (Only if candidate has actual work experience) */}
                {Array.isArray(resume.experience) && resume.experience.length > 0 && (
                  <section className="resume-section">
                    <h2 className="section-title">Professional Experience</h2>
                    <div className="experience-list">
                      {resume.experience.map((exp, expIdx) => (
                        <div className="exp-item" key={expIdx}>
                          <div className="item-header">
                            <div className="item-main">
                              <span
                                className="item-role-title"
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineEdit(`experience.${expIdx}.role`, e.target.innerText)}
                              >
                                {exp.role}
                              </span>
                              {exp.company && (
                                <span
                                  className="item-org-name"
                                  contentEditable={isEditing}
                                  suppressContentEditableWarning
                                  onBlur={(e) => handleInlineEdit(`experience.${expIdx}.company`, e.target.innerText)}
                                >
                                  — {exp.company}
                                </span>
                              )}
                            </div>
                            <span
                              className="item-meta"
                              contentEditable={isEditing}
                              suppressContentEditableWarning
                              onBlur={(e) => handleInlineEdit(`experience.${expIdx}.duration`, e.target.innerText)}
                            >
                              {exp.duration} {exp.location ? `| ${exp.location}` : ""}
                            </span>
                          </div>

                          <ul className="item-bullets">
                            {exp.highlights?.map((hl, hlIdx) => (
                              <li
                                key={hlIdx}
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const newHighlights = [...exp.highlights];
                                  newHighlights[hlIdx] = e.target.innerText;
                                  handleInlineEdit(`experience.${expIdx}.highlights`, newHighlights);
                                }}
                              >
                                {hl}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. KEY PROJECTS */}
                {Array.isArray(resume.projects) && resume.projects.length > 0 && (
                  <section className="resume-section">
                    <h2 className="section-title">Projects</h2>
                    <div className="project-list">
                      {resume.projects.map((proj, pIdx) => (
                        <div className="project-item" key={pIdx}>
                          <div className="item-header">
                            <div className="item-main">
                              <strong
                                className="item-role-title"
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineEdit(`projects.${pIdx}.title`, e.target.innerText)}
                              >
                                {proj.title}
                              </strong>
                              {proj.techStack && (
                                <span
                                  className="item-tech-inline"
                                  contentEditable={isEditing}
                                  suppressContentEditableWarning
                                  onBlur={(e) => handleInlineEdit(`projects.${pIdx}.techStack`, e.target.innerText)}
                                >
                                  — {proj.techStack}
                                </span>
                              )}
                            </div>
                            <span className="project-links">
                              {proj.liveLink && (
                                <a
                                  href={formatUrl(proj.liveLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  [Live]
                                </a>
                              )}
                              {proj.githubLink && (
                                <a
                                  href={formatUrl(proj.githubLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  [GitHub]
                                </a>
                              )}
                            </span>
                          </div>

                          <ul className="item-bullets">
                            {proj.highlights?.map((hl, hlIdx) => (
                              <li
                                key={hlIdx}
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const newHighlights = [...proj.highlights];
                                  newHighlights[hlIdx] = e.target.innerText;
                                  handleInlineEdit(`projects.${pIdx}.highlights`, newHighlights);
                                }}
                              >
                                {hl}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 5. ACHIEVEMENTS & HONORS */}
                {Array.isArray(resume.achievements) && resume.achievements.length > 0 && (
                  <section className="resume-section">
                    <h2 className="section-title">Achievements</h2>
                    <ul className="item-bullets">
                      {resume.achievements.map((ach, aIdx) => (
                        <li
                          key={aIdx}
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newAch = [...resume.achievements];
                            newAch[aIdx] = e.target.innerText;
                            handleInlineEdit("achievements", newAch);
                          }}
                        >
                          {ach}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 6. EDUCATION */}
                {Array.isArray(resume.education) && resume.education.length > 0 && (
                  <section className="resume-section">
                    <h2 className="section-title">Education</h2>
                    <div className="edu-list">
                      {resume.education.map((edu, eduIdx) => (
                        <div className="edu-item" key={eduIdx}>
                          <div className="edu-main">
                            <strong
                              contentEditable={isEditing}
                              suppressContentEditableWarning
                              onBlur={(e) => handleInlineEdit(`education.${eduIdx}.degree`, e.target.innerText)}
                            >
                              {edu.degree}
                            </strong>
                            {edu.score && (
                              <span
                                className="edu-score"
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineEdit(`education.${eduIdx}.score`, e.target.innerText)}
                              >
                                ({edu.score})
                              </span>
                            )}
                            <div
                              className="edu-inst"
                              contentEditable={isEditing}
                              suppressContentEditableWarning
                              onBlur={(e) => handleInlineEdit(`education.${eduIdx}.institution`, e.target.innerText)}
                            >
                              {edu.institution}
                            </div>
                          </div>
                          <span
                            className="edu-year"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineEdit(`education.${eduIdx}.year`, e.target.innerText)}
                          >
                            {edu.year}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 7. CERTIFICATIONS */}
                {Array.isArray(resume.certifications) && resume.certifications.length > 0 && (
                  <section className="resume-section">
                    <h2 className="section-title">Certifications & Training</h2>
                    <ul className="item-bullets">
                      {resume.certifications.map((cert, cIdx) => (
                        <li
                          key={cIdx}
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newCerts = [...resume.certifications];
                            newCerts[cIdx] = e.target.innerText;
                            handleInlineEdit("certifications", newCerts);
                          }}
                        >
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW PREP COACH & RATIONALE */}
          {activeTab === "coach" && resume?.interviewPrepNotes && (
            <div className="coach-panel">
              <div className="coach-card">
                <div className="coach-card-header">
                  <span>🛡</span>
                  <h3>ATS Tailoring Strategy</h3>
                </div>
                <p>{resume.interviewPrepNotes.tailoringStrategy}</p>
              </div>

              <div className="coach-card">
                <div className="coach-card-header">
                  <span>🔑</span>
                  <h3>Key High-Value Keywords Injected for this Role</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  These keywords were extracted from the job description and woven into your skills and project bullet points:
                </p>
                <div className="keyword-cloud">
                  {resume.interviewPrepNotes.keyKeywordsAdded?.map((kw, i) => (
                    <span className="keyword-badge" key={i}>
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="coach-card">
                <div className="coach-card-header">
                  <span>🎙</span>
                  <h3>Interview Talking Points & Defense Tips</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  When interviewers ask about your experience, use these tailored points:
                </p>
                <ul className="talking-points-list">
                  {resume.interviewPrepNotes.interviewTalkingPoints?.map((tp, i) => (
                    <li key={i}>
                      <span className="bullet-icon">➤</span>
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResumeModal;
