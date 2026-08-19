import { AuthContext } from "../auth.context.jsx";
import { useContext, useEffect, useState } from "react";
import { loginuser, logoutuser, registeruser, getme } from "../pages/service/auth.api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading } = context;
  const [authError, setAuthError] = useState(null);

  const handlelogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await loginuser(email, password);
      if (!data?.user) {
        throw new Error(data?.message || "Invalid credentials");
      }
      setUser(data.user);
      return data.user;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Login failed";
      console.error("Login failed:", msg);
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleregister = async (username, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await registeruser(username, email, password);
      if (!data?.user) {
        throw new Error(data?.message || "Registration failed");
      }
      setUser(data.user);
      return data.user;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Registration failed";
      console.error("Registration failed:", msg);
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlelogout = async () => {
    setLoading(true);
    try {
      await logoutuser();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const getandsetuser = async () => {
      try {
        const data = await getme();
        if (isMounted) {
          setUser(data.user);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getandsetuser();
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    loading,
    authError,
    setAuthError,
    handlelogin,
    handleregister,
    handlelogout
  };
};