import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './components/authcontext'; // FIX: Use AuthProvider instead of AuthContext
import ChatDashboard from "./components/Chatdashboard";
import RequireAuth from "./components/requireAuth";
import SignUp from "./pages/signup";
import Login from "./pages/login";
import CommunetLanding from "./pages/landing"; // Assuming you have a landing page

function App() {
  return (
    <AuthProvider> {/* FIX: Use AuthProvider (the component that provides context) */}
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


