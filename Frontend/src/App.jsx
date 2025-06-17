import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './components/authcontext'; // FIX: Use AuthProvider instead of AuthContext
import Register from "./pages/Register";
import ChatDashboard from "./components/Chatdashboard";
import RequireAuth from "./components/requireAuth";

function App() {
  return (
    <AuthProvider> {/* FIX: Use AuthProvider (the component that provides context) */}
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ChatDashboard/>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


