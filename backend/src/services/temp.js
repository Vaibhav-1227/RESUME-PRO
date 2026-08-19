const resume = {
  name: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  phone: "+91-9876543210",
  location: "Noida, Uttar Pradesh, India",
  linkedin: "https://linkedin.com/in/aarav-sharma-demo",
  github: "https://github.com/aarav-sharma-demo",

  summary:
    "Motivated Computer Science graduate with strong knowledge of JavaScript, React.js, Node.js, Express.js and MongoDB. Experienced in building responsive web applications and REST APIs. Strong problem-solving skills with a keen interest in full-stack development.",

  education: [
    {
      degree: "B.Tech in Computer Science and Engineering",
      institution: "ABC Institute of Technology",
      location: "Lucknow, Uttar Pradesh",
      start_year: 2022,
      end_year: 2026,
      cgpa: "8.4"
    },
    {
      degree: "Class 12",
      institution: "XYZ Public School",
      location: "Lucknow, Uttar Pradesh",
      year: 2022,
      percentage: "82%"
    }
  ],

  skills: {
    languages: [
      "C++",
      "JavaScript",
      "Python",
      "SQL"
    ],

    frontend: [
      "HTML",
      "CSS",
      "React.js",
      "Tailwind CSS"
    ],

    backend: [
      "Node.js",
      "Express.js",
      "REST API"
    ],

    database: [
      "MongoDB",
      "MySQL"
    ],

    tools: [
      "Git",
      "GitHub",
      "Postman",
      "VS Code"
    ]
  },

  projects: [
    {
      title: "Task Management System",
      description:
        "Developed a full-stack task management application that allows users to create, update, delete and track tasks with authentication.",

      technologies: [
        "React.js",
        "Node.js",
        "Express.js",
        "MongoDB"
      ],

      features: [
        "JWT authentication",
        "CRUD operations",
        "Task status management",
        "Responsive UI"
      ]
    },

    {
      title: "E-Commerce Website",
      description:
        "Built a responsive e-commerce platform with product browsing, search, filtering and shopping cart functionality.",

      technologies: [
        "React.js",
        "JavaScript",
        "CSS",
        "Node.js"
      ],

      features: [
        "Product search",
        "Category filtering",
        "Shopping cart",
        "REST API integration"
      ]
    },

    {
      title: "Weather Forecast Application",
      description:
        "Created a weather application that fetches real-time weather information using a public weather API.",

      technologies: [
        "React.js",
        "JavaScript",
        "REST API"
      ],

      features: [
        "City-based weather search",
        "Temperature information",
        "Weather conditions",
        "Responsive design"
      ]
    }
  ],

  experience: [
    {
      job_title: "Full Stack Developer Intern",
      company: "TechNova Solutions",
      location: "Noida, Uttar Pradesh",

      start_date: "June 2025",
      end_date: "August 2025",

      responsibilities: [
        "Developed reusable React.js components for internal web applications.",
        "Created REST APIs using Node.js and Express.js.",
        "Worked with MongoDB for storing and retrieving application data.",
        "Collaborated with developers to debug and improve application performance."
      ]
    }
  ],

  achievements: [
    "Solved 250+ programming problems on coding platforms.",
    "Participated in multiple college-level hackathons.",
    "Completed a full-stack web development certification.",
    "Ranked among the top 10% of students in the department."
  ],

  certifications: [
    "Full Stack Web Development - ABC Academy",
    "JavaScript Development - XYZ Learning",
    "Database Management Fundamentals - Online Certification"
  ],

  languages: [
    "English",
    "Hindi"
  ]
};
const selfdescribe = `
I am a Computer Science graduate with a strong interest in full-stack web development. 
I have hands-on experience with technologies like JavaScript, React.js, Node.js, Express.js, and MongoDB. 
I enjoy building web applications and solving programming problems. 
I have worked on projects such as a task management system, e-commerce website, and weather forecasting application. 
I am a quick learner, a good team player, and always willing to learn new technologies and improve my technical skills. 
My goal is to start my career as a software developer and contribute to real-world projects while continuously growing as a developer.
`;

const jobdescription = `### Full Stack Developer – Fresher

**Company:** TechNova Solutions
**Location:** Noida, Uttar Pradesh
**Employment Type:** Full-time
**Experience:** 0–1 Years

#### Job Description

We are looking for a motivated and enthusiastic Full Stack Developer to join our development team. The ideal candidate should have a good understanding of frontend and backend technologies and a passion for building scalable and user-friendly web applications.

#### Responsibilities

- Develop and maintain responsive web applications using React.js.
- Build RESTful APIs using Node.js and Express.js.
- Work with MongoDB and MySQL databases.
- Write clean, reusable, and maintainable code.
- Integrate frontend applications with backend APIs.
- Debug and resolve application issues.
- Collaborate with developers and other team members.
- Participate in code reviews and technical discussions.
- Learn and implement new technologies when required.

#### Required Skills

- Good knowledge of JavaScript, HTML, and CSS.
- Basic to intermediate knowledge of React.js.
- Understanding of Node.js and Express.js.
- Familiarity with MongoDB or MySQL.
- Understanding of REST APIs.
- Basic knowledge of Git and GitHub.
- Good problem-solving and communication skills.

#### Preferred Skills

- Knowledge of TypeScript.
- Familiarity with Tailwind CSS.
- Understanding of JWT authentication.
- Basic knowledge of deployment and cloud platforms.
- Experience working on personal or academic projects.

#### Qualifications

- B.Tech/B.E./BCA/MCA in Computer Science, Information Technology, or a related field.
- Fresh graduates are welcome to apply.

#### What We Offer

- Opportunity to work on real-world projects.
- Mentorship from experienced developers.
- Learning and growth opportunities.
- Collaborative work environment.
- Competitive salary based on skills and performance.
`;


module.exports = {
  resume,
  selfdescribe,
  jobdescription
};
