import "dotenv/config";
import {createServer} from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {origin: process.env.CLIENT_URL, credentials: true}
});


connectDB().then(()=>{
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});