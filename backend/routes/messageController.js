import express from "express";
import fetchuser from "../middleware/fetchuser.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import { Chat } from "../models/chatModel.js";

const router = express.Router();

// Create New Message POST /api/Message/  //

router.post("/", fetchuser, async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    //   Chat.findByIdAndUpdate(req.body.chatId , { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Get all Messages GET /api/Message/:chatId

router.get("/:chatId", fetchuser, async (req, res) => {
  try {
    let message = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export default router;
