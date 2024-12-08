import PostModel from "../models/post.js";
import UserModel from "../models/user.js";
import FolderModel from "../models/folderElement.js";


export const getAllPosts = async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const regex = new RegExp(filter, "i");

    const sortBy = req.query.sortBy;
    const sortObj = {};

    let posts = [];

    if (sortBy) {
      sortObj[sortBy] = -1;
      posts = await PostModel.find({ title: regex }).sort(sortObj).populate("user").exec();
    } else {
      if (filter) {
        posts = await PostModel.find({ title: regex }).sort({ viewsCount: -1 }).populate("user").exec();
      } else {
        posts = await PostModel.find({ title: regex }).sort({ createdAt: -1 }).populate("user").exec();
      }
    }

    res.send(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to get articles" });
  }
};

export const getOnePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const posts = await PostModel.findOneAndUpdate(
      // filter
      {
        _id: postId, //по чому шукаємо
      },
      // update
      {
        $inc: { viewsCount: 1 }, // збільшити на 1
      },
      // return new or not
      {
        new: true,
      }
    ).populate("user");

    res.send(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to get article" });
  }
};

export const createPost = async (req, res) => {
  try {
    const image = req.body.image;

    const doc = new PostModel({
      title: req.body.title,
      text: req.body.text,
      tags: req.body.tags,
      image: image ? image : "",
      user: req.userId,
    });

    const post = await doc.save();

    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to create article" });
  }
};

export const removePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.userId;

    const currentPost = await PostModel.find({ _id: postId }).populate("user").exec();
    const currentUser = await UserModel.findById(currentUserId);

    if (currentUserId !== currentPost[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Article error", message: "access is denied" });
    }

    const post = await PostModel.findOneAndDelete({
      _id: postId,
    });

    if (!post) {
      return res.status(404).json({
        title: "Article error",
        message: "article not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to delete article" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.userId;

    const post = await PostModel.find({ _id: postId }).populate("user").exec();
    const currentUser = await UserModel.findById(currentUserId);

    if (currentUserId !== post[0].user._id.toString() && currentUser.accessLevel !== "admin") {
      console.log("access is denied");
      return res.status(500).json({ title: "Article error", message: "access is denied" });
    }

    const image = req.body.image;

    await PostModel.updateOne(
      {
        _id: postId,
      },
      {
        title: req.body.title,
        text: req.body.text,
        tags: req.body.tags,
        image: req.body.image,
        user: post[0].user._id,
      }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Article error", message: "failed to update the article" });
  }
};
