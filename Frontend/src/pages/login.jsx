import React, { useState, useEffect } from "react";
import API from "../api"; // Adjust the path as necessary
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authcontext"; // Adjust the path as necessary

const Login = () => {
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    email: "",
  });

  const [focusedField, setFocusedField] = useState("");
  const [particles, setParticles] = useState([]);

  // Generate floating particles
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
      });
    }
    setParticles(particleArray);
  }, []);

  // Email validation function
  const validateEmail = (email) => {
    if (!email.includes('@')) {
      return "Email must contain @ symbol";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation for email
    if (name === 'email') {
      const emailError = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        email: emailError
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    const emailError = validateEmail(formData.email);
    
    setValidationErrors({
      email: emailError
    });

    if (emailError) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const res = await API.post("/auth/login", formData, { withCredentials: true });
      
      console.log("Login response:", res.data);
      
      if (res.data.user && res.data.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  const goToSignUp = () => {
    navigate("/signup"); // or wherever your signup component is routed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${3 + particle.delay}s ease-in-out infinite ${
                particle.delay
              }s`,
            }}
          />
        ))}
      </div>

      {/* Animated Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      {/* Main Form Container */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl transform transition-all duration-1000 hover:scale-105"
          style={{ animation: "slideInUp 1s ease-out" }}
        >
          {/* Header */}
          <div
            className="text-center mb-8"
            style={{ animation: "fadeInDown 1s ease-out" }}
          >
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-300 text-lg">
              Sign in to your account
            </p>
            <div
              className="w-20 h-1 bg-gradient-to-r from-white to-gray-400 mx-auto mt-4 rounded-full"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                className={`w-full px-4 py-4 bg-black bg-opacity-40 border-2 rounded-2xl text-white placeholder-transparent focus:outline-none focus:bg-opacity-60 transition-all duration-300 ${
                  validationErrors.email 
                    ? "border-red-500 focus:border-red-400" 
                    : "border-gray-600 focus:border-white"
                }`}
                placeholder="Email Address"
                required
              />
              <label
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  formData.email || focusedField === "email"
                    ? "-top-2 text-sm bg-black px-2 text-white"
                    : "top-4 text-gray-400"
                }`}
              >
                Email Address
              </label>
              {validationErrors.email && (
                <p className="text-red-400 text-sm mt-1 ml-2">{validationErrors.email}</p>
              )}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white to-gray-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                className="w-full px-4 py-4 bg-black bg-opacity-40 border-2 border-gray-600 rounded-2xl text-white placeholder-transparent focus:outline-none focus:border-white focus:bg-opacity-60 transition-all duration-300"
                placeholder="Password"
                required
              />
              <label
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  formData.password || focusedField === "password"
                    ? "-top-2 text-sm bg-black px-2 text-white"
                    : "top-4 text-gray-400"
                }`}
              >
                Password
              </label>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white to-gray-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <span className="text-gray-400 hover:text-white cursor-pointer text-sm transition-colors duration-300">
                Forgot Password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-white to-gray-200 text-black font-bold rounded-2xl hover:from-gray-100 hover:to-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 relative overflow-hidden group"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          {/* Footer */}
          <div
            className="text-center mt-8"
            style={{ animation: "fadeInUp 1s ease-out 0.5s both" }}
          >
            <p className="text-gray-400">
              Don't have an account?{" "}
              <span
                onClick={goToSignUp}
                className="text-white hover:text-gray-300 cursor-pointer font-semibold transition-colors duration-300"
              >
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;