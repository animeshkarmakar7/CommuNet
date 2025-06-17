const jwt = require("jsonwebtoken");
const User = require("../Models/user");

const protect = async (req, res, next) => {
  try {
    // FIX: Use consistent cookie name 'jwt'
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized, no token" });
    }

    // FIX: Use consistent payload structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized, user not found" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Error in protect middleware:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = protect;




