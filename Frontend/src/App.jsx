import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // Remove BrowserRouter import
import { AuthProvider } from './components/authcontext';
import Register from "./pages/Register";
import ChatApp from "./pages/chatapp";
import RequireAuth from "./components/requireAuth";

function App() {
  return (
    <AuthProvider>
      {/* REMOVED the Router wrapper here */}
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ChatApp />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


