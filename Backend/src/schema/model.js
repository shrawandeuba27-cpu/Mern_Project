import { model } from "mongoose";
import userSchema from "./userSchema.js";
import productSchema from "./productSchema.js";

export const User = model("User", userSchema);
export const Product = model("Product", productSchema);
