import { Schema } from "mongoose";

const productSchema = Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "category is required"],
      // only these 5 values are allowed
      enum: {
        values: ["Electronics", "Clothing", "Food", "Accessories", "Other"],
        message: "category is not valid",
      },
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "quantity is required"],
      min: [0, "quantity cannot be negative"],
    },
    // which user owns this product
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    // mongoose adds createdAt and updatedAt automatically
    timestamps: true,
  },
);
export default productSchema;
