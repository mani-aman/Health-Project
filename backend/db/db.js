const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/HealthAI");
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;