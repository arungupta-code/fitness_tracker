import { createError } from "../error.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Trainer from "../models/Trainer.js";

const getAuthor = async ({ id, role }) =>
  role === "trainer" ? Trainer.findById(id) : User.findById(id);

export const createPost = async (req, res, next) => {
  try {
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content) return next(createError(400, "Post content cannot be empty."));
    if (content.length > 500) {
      return next(createError(400, "Post content must be 500 characters or fewer."));
    }

    const author = await getAuthor(req.user);
    if (!author) return next(createError(404, "Author not found."));

    const post = await Post.create({
      authorId: author._id,
      authorName: author.name,
      role: req.user.role,
      content,
    });
    return res.status(201).json({ post });
  } catch (error) {
    return next(error);
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ posts });
  } catch (error) {
    return next(error);
  }
};

export const deleteOwnPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(createError(404, "Post not found."));
    if (String(post.authorId) !== String(req.user.id) || post.role !== req.user.role) {
      return next(createError(403, "You can only delete your own posts."));
    }

    await post.deleteOne();
    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    return next(error);
  }
};
