import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({});

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "Invalid token or invalid username",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    if (!decode) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    req.id = decode.user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message:
        "User is not authenticated, please login to access this resource",
    });
  }
};

export default isAuthenticated;
