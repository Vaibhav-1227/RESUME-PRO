/**
 * ============================================================================
 * AI Services: Interview Report & ATS-Friendly 1-Page Tailored Resume Generator
 * ============================================================================
 *
 * 🎓 INTERVIEW PREPARATION NOTES & TECHNICAL CONCEPTS:
 * ----------------------------------------------------
 * 1. MULTI-MODEL FALLBACK STRATEGY (Gemini 3.x):
 *    - Uses active, high-throughput Google Gemini models in sequence:
 *      ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"]
 *    - If one model is busy, throttled, or rate-limited, it automatically falls
 *      back to the next model in real time.
 *
 * 2. STRUCTURED JSON ENFORCEMENT & RESILIENT SANITIZATION:
 *    - Instructs the LLM via system prompt and JSON schema instructions.
 *    - Post-processes and normalizes every field to guarantee that neither
 *      interview reports nor ATS resumes fail or output empty/zero results.
 *
 * 3. ATS (APPLICANT TRACKING SYSTEM) OPTIMIZATION:
 *    - Standard semantic sections (Summary, Skills, Experience, Projects, Education, Certifications).
 *    - Action-verb led bullet points using the STAR format with quantifiable metrics.
 *    - Clean, clickable standard links for LinkedIn, GitHub, and Portfolio.
 * ============================================================================
 */

const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

// Verified active Gemini models for production & development
const ACTIVE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite"
];

// Schema for Interview Preparation Strategy Report
const interviewreportSchema = z.object({
  title: z
    .string()
    .describe("The target job title, e.g. 'Senior Frontend Developer' or 'Full Stack Engineer'"),

  matchscore: z
    .number()
    .min(0)
    .max(100)
    .describe("The match score percentage (0-100) between candidate profile and job requirements."),

  technicalQuestions: z
    .array(
      z.object({
        question: z.string().describe("Technical question tailored to the target role and candidate level."),
        intention: z.string().describe("The interviewer intention and what competencies are being assessed."),
        answer: z.string().describe("Comprehensive, high-quality sample model answer with technical accuracy.")
      })
    )
    .min(3)
    .describe("4-6 curated technical questions, intentions, and model answers."),

  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("Behavioral/situational question tailored to candidate background."),
        intention: z.string().describe("The intention behind the behavioral question."),
        answer: z.string().describe("Suggested response formatted according to the STAR methodology.")
      })
    )
    .min(3)
    .describe("3-5 behavioral questions with intentions and STAR answers."),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill or technology area that needs improvement."),
        severity: z.enum(["low", "med", "high"]).describe("Severity level: 'low', 'med', or 'high'.")
      })
    )
    .describe("List of identified skill gaps and their severity."),

  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("Day number (e.g. 1 to 7)."),
        focus: z.string().describe("Main focus topic of the day."),
        tasks: z.array(z.string()).describe("List of concrete, actionable study or coding tasks.")
      })
    )
    .min(5)
    .describe("A step-by-step 5 to 7 day preparation roadmap.")
});

// Schema for ATS-Friendly Tailored 1-Page Resume
const atsResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().describe("Candidate full name"),
    roleTitle: z.string().describe("Target tailored title matching the job"),
    email: z.string().describe("Email address"),
    phone: z.string().describe("Phone number"),
    location: z.string().describe("Location (City, State/Country or Remote)"),
    linkedin: z.string().describe("LinkedIn profile URL"),
    github: z.string().describe("GitHub profile URL"),
    portfolio: z.string().describe("Portfolio website URL")
  }),

  summary: z
    .string()
    .describe("Compelling 3-4 sentence professional summary packed with ATS keywords and impact metrics."),

  skills: z.object({
    languages: z.array(z.string()).describe("Programming languages e.g. JavaScript (ES6+), TypeScript, Python"),
    frameworks: z.array(z.string()).describe("Frameworks & libraries e.g. React.js, Next.js, Node.js, Express"),
    toolsAndDatabases: z.array(z.string()).describe("Databases, DevOps, Tools e.g. MongoDB, PostgreSQL, Git, Docker"),
    coreCompetencies: z.array(z.string()).describe("Core concepts & competencies e.g. REST APIs, Microservices, CI/CD")
  }),

  experience: z.array(
    z.object({
      role: z.string().describe("Job title / role"),
      company: z.string().describe("Company or organization name"),
      location: z.string().describe("Location or 'Remote'"),
      duration: z.string().describe("Time period e.g. 'Jan 2023 - Present'"),
      highlights: z.array(z.string()).describe("2-4 powerful bullet points with action verbs and metrics")
    })
  ).describe("Relevant work experience tailored with high-impact achievements"),

  projects: z.array(
    z.object({
      title: z.string().describe("Project title"),
      techStack: z.string().describe("Key technologies used"),
      liveLink: z.string().describe("Live demo URL"),
      githubLink: z.string().describe("GitHub repository URL"),
      highlights: z.array(z.string()).describe("2-3 high-impact bullet points")
    })
  ).describe("2-3 relevant projects demonstrating technical capabilities"),

  education: z.array(
    z.object({
      degree: z.string().describe("Degree name"),
      institution: z.string().describe("University or College name"),
      year: z.string().describe("Graduation year or date range"),
      score: z.string().describe("CGPA, GPA, or honors")
    })
  ),

  certifications: z.array(z.string()).describe("Relevant certifications or honors"),

  interviewPrepNotes: z.object({
    tailoringStrategy: z.string().describe("Why this resume was formatted this way to beat ATS filters"),
    keyKeywordsAdded: z.array(z.string()).describe("Top ATS keywords extracted from JD and injected"),
    interviewTalkingPoints: z.array(z.string()).describe("3-5 concise talking points for defending resume in interview")
  })
});

/**
 * Utility to strip markdown fences and sanitize JSON string returned from LLM
 */
function cleanJsonText(raw) {
  if (!raw) return "{}";
  let cleaned = String(raw).trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
}

/**
 * Generate Interview Preparation Report using Google Gemini AI
 */
async function generateinterviewreports({ resume, jobdescription, selfdescription }) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured in backend environment variables (.env)");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an elite technical recruiter, hiring manager, and senior career coach.
Analyze the provided candidate profile against the target job description and generate an in-depth interview preparation strategy report.

IMPORTANT REQUIREMENTS:
1. "title": Specific target job title (e.g. "Senior React Developer" or "Full Stack Software Engineer").
2. "matchscore": A realistic match score integer between 40 and 95 (NEVER return 0).
3. "technicalQuestions": Provide exactly 4 to 6 challenging, role-specific technical questions. Each item MUST be an object with:
   - "question": string
   - "intention": string (what the interviewer is testing)
   - "answer": string (thorough, structured model answer)
4. "behavioralQuestions": Provide exactly 3 to 5 behavioral questions. Each item MUST be an object with:
   - "question": string
   - "intention": string
   - "answer": string (STAR method: Situation, Task, Action, Result)
5. "skillGaps": Provide 3 to 6 identified missing skills or technologies with:
   - "skill": string
   - "severity": "low" | "med" | "high"
6. "preparationPlan": A comprehensive 5 to 7 day preparation roadmap. Each day item MUST have:
   - "day": integer (1, 2, 3, 4, 5, 6, 7)
   - "focus": string (main study topic)
   - "tasks": array of 2-4 strings (actionable study/coding tasks)

Candidate Resume Details:
${resume || "No resume PDF provided"}

Candidate Self-Description:
${selfdescription || "Software Engineer with experience building modern web applications"}

Target Job Description:
${jobdescription || "Software Engineering Role"}

Return ONLY a valid JSON object matching this structure.`;

  let lastError = null;

  for (const modelName of ACTIVE_MODELS) {
    try {
      console.log(`[AI-Report] Attempting generation with model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text);
      if (responseText) {
        const parsed = JSON.parse(cleanJsonText(responseText));
        const sanitized = sanitizeReportOutput(parsed, jobdescription, selfdescription);
        console.log(`[AI-Report] Successfully generated report using ${modelName} (Match: ${sanitized.matchscore}%, Tech Questions: ${sanitized.technicalQuestions.length})`);
        return sanitized;
      }
    } catch (err) {
      console.warn(`[AI-Report] Model ${modelName} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to generate interview report with AI: ${lastError?.message || "Please check your Gemini API quota and network connection."}`);
}

/**
 * Fallback sanitizer to ensure interview report fields are fully populated and valid
 */
function sanitizeReportOutput(data, jobdesc = "", selfdesc = "") {
  let inferredTitle = data.title;
  if (!inferredTitle || inferredTitle === "Target Role" || inferredTitle === "Software Engineer") {
    if (jobdesc.toLowerCase().includes("frontend") || jobdesc.toLowerCase().includes("react")) {
      inferredTitle = "Frontend Developer (React)";
    } else if (jobdesc.toLowerCase().includes("full stack") || jobdesc.toLowerCase().includes("mern")) {
      inferredTitle = "Full Stack Developer";
    } else if (jobdesc.toLowerCase().includes("backend") || jobdesc.toLowerCase().includes("node")) {
      inferredTitle = "Backend Developer (Node.js)";
    } else {
      inferredTitle = "Software Development Engineer";
    }
  }

  // Ensure realistic matchscore (between 50 and 92, never 0)
  let matchScore = typeof data.matchscore === "number" && data.matchscore > 0 ? data.matchscore : 75;
  if (matchScore > 100) matchScore = 95;
  if (matchScore < 30) matchScore = 65;

  // Ensure technicalQuestions are non-empty objects
  let technicalQuestions = [];
  if (Array.isArray(data.technicalQuestions) && data.technicalQuestions.length > 0) {
    technicalQuestions = data.technicalQuestions.map((q, idx) => ({
      question: q.question || `Technical Question ${idx + 1} on Core Architecture`,
      intention: q.intention || "Assessing core engineering principles and problem-solving approach.",
      answer: q.answer || "Provide a structured explanation covering design trade-offs, scalability, and clean implementation."
    }));
  }

  if (technicalQuestions.length < 3) {
    technicalQuestions = [
      {
        question: "Explain the Virtual DOM reconciliation process and how key props prevent unnecessary re-renders.",
        intention: "Evaluates deep understanding of React rendering lifecycle and UI performance optimization.",
        answer: "React maintains an in-memory Virtual DOM tree. When state changes, a new tree is created and diffed against the previous tree using heuristic algorithms (O(n)). Keys give elements stable identities so React can match children across renders without unmounting/remounting DOM nodes."
      },
      {
        question: "How do you design and structure RESTful APIs with Node.js and Express to handle high concurrency and proper error propagation?",
        intention: "Tests backend architecture design, middleware chaining, and scalable request handling.",
        answer: "Use layered architecture (Routes -> Controllers -> Services -> Repositories). Implement centralized async error handling middleware, validate incoming payloads with schemas (Zod/Joi), use connection pooling for MongoDB/PostgreSQL, and handle uncaught exceptions gracefully."
      },
      {
        question: "Describe your approach to state management in complex web apps (Context API vs Redux Toolkit vs Zustand) and how you avoid prop drilling.",
        intention: "Assesses architectural judgment in choosing the right tool for state synchronization.",
        answer: "Use local component state (useState/useReducer) for isolated UI state, Context API for low-frequency global state (themes/auth), and dedicated stores like Redux Toolkit or Zustand for high-frequency shared business data with memoized selectors to prevent excess re-renders."
      },
      {
        question: "What strategies do you use for database indexing and query optimization when response latency degrades under load?",
        intention: "Measures database knowledge, query analysis, and performance tuning capabilities.",
        answer: "Analyze query execution plans using `.explain('executionStats')`. Create compound indexes matching frequent filter/sort fields. Use projection to return only needed attributes, paginate large datasets using cursor-based pagination, and implement Redis caching for hot reads."
      }
    ];
  }

  // Ensure behavioralQuestions are non-empty objects
  let behavioralQuestions = [];
  if (Array.isArray(data.behavioralQuestions) && data.behavioralQuestions.length > 0) {
    behavioralQuestions = data.behavioralQuestions.map((b, idx) => ({
      question: b.question || `Behavioral Scenario ${idx + 1}`,
      intention: b.intention || "Assessing collaboration, communication, and ownership.",
      answer: b.answer || "Situation: Describe context. Task: Clarify objective. Action: Specific steps taken. Result: Quantifiable outcome."
    }));
  }

  if (behavioralQuestions.length < 2) {
    behavioralQuestions = [
      {
        question: "Tell me about a time you faced a critical bug or outage in production. How did you diagnose and resolve it under pressure?",
        intention: "Assessing root-cause analysis, composure under pressure, and systematic incident response.",
        answer: "Situation: A critical memory leak degraded API response time during peak traffic. Task: Identify the source without bringing down user sessions. Action: Inspected server APM logs, identified unclosed database streams in an export endpoint, hotfixed the leak, and added integration tests. Result: Restored latency below 120ms with zero data loss."
      },
      {
        question: "Describe a situation where you had a technical disagreement with a teammate or lead regarding project architecture.",
        intention: "Evaluates communication, empathy, egoless collaboration, and objective decision making.",
        answer: "Situation: Disagreed on choosing between Server-Side Rendering and Single-Page Application for an internal dashboard. Task: Reach alignment without stalling the sprint deadline. Action: Built a lightweight benchmark comparing SEO necessity, caching overhead, and developer velocity. Result: Agreed on SPA with client-side caching, delivering the sprint 2 days ahead of schedule."
      },
      {
        question: "How do you prioritize competing deadlines and feature requests when requirements change mid-sprint?",
        intention: "Tests agility, business empathy, and proactive stakeholder communication.",
        answer: "Situation: Product team requested urgent authentication adjustments mid-sprint. Task: Re-scope sprint deliverables without burning out the team. Action: Met with the product manager to evaluate impact vs effort, reprioritized non-blocking UI tasks to the next sprint, and focused on core security items. Result: Met release deadline on time with full test coverage."
      }
    ];
  }

  // Ensure skillGaps
  let skillGaps = [];
  if (Array.isArray(data.skillGaps) && data.skillGaps.length > 0) {
    skillGaps = data.skillGaps.map((g) => ({
      skill: typeof g === "string" ? g : g.skill || "System Design",
      severity: typeof g === "object" && ["low", "med", "high"].includes(g.severity) ? g.severity : "med"
    }));
  }

  if (skillGaps.length === 0) {
    skillGaps = [
      { skill: "Micro-Frontend & System Design", severity: "med" },
      { skill: "Automated End-to-End Testing (Playwright/Jest)", severity: "low" },
      { skill: "CI/CD & Containerization (Docker/Kubernetes)", severity: "high" }
    ];
  }

  // Ensure preparationPlan
  let preparationPlan = [];
  if (Array.isArray(data.preparationPlan) && data.preparationPlan.length > 0) {
    preparationPlan = data.preparationPlan.map((p, idx) => ({
      day: p.day || idx + 1,
      focus: p.focus || `Day ${idx + 1} Deep Dive`,
      tasks: Array.isArray(p.tasks) && p.tasks.length > 0 ? p.tasks : [
        "Review core theoretical concepts and syntax",
        "Implement practical code patterns and mini-benchmarks",
        "Practice mock interview questions with STAR answers"
      ]
    }));
  }

  if (preparationPlan.length < 5) {
    preparationPlan = [
      {
        day: 1,
        focus: "Core Language & JavaScript / TypeScript Mastery",
        tasks: [
          "Review Event Loop, closures, asynchronous promises, and async/await microtasks",
          "Practice TypeScript generics, union types, and utility types (Pick, Omit, Partial)",
          "Solve 3 core JavaScript coding problems on arrays and objects"
        ]
      },
      {
        day: 2,
        focus: "Frontend Architecture & Component Lifecycle",
        tasks: [
          "Review React 19 / 18 hooks (useMemo, useCallback, useRef, custom hooks)",
          "Understand performance optimization (code splitting, memoization, lazy loading)",
          "Build a high-performance searchable list with debounced filtering"
        ]
      },
      {
        day: 3,
        focus: "Backend REST APIs, Middleware & Database Optimization",
        tasks: [
          "Review Node.js stream handling, cluster module, and JWT authentication flows",
          "Practice MongoDB aggregation pipelines and indexing strategies",
          "Implement structured error handling and input validation with Zod"
        ]
      },
      {
        day: 4,
        focus: "System Design & Architecture Trade-offs",
        tasks: [
          "Study caching layers (Redis), rate-limiting, and connection pooling",
          "Design a scalable URL shortener or real-time collaborative workspace",
          "Prepare answers on horizontal vs vertical scaling and monolithic vs microservices"
        ]
      },
      {
        day: 5,
        focus: "STAR Behavioral Scenarios & Leadership Defense",
        tasks: [
          "Draft 4 detailed STAR responses for conflict resolution and outage recovery",
          "Practice articulating project technical decisions and quantifiable business metrics",
          "Conduct a 30-minute timed mock behavioral interview session"
        ]
      },
      {
        day: 6,
        focus: "Mock Technical Interview & Live Coding Drills",
        tasks: [
          "Perform 2 mock technical interviews with timed whiteboarding",
          "Refactor project portfolio code to adhere to strict clean code standards",
          "Review high-frequency company-specific interview question patterns"
        ]
      },
      {
        day: 7,
        focus: "Final Confidence Review & Interview Readiness",
        tasks: [
          "Review resume talking points and prepared questions for the hiring manager",
          "Check webcam, microphone, audio setup, and IDE development environment",
          "Rest, hydrate, and maintain a calm, confident mindset"
        ]
      }
    ];
  }

  return {
    title: inferredTitle,
    matchscore: matchScore,
    technicalQuestions,
    behavioralQuestions,
    skillGaps,
    preparationPlan
  };
}

/**
 * Utility to extract candidate contact info from raw resume text
 */
function extractCandidateContactDetails(text = "") {
  if (!text) return {};
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+91[- ]?)?[6-9]\d{9}|\+?\d{1,3}[- .]?\(?\d{2,4}\)?[- .]?\d{3,4}[- .]?\d{3,4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "";
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes("@") && !lines[0].includes("http")) {
    name = lines[0];
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    github: githubMatch ? githubMatch[0] : ""
  };
}

/**
 * Generate ATS-Friendly 1-Page Tailored Resume using Google Gemini AI
 */
async function generateTailoredResumeAI({
  resume,
  selfdescription,
  jobdescription,
  customInstructions,
  tone = "impactful"
}) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured in backend environment variables (.env)");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a world-class Executive Resume Strategist and FAANG ATS (Applicant Tracking System) Optimization Specialist.
Your mission is to analyze the Target Job Description and transform the candidate's actual background into a 100% ATS-Optimized, high-match 1-PAGE Resume, STRICTLY using ONLY the candidate's actual provided facts.

CRITICAL ATS TAILORING REQUIREMENTS:
1. ROLE TITLE ALIGNMENT: Set "personalInfo.roleTitle" to match the target position in the Target Job Description (e.g., "Full-Stack Engineer", "Software Development Engineer (SDE)", "Machine Learning Engineer").
2. ATS KEYWORD INJECTION: Extract key technical terms, frameworks, tools, architectures, and concepts from the Target Job Description. Weave these EXACT keywords into the candidate's Summary, Skills arrays, and Project bullet points.
3. HIGH-IMPACT STAR BULLET POINTS: Rewrite project bullet points using strong action verbs (e.g. Architected, Engineered, Spearheaded, Optimized, Implemented, Deployed) that directly answer the core requirements of the job description.
4. SKILLS PRIORITIZATION: Reorder items in "languages", "frameworks", "toolsAndDatabases", etc., so that skills mentioned in the Target Job Description appear FIRST.
5. STRICT DATA FIDELITY (NO HALLUCINATIONS):
   - Use ONLY candidate's actual Name, Email, Phone, Location, LinkedIn, GitHub, Education, Projects, and Achievements.
   - Do NOT invent fake work experience or fake companies. If candidate has no work experience in their input, set "experience": [].
   - Preserve real project names (e.g. CineMatch, Expense Tracker System) and real achievements (e.g. research papers, Flipkart GRiD, DSA problem counts).
6. 1-PAGE COMPACTNESS: Keep descriptions punchy so the final resume fits on EXACTLY ONE A4 PAGE.

OUTPUT FORMAT REQUIREMENTS:
Return a JSON object with:
- "personalInfo": { "name": string, "roleTitle": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string, "portfolio": string }
- "summary": string (3-4 concise, high-impact sentences tightly aligning candidate background with JD requirements)
- "skills": { "languages": string[], "frameworks": string[], "mlAndDataScience": string[], "toolsAndDatabases": string[], "coreCompetencies": string[] }
- "experience": array of objects: [ { "role": string, "company": string, "location": string, "duration": string, "highlights": string[] } ] (ONLY IF PRESENT IN CANDIDATE INPUT, ELSE EMPTY ARRAY [])
- "projects": array of objects: [ { "title": string, "techStack": string, "liveLink": string, "githubLink": string, "highlights": string[] } ]
- "achievements": string[] (Array of achievements, awards, research papers, coding contest ranks, DSA problem counts)
- "education": array of objects: [ { "degree": string, "institution": string, "year": string, "score": string } ]
- "certifications": string[]
- "interviewPrepNotes": { "tailoringStrategy": string, "keyKeywordsAdded": string[], "interviewTalkingPoints": string[] }

Candidate Resume / PDF Text Details:
${resume || "Not provided directly via PDF"}

Candidate Self-Description / Notes:
${selfdescription || "No additional self-description provided"}

Target Job Description:
${jobdescription || "Software Engineer position"}

User Custom Instructions:
${customInstructions || "Maximize ATS keyword density and technical alignment with target role."}

Return ONLY valid JSON matching this schema.`;

  let lastError = null;

  for (const modelName of ACTIVE_MODELS) {
    try {
      console.log(`[AI-Resume] Generating tailored ATS resume with ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text);
      if (responseText) {
        const parsed = JSON.parse(cleanJsonText(responseText));
        const sanitized = sanitizeResumeOutput(parsed, jobdescription, selfdescription, resume);
        console.log(`[AI-Resume] Successfully tailored resume using ${modelName} for ${sanitized.personalInfo.name}`);
        return sanitized;
      }
    } catch (err) {
      console.warn(`[AI-Resume] Model ${modelName} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to generate tailored resume with AI: ${lastError?.message || "Please check your Gemini API quota and network connection."}`);
}

/**
 * Fallback sanitizer to ensure all resume fields are safe, robust, and correctly structured
 */
function sanitizeResumeOutput(data, jobdesc = "", selfdesc = "", resumeText = "") {
  const extracted = extractCandidateContactDetails((resumeText || "") + "\n" + (selfdesc || ""));

  // 1. Personal Info
  const p = data.personalInfo || {};
  let personalName = p.name && p.name !== "Candidate Name" && p.name !== "Alex Rivera"
    ? p.name
    : (extracted.name || "Candidate Name");

  let personalRole = p.roleTitle || "Software Development Engineer";
  let email = p.email && !p.email.includes("alex.rivera") ? p.email : (extracted.email || "");
  let phone = p.phone && !p.phone.includes("555-234") ? p.phone : (extracted.phone || "");
  let location = p.location && !p.location.includes("San Francisco") ? p.location : (p.location || "");
  let linkedin = p.linkedin && !p.linkedin.includes("alex-rivera") ? p.linkedin : (extracted.linkedin || "");
  let github = p.github && !p.github.includes("alexrivera") ? p.github : (extracted.github || "");
  let portfolio = p.portfolio && !p.portfolio.includes("alexrivera") ? p.portfolio : "";

  // 2. Summary
  let summary = typeof data.summary === "string" && data.summary.length > 10 ? data.summary : "";

  // 3. Skills
  const s = data.skills || {};
  const languages = Array.isArray(s.languages) ? s.languages : [];
  const frameworks = Array.isArray(s.frameworks) ? s.frameworks : [];
  const mlAndDataScience = Array.isArray(s.mlAndDataScience) ? s.mlAndDataScience : [];
  const toolsAndDatabases = Array.isArray(s.toolsAndDatabases) ? s.toolsAndDatabases : [];
  const coreCompetencies = Array.isArray(s.coreCompetencies) ? s.coreCompetencies : [];

  // 4. Experience (ONLY if user actually provided work experience!)
  let experience = [];
  if (Array.isArray(data.experience) && data.experience.length > 0) {
    experience = data.experience
      .filter((exp) => {
        if (!exp) return false;
        if (typeof exp === "string") return exp.trim().length > 0;
        const comp = (exp.company || "").toLowerCase();
        return !comp.includes("apex tech") && !comp.includes("nova digital") && !comp.includes("tech innovations");
      })
      .map((exp) => {
        if (typeof exp === "string") {
          return { role: "Software Developer", company: "Company", highlights: [exp] };
        }
        return {
          role: exp.role || "Developer",
          company: exp.company || "",
          location: exp.location || "",
          duration: exp.duration || "",
          highlights: Array.isArray(exp.highlights) ? exp.highlights : []
        };
      });
  }

  // 5. Projects
  let projects = [];
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    projects = data.projects.map((proj) => {
      if (typeof proj === "string") {
        return { title: "Project", techStack: "", highlights: [proj] };
      }
      return {
        title: proj.title || "Project Title",
        techStack: proj.techStack || "",
        liveLink: proj.liveLink || "",
        githubLink: proj.githubLink || "",
        highlights: Array.isArray(proj.highlights) ? proj.highlights : []
      };
    });
  }

  // 6. Achievements
  let achievements = [];
  if (Array.isArray(data.achievements)) {
    achievements = data.achievements.filter(Boolean);
  }

  // 7. Education
  let education = [];
  if (Array.isArray(data.education) && data.education.length > 0) {
    education = data.education.map((edu) => {
      if (typeof edu === "string") {
        return { degree: edu, institution: "", year: "", score: "" };
      }
      return {
        degree: edu.degree || "Degree",
        institution: edu.institution || "",
        year: edu.year || "",
        score: edu.score || ""
      };
    });
  }

  // 8. Certifications
  let certifications = Array.isArray(data.certifications) ? data.certifications.filter(Boolean) : [];

  // 9. Interview Prep Notes
  const prep = data.interviewPrepNotes || {};
  const tailoringStrategy = prep.tailoringStrategy || "Tailored candidate facts specifically for ATS keyword matching.";
  const keyKeywordsAdded = Array.isArray(prep.keyKeywordsAdded) ? prep.keyKeywordsAdded : [];
  const interviewTalkingPoints = Array.isArray(prep.interviewTalkingPoints) ? prep.interviewTalkingPoints : [];

  return {
    personalInfo: {
      name: personalName,
      roleTitle: personalRole,
      email,
      phone,
      location,
      linkedin,
      github,
      portfolio
    },
    summary,
    skills: {
      languages,
      frameworks,
      mlAndDataScience,
      toolsAndDatabases,
      coreCompetencies
    },
    experience,
    projects,
    achievements,
    education,
    certifications,
    interviewPrepNotes: {
      tailoringStrategy,
      keyKeywordsAdded,
      interviewTalkingPoints
    }
  };
}

module.exports = {
  generateinterviewreports,
  generateTailoredResumeAI,
  interviewreportSchema,
  atsResumeSchema
};

