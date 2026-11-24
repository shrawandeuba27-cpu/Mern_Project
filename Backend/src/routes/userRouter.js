import { Router } from "express";
import { login, signup } from "../controller/userController.js";

const userRouter = Router();

//    localhost:8000/user/signup
userRouter.route("/signup").post(signup);

//    localhost:8000/user/login
userRouter.route("/login").post(login);

export default userRouter;
