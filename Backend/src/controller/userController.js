import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../schema/model.js";

// small helper: makes a token that contains the user id
const makeToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const signup = expressAsyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body || {};

  // 1. all fields must be present (and be text, not objects)
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password and confirm password are required",
    });
  }
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid data sent",
    });
  }

  // 2. password rules
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  // 3. is this email already used?
  const cleanEmail = email.trim().toLowerCase();
  const oldUser = await User.findOne({ email: cleanEmail });
  if (oldUser) {
    return res.status(409).json({
      success: false,
      message: "This email is already registered",
    });
  }

  // 4. hash the password (10 = how much work bcrypt does)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. save the user
  const user = await User.create({
    name: name,
    email: cleanEmail,
    password: hashedPassword,
  });

  // 6. log the user in straight away by sending a token
  res.status(201).json({
    success: true,
    message: "Signup successful",
    token: makeToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const login = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  // typeof check stops attacks like  { "email": { "$ne": null } }
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid data sent",
    });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  // same message for "no user" and "wrong password" so attackers learn nothing
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // compare the typed password with the hashed one in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: makeToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
});
