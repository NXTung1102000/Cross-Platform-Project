const PostModel = require("../models/Posts");
const PostCommentModel = require("../models/PostComment");
const httpStatus = require("../utils/httpStatus");
const getPaginationParams = require("../utils/getPaginationParams");
const postCommentController = {};
postCommentController.create = async (req, res, next) => {
  try {
    let userId = req.userId;
    let post;
    try {
      post = await PostModel.findById(req.params.postId);
      if (post == null) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "Can not find post" });
      }

      if ((post.status = STATUS_DELETED)) {
        return res
          .status(httpStatus.GONE)
          .json({ message: "This post has been deleted" });
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
    const { content, commentAnswered } = req.body;

    const postComment = new PostCommentModel({
      user: userId,
      post: post._id,
      content: content,
      commentAnswered: commentAnswered ? commentAnswered : null,
    });

    let postCommentSaved = await postComment.save();
    // update countComments post
    console.log(req.params.postId);
    console.log(post.countComments ? post.countComments + 1 : 1);
    let postSaved = await PostModel.findByIdAndUpdate(req.params.postId, {
      countComments: post.countComments ? post.countComments + 1 : 1,
    });
    postCommentSaved = await PostCommentModel.findById(
      postCommentSaved._id
    ).populate("user", ["username", "phonenumber"]);
    return res.status(httpStatus.OK).json({
      data: postCommentSaved,
      post: postSaved,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

postCommentController.list = async (req, res, next) => {
  try {
    const query = { post: req.params.postId };

    const { offset, limit } = await getPaginationParams(req);
    let postComments = await PostCommentModel.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: "desc" })
      .populate("user", ["username", "phonenumber"]);
    return res.status(httpStatus.OK).json({
      data: postComments,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

module.exports = postCommentController;
