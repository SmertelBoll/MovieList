import CommentModel from "../models/comment.js";
import MovieModel from "../models/movie.js";

export const getAllCommentsByMovie = async (req, res) => {
  try {
    const movieId = req.params.movieId;

    const comments = await CommentModel.find({ movie: movieId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        populate: {
          path: "avatar",
        },
      })
      .exec();

    res.send(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Comments error", message: "could not get comments" });
  }
};

export const getAllCommentsByUser = async (req, res) => {  // всі коменти залишені під статтями юзера
  try {
    const userId = req.userId;
    const limitOfComments = req.query.limit;
    const skipOfComments = req.query.skip;

    const moviesByUser = await MovieModel.find({ user: userId }).exec();

    const moviesId = moviesByUser.map((obj) => obj._id);

    let comments = [];

    if (limitOfComments && skipOfComments) {
      comments = await CommentModel.find({ movie: { $in: moviesId } })
        .sort({ createdAt: -1 })
        .skip(parseInt(skipOfComments))
        .limit(parseInt(limitOfComments))
        .populate({
          path: "user",
          populate: {
            path: "avatar",
          },
        })
        .exec();
    } else {
      if (limitOfComments) {
        comments = await CommentModel.find({ movie: { $in: moviesId } })
          .sort({ createdAt: -1 })
          .limit(parseInt(limitOfComments))
          .populate({
            path: "user",
            populate: {
              path: "avatar",
            },
          })
          .exec();
      } else {
        comments = await CommentModel.find({ movie: { $in: moviesId } })
          .sort({ createdAt: -1 })
          .populate({
            path: "user",
            populate: {
              path: "avatar",
            },
          })
          .exec();
      }
    }

    res.send(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Comments error", message: "could not get comments" });
  }
};

export const createComment = async (req, res) => {
  try {
    const doc = new CommentModel({
      text: req.body.text,
      movie: req.body.movieId,
      user: req.userId,
    });

    const comment = await doc.save();

    await MovieModel.findOneAndUpdate(
      // filter
      {
        _id: req.body.movieId, //по чому шукаємо
      },
      // update
      {
        $inc: { commentsCount: 1 }, // збільшити на 1
      }
    );

    res.json(comment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Comments error", message: "could not write a comment" });
  }
};

export const removeComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await CommentModel.findOneAndDelete({
      _id: commentId,
    });

    if (!comment) {
      return res.status(404).json({
        title: "Comments error",
        message: "no comment found",
      });
    }

    await MovieModel.findOneAndUpdate(
      // filter
      {
        _id: comment.movie, //по чому шукаємо
      },
      // update
      {
        $inc: { commentsCount: -1 }, // зменшити на 1
      }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ title: "Comments error", message: "failed to delete comment" });
  }
};
