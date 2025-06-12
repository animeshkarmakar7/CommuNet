import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // optional for later use

  useEffect(() => {
    axios.get("http://localhost:5000/api/auth/me", { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
        // Remove or keep setToken depending on how you plan to use it
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
