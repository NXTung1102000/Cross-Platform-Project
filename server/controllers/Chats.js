const { PRIVATE_CHAT, GROUP_CHAT } = require("../constants/constants");
const ChatModel = require("../models/Chats");
const MessagesModel = require("../models/Messages");
const getPaginationParams = require("../utils/getPaginationParams");
const httpStatus = require("../utils/httpStatus");
const { isValidId } = require("../utils/validateIdString");

const chatController = {};
chatController.send = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { receivedId, content } = req.body;

    let chatId;

    const existingChat = await ChatModel.findOne({
      member: { $all: [userId, receivedId] },
    });

    if (existingChat) {
      chatId = existingChat._id;
    } else {
      const newChat = new ChatModel({
        type: PRIVATE_CHAT,
        member: [userId, receivedId],
      });
      const savedChat = await newChat.save();
      chatId = savedChat._id;
    }

    if (content) {
      let message = new MessagesModel({
        chat: chatId,
        user: userId,
        content: content,
      });
      await message.save();
      const savedMessage = await MessagesModel.findById(message._id)
        .populate("chat")
        .populate({
          path: "user",
          select: "_id username",
          populate: {
            path: "avatar",
            select: "_id fileName",
            model: "Documents",
          },
          model: "Users",
        });

      await ChatModel.findByIdAndUpdate(chatId, {
        latestMessageSentAt: savedMessage.createdAt,
      });

      return res.status(httpStatus.CREATED).json({
        data: savedMessage,
      });
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Content must not be empty",
      });
    }
  } catch (e) {
    console.error(e.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error sending message",
    });
  }
};

chatController.getChats = async (req, res, next) => {
  try {
    const { offset, limit } = await getPaginationParams(req);
    let chats = await ChatModel.find({ member: req.userId })
      .skip(offset)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .populate({
        path: "member",
        select: "_id username phonenumber avatar",
        model: "Users",
        populate: {
          path: "avatar",
          select: "_id fileName",
          model: "Documents",
        },
      });

    const latestMessagePromises = chats.map((chat) => {
      const chatId = chat._id;
      return MessagesModel.findOne({ chat: chatId })
        .sort({ createdAt: -1 })
        .exec();
    });

    const latestMessages = await Promise.all(latestMessagePromises);

    const chatsWithLatestMessage = chats.map((chat, idx) => {
      const latestMessage = latestMessages[idx];
      return {
        ...chat.toObject(),
        latestMessage: {
          content: latestMessage ? latestMessage.content : null,
          createdAt: latestMessage ? latestMessage.createdAt : null,
        },
      };
    });

    return res.status(httpStatus.OK).json({
      data: chatsWithLatestMessage,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error getting chats",
    });
  }
};

chatController.getMessages = async (req, res, next) => {
  let queryChatId, messages;
  const userId = req.userId;

  const { otherUserId, chatId } = req.query;

  if (!otherUserId && !chatId) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Other user id or chat id must be provided",
    });
  }

  if (otherUserId && !isValidId(otherUserId)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Invalid other user id provided",
    });
  }

  if (chatId && !isValidId(chatId)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Invalid chat id provided",
    });
  }

  try {
    if (otherUserId) {
      const existingChat = await ChatModel.findOne({
        member: { $all: [userId, otherUserId] },
      });
      // console.log("existing chat: ", existingChat);
      if (!existingChat) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: "Chat does not exist between 2 users",
        });
      }
      queryChatId = existingChat._id;
    } else if (chatId) {
      queryChatId = req.params.chatId;
    }

    const { offset, limit } = await getPaginationParams(req);

    messages = await MessagesModel.find({ chat: queryChatId })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: "desc" })
      .populate({
        path: "user",
        select: "_id username",
        populate: {
          path: "avatar",
          select: "_id fileName",
          model: "Documents",
        },
        model: "Users",
      });

    return res.status(httpStatus.OK).json({
      data: messages,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error getting messages",
    });
  }
};

chatController.deleteMessage = async (req, res, next) => {
  const { messageId, chatId } = req.body;

  const userId = req.userId;

  try {
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Chat not found!",
      });
    }

    const isUserInChat = chat.member.includes(userId);

    if (!isUserInChat) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "Cannot modify messages of other users!",
      });
    }

    const deletedMessage = await MessagesModel.findByIdAndDelete(messageId);

    const numOfMessages = await MessagesModel.find({ chat: chat._id }).count();
    if (numOfMessages === 0) {
      await ChatModel.findByIdAndDelete(chat._id);
    }

    return res.status(httpStatus.OK).json({
      data: deletedMessage,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error deleting message",
    });
  }
};

chatController.deleteChat = async (req, res, next) => {
  const userId = req.userId;
  const { chatId } = req.body;

  if (!isValidId(chatId)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Invalid id format",
    });
  }

  try {
    const chat = await ChatModel.findOne({ _id: chatId });
    if (!chat) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Chat not found!",
      });
    }

    const isUserInChat = chat.member.includes(userId);
    if (!isUserInChat) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "Cannot delete chat of other users!",
      });
    }

    // delete all the messages of the chat first
    await MessagesModel.deleteMany({ chat: chatId });

    // delete the chat
    const deletedChat = await ChatModel.findByIdAndUpdate(chatId, {
      isDeleted: true,
    });
    return res.status(httpStatus.OK).json({
      data: deletedChat,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error deleting chat",
    });
  }
};

module.exports = chatController;
