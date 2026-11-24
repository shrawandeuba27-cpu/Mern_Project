import { Schema } from "mongoose";

const userSchema = Schema({
  name: {
    type: String,
    required: [true, "name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true, // MongoDB will not allow two users with the same email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
});
export default userSchema;
