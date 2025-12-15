const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI || "mongodb://mongodb:27017/IMS";

const connectToMongo = async () => {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(mongoURI);

    console.log("Connected to Mongo Successfully!");
  } catch (error) {
    console.error("Mongo connection failed:");
    console.error(error.message);

    // HARD FAIL — do not run backend without DB
    process.exit(1);
  }
};

module.exports = connectToMongo;

