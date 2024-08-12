import express from "express";
import cors from "cors";
// import { chats } from "./data/data.js";
import auth from "./routes/auth.js";
import chatController from "./routes/chatController.js";
import messageController from "./routes/messageController.js";
import "dotenv/config";
import colors from "colors";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import {createServer} from "http";

connectDB();
const app = express();
app.use(express.json());
app.use(cors());


const server = createServer(app)


// Available Routes
app.use("/api/auth", auth);
app.use("/api/chat", chatController);
app.use("/api/message", messageController);

const PORT = process.env.PORT || 4000;

//  app.listen(PORT, () => {
//   console.log(`Your Server has been started PORT NO. ${PORT} `.yellow.bold);
// });

// const io = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: "https://chat-unity.netlify.app" ,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData);
    // console.log(userData._id)
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Join room - " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  // socket.off("setup", () => {
  //   console.log("USER DISCONNECTED");
  //   socket.leave(userData._id);
  // });
});

// const io = new Server(httpServer, { cors: { origin: "https://example.com" } });


server.listen(5000, () => {
    console.log(`Your Server has been started PORT NO. ${PORT} `.yellow.bold);
  })