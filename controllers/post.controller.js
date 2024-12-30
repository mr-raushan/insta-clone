import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;
    if (!image) {
      return res.status(401).json({
        success: false,
        message: "Please provide an image",
      });
    }

    //image upload
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    //buffer to data uri
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    //create new post
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });
    return res.status(201).json({
      success: true,
      message: "Post added successfully",
      post,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Post cannot be added, please try again later",
    });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Posts cannot be retrieved, please try again later",
    });
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
      });

    return res.status(200).json({
      success: true,
      message: "User's posts retrieved successfully",
      posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "User's posts cannot be retrieved, please try again later",
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const likeKrneWalaKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });

    //like logic started
    await post.updateOne({ $addToSet: { likes: likeKrneWalaKiId } });
    await post.save();

    //implement socket io for real time notification

    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Post cannot be liked, please try again later",
    });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const likeKrneWalaKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });

    //dislike logic started
    await post.updateOne({ $pull: { likes: likeKrneWalaKiId } });
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post disliked successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id;
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please provide a comment",
      });
    }

    const comment = await Comment.create({
      text,
      author: userId,
      post: postId,
    });

    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });

    post.comments.push(comment._id);
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Comment cannot be added, please try again later",
    });
  }
};

export const getAllPostComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture"
    );
    if (!comments)
      return res.status(404).json({
        message: "No comments",
        success: false,
      });

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      comments,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Comments cannot be retrieved, please try again later",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    //check if the logged in user is the author of the post
    if (post.author.toString() !== authorId)
      return res.status(403).json({
        message: "Unauthorized",
        success: false,
      });

    //delete post
    await Post.findByIdAndDelete(postId);

    //remove the post id from the user's post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    //delete associated comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Post cannot be deleted, please try again later",
    });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);

    if (!post)
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      //already bookmarked -> remove from the bookmarks
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Post remove from the bookmarks",
        type: "unsaved",
      });
    } else {
      //not bookmarked -> add to the bookmarks
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        message: "Post bookmarked successfully",
        success: true,
        type: "saved",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Post cannot be bookmarked, please try again later",
    });
  }
};
