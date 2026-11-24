import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  readProduct,
  readSpecificProduct,
  updateProduct,
} from "../controller/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const productRouter = Router();

// every product route needs a valid token, so we protect them all at once
productRouter.use(authMiddleware);

//    localhost:8000/product
productRouter.route("/").post(createProduct).get(readProduct);

//    localhost:8000/product/:id
productRouter.route("/:id").get(readSpecificProduct)
  .patch(updateProduct)
  .delete(deleteProduct);

export default productRouter;