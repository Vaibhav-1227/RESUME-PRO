import { useContext } from "react";
import {
  getallinterviewreports,
  generateinterviewreport,
  getinterviewbyid,
  deleteinterviewreport,
} from "../services/interview.api";
import { interviewcontext } from "../interview.context";

export const useinterview = () => {
  const context = useContext(interviewcontext);

  if (!context) {
    throw new Error("useinterview must be used within an InterviewProvider");
  }

  const {
    loading,
    setloading,
    error,
    seterror,
    report,
    setreport,
    reports,
    setreports,
  } = context;

  // Generate Report
  const generatereport = async ({
    jobdescription,
    selfdescription,
    resumefile,
  }) => {
    setloading(true);
    seterror(null);

    try {
      const response = await generateinterviewreport({
        jobdescription,
        selfdescription,
        resumefile,
      });

      console.log("GENERATE RESPONSE:", response);
      const interviewreport = response?.interviewreport;

      if (!interviewreport) {
        throw new Error(response?.message || "Interview report not received");
      }

      setreport(interviewreport);
      return interviewreport;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to generate interview report";
      console.error("Generate report error:", msg);
      seterror(msg);
      throw new Error(msg);
    } finally {
      setloading(false);
    }
  };

  // Get Report By ID
  const getreportbyid = async (interviewid) => {
    setloading(true);
    seterror(null);

    try {
      const response = await getinterviewbyid(interviewid);
      const interviewreport = response?.interviewreport;

      if (!interviewreport) {
        throw new Error(response?.message || "Interview report not found");
      }

      setreport(interviewreport);
      return interviewreport;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to fetch interview report";
      console.error("Get report error:", msg);
      seterror(msg);
      throw new Error(msg);
    } finally {
      setloading(false);
    }
  };

  // Get All Reports
  const getreports = async () => {
    setloading(true);
    seterror(null);

    try {
      const response = await getallinterviewreports();
      const interviewreports = response?.interviewreports || [];
      setreports(interviewreports);
      return interviewreports;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to fetch interview reports";
      console.error("Get reports error:", msg);
      seterror(msg);
      return [];
    } finally {
      setloading(false);
    }
  };

  // Delete Report
  const deletereport = async (interviewid) => {
    try {
      await deleteinterviewreport(interviewid);
      setreports((prev) => prev.filter((r) => r._id !== interviewid));
      if (report && report._id === interviewid) {
        setreport(null);
      }
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete interview report";
      console.error("Delete report error:", msg);
      seterror(msg);
      throw new Error(msg);
    }
  };

  return {
    loading,
    error,
    report,
    reports,
    generatereport,
    getreportbyid,
    getreports,
    deletereport,
  };
};