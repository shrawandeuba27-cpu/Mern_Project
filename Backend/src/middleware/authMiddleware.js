import jwt from "jsonwebtoken";

// This function runs BEFORE the controller on protected routes.
// The frontend sends:  Authorization: Bearer <token>
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  // 1. is there a token?
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  const token = header.split(" ")[1]; // "Bearer abc123" -> "abc123"

  try {
    // 2. is the token real and not expired?
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. save the user id on req so the controller can use it
    req.user = { id: decoded.id };
    next(); // go to the next function (the controller)
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token, please login again",
    });
  }
};

export default authMiddleware;
