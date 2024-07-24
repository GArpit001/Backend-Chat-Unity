import express from "express";
import fetchuser from "../middleware/fetchuser.js";
import { Chat } from "../models/chatModel.js";
import { User } from "../models/userModel.js";

const router = express.Router();

// Create or fetch One to One Chat Login is required   /api/chat/accessChat

router.post("/createChat", fetchuser, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res
      .status(401)
      .json({ error: "UserId param not sent with request" });
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  // let chatData;

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
  }

  try {
    const createdChat = await Chat.create(chatData);
    const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );
    res.status(200).send(FullChat);
  } catch (error) {
    console.log(error.message);
    // res.status(400).json({ error: error.message });
  }
});

// Fetch All Chats  Login is required   /api/chat/fetchChat

router.get("/fetchChat", fetchuser, async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name email pic",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a Group API  Login is required  /api/chat/group

router.post("/group", fetchuser, async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .json({ message: "More than 2 users are required to form a group chat" });
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create a Api for Group Name Change Login is required   /api/chat/groupRename //

router.put("/groupRename", fetchuser, async (req, res) => {
  const { chatId, chatName } = req.body;

  const updateChatName = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updateChatName) {
    res.status(404).json({ message: "Chat Not Found" });
  } else {
    res.json(updateChatName);
  }
});

// Create a Api for Add a user in Group Login is required   /api/chat/addFromGroup //

router.put("/addFromGroup", fetchuser, async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )

    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(400).json({ error: "Chat Not Found" });
  } else {
    res.json(added);
  }
});

// Create a Api for remove a user for Group Login is required   /api/chat/removeFromGroup //

router.put("/removeFromGroup", fetchuser, async (req, res) => {
  const { chatId, userId } = req.body;

  const removeed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )

    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removeed) {
    res.status(400).json({ error: "Chat Not Found" });
  } else {
    res.json(removeed);
  }
});

export default router;
