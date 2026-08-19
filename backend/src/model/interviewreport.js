const mongoose = require("mongoose");

const technicalquestionschema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Technical question is required"]
    },
    intention: {
      type: String,
      required: [true, "Intention is required"]
    },
    answer: {
      type: String,
      required: [true, "Answer is required"]
    }
  },
  {
    _id: false
  }
);

const behavioralquestionschema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Behavioral question is required"]
    },
    intention: {
      type: String,
      required: [true, "Intention is required"]
    },
    answer: {
      type: String,
      required: [true, "Answer is required"]
    }
  },
  {
    _id: false
  }
);

const skillgapschema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ["low", "med", "high"],
      default: "low",
      required: true
    }
  },
  {
    _id: false
  }
);

const preparationplanschema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true
    },
    focus: {
      type: String,
      required: true
    },
    tasks: {
      type: [String],
      default: []
    }
  },
  {
    _id: false
  }
);

const interviewreportSchema = new mongoose.Schema(
  {
    jobdescription: {
      type: String,
      required: [true, "Job description is required"]
    },
    resume: {
      type: String,
      default: ""
    },
    selfdescription: {
      type: String,
      default: ""
    },
    matchscore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    technicalQuestions: {
      type: [technicalquestionschema],
      default: []
    },
    behavioralQuestions: {
      type: [behavioralquestionschema],
      default: []
    },
    skillGaps: {
      type: [skillgapschema],
      default: []
    },
    preparationPlan: {
      type: [preparationplanschema],
      default: []
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      default: "Frontend Developer"
    }
  },
  {
    timestamps: true
  }
);

const interviewreportModel = mongoose.model("InterviewReport", interviewreportSchema);
module.exports = interviewreportModel;