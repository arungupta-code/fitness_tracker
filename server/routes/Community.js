import express from "express";
import { createPost, deleteOwnPost, getPosts } from "../controllers/Community.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getPosts);
router.post("/", verifyToken, createPost);
router.delete("/:id", verifyToken, deleteOwnPost);

export default router;
