import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './components/authcontext';
import ChatDashboard from "./components/Chatdashboard";
import RequireAuth from "./components/requireAuth";
import SignUp from "./pages/signup";
import Login from "./pages/login";
import CommunetLanding from "./pages/landing"; 
function App() {
  return (
    <AuthProvider> 
      <Routes>
        <Route path="/landing" element={<CommunetLanding />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ChatDashboard/>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


