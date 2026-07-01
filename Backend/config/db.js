import mongoose from "mongoose";

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connection established with MongoDB");
    }catch(err){
        console.error(`Failed to connect to the DB, Error: ${err}`);
        process.exit(1);
    }
}

export default connectDB;