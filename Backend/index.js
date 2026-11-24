// make express app
// attach port to it
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]); // helps Atlas connection on some networks
import "dotenv/config"; // reads the .env file and puts values into process.env
import express, { json } from "express";
import cors from "cors";
import connectToDb from "./src/connectToDb/connectToDb.js";
import userRouter from "./src/routes/userRouter.js";
import productRouter from "./src/routes/productRouter.js";


let app = express();

app.use(cors());
app.use(json()); //make our system capable to take json data , always place it at top

// every request that starts with /user goes to userRouter
app.use("/user", userRouter);
// every request that starts with /product goes to productRouter
app.use("/product", productRouter);

// if no route matched above, send a 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler: express-async-handler sends every error from a controller here.
// Express knows it is an error handler because it has 4 parameters.
app.use((error, req, res, next) => {
  console.log("Error:", error.message);

  // mongoose validation error (for example a required field is missing)
  if (error.name === "ValidationError") {
    const firstMessage = Object.values(error.errors)[0].message;
    return res.status(400).json({ success: false, message: firstMessage });
  }

  // duplicate key error (email already exists)
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This email is already registered",
    });
  }

  // anything else is our fault, not the user's
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

let port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`<---- Application is listening at ${port} ---->`);
  connectToDb();
});