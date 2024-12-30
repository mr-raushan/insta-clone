import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({});

const connectDB = () => {
  mongoose
    .connect(process.env.MONGODB_URL, {})
    .then(() => {
      console.log("DB connection established");
    })
    .catch((err) => {
      console.log("DB connection issue");
      console.log(err);
      process.exit(1);
    });
};

export default connectDB;
