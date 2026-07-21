import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("Connection established with MongoDB");
    }catch(err){
        logger.error(`Failed to connect to the DB, Error: ${err}`);
        process.exit(1);
    }
}

export default connectDB;