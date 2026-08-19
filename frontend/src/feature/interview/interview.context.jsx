import { createContext, useState } from "react";

export const interviewcontext = createContext();

export const InterviewProvider = ({ children }) => {
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);
  const [report, setreport] = useState(null);
  const [reports, setreports] = useState([]);

  return (
    <interviewcontext.Provider
      value={{
        loading,
        setloading,
        error,
        seterror,
        report,
        setreport,
        reports,
        setreports,
      }}
    >
      {children}
    </interviewcontext.Provider>
  );
};