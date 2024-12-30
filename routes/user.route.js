import express from "express";
import {
  editPorifle,
  followOrUnfollow,
  getProfile,
  login,
  logOut,
  register,
  suggestedUsers,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logOut);
router.route("/:id/profile").get(isAuthenticated, getProfile);
router
  .route("/profile/edit")
  .post(isAuthenticated, upload.single("profilePicture"), editPorifle);
router.route("/suggested").get(isAuthenticated, suggestedUsers);
router.route("/followOrUnfollow/:id").post(isAuthenticated, followOrUnfollow);

export default router;
