import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

const fetchuser = async (req, res, next) => {
  //  Get the user from the jwt token and add id to req object //

  const token = req.header("auth-token");

  if (!token) {
    res.status(401).send("Please authenticate using a valid token");
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = data.user

    req.user = await User.findById(data.id).select("-password");

    next();
  } catch (err) {
    res.status(401).send("Please authenticate using a valid token");
  }
};

export default fetchuser;
