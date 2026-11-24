import expressAsyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Product } from "../schema/model.js";

const categories = ["Electronics", "Clothing", "Food", "Accessories", "Other"];

export const createProduct = expressAsyncHandler(async (req, res) => {
  const { name, category, price, quantity } = req.body || {};

  // basic validation
  if (!name || typeof name !== "string" || !name.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Product name is required" });
  }
  if (!categories.includes(category)) {
    return res
      .status(400)
      .json({ success: false, message: "Please choose a valid category" });
  }
  if (
    price === "" ||
    price === undefined ||
    isNaN(Number(price)) ||
    Number(price) < 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Price must be 0 or more" });
  }
  if (
    quantity === "" ||
    quantity === undefined ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a whole number, 0 or more",
    });
  }

  // we pick each field by hand (we do NOT pass req.body directly)
  // and the owner comes from the token, never from the user's input
  const result = await Product.create({
    name: name,
    category: category,
    price: Number(price),
    quantity: Number(quantity),
    user: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    result: result,
  });
});

export const readProduct = expressAsyncHandler(async (req, res) => {
  // only the products of the logged in user, newest first
  const result = await Product.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.status(200).json({
    success: true,
    message: "Product read successfully",
    result: result,
  });
});

export const readSpecificProduct = expressAsyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  // must match BOTH the id and the owner
  const result = await Product.findOne({ _id: id, user: req.user.id });

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  res.status(200).json({
    success: true,
    message: "Product read successfully",
    result: result,
  });
});

export const deleteProduct = expressAsyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const result = await Product.findOneAndDelete({ _id: id, user: req.user.id });

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    result: result,
  });
});

export const updateProduct = expressAsyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name, category, price, quantity } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  // same checks as createProduct
  if (!name || typeof name !== "string" || !name.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Product name is required" });
  }
  if (!categories.includes(category)) {
    return res
      .status(400)
      .json({ success: false, message: "Please choose a valid category" });
  }
  if (
    price === "" ||
    price === undefined ||
    isNaN(Number(price)) ||
    Number(price) < 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Price must be 0 or more" });
  }
  if (
    quantity === "" ||
    quantity === undefined ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a whole number, 0 or more",
    });
  }

  // must match BOTH the id and the owner, and we pick each field by hand
  const result = await Product.findOneAndUpdate(
    { _id: id, user: req.user.id },
    {
      name: name,
      category: category,
      price: Number(price),
      quantity: Number(quantity),
    },
    { new: true }, // give back the updated product
  );

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    result: result,
  });
});