import express from "express";
import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fetchuser from "../middleware/fetchuser.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Route 1.  Create a User using POST "/api/auth/createuser". NO LOGIN REQUIRED //

router.post("/createUser", async (req, res) => {
  const { name, email, password, pic } = req.body;

  // Check wether the user with this email exists already //

  let userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ error: "User already exists" });
  }

  //       Protect YOur Password by bcrypt genSalt and hash //

  const salt = await bcrypt.genSalt(10);
  const securePassword = await bcrypt.hash(password, salt);

  //       Create a new User //

  const user = await User.create({
    name,
    email,
    password: securePassword,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ error: "Failed to Create the User" });
  }
});

// Route 2.  Authenticate a User using POST "/api/auth/login". NO LOGIN REQUIRED

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    // Compare Your Password with dataBase password hash //
    const comparePassword = await bcrypt.compare(password, user.password);

    if (comparePassword) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ error: "Invalid Password" });
    }
  } else {
    res.status(400).json({ error: "Invalid User Detail " });
  }
});

// Get or Search all users //

router.get("/allUsers", fetchuser, async (req, res) => {
  const keyword = req.query.search
  ? {
    $or: [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ],
  }
: {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

export default router;
