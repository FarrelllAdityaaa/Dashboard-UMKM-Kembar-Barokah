import express from "express";
import { register, login, getUser, changePassword } from "../controllers/authController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", changePassword);
router.get("/me", verifyToken, getUser);

export default router;
