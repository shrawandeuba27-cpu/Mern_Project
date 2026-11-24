import mongoose from "mongoose";

const connectToDb = async () => {
  try {
    // the connection string is in the .env file, never write it in the code
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to db");
  } catch (error) {
    // show a readable message instead of a big crash
    console.log("Could not connect to db:", error.message);
    console.log("Check MONGO_URI in your .env file");
  }
};

export default connectToDb;
