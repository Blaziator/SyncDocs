import "dotenv/config";
import {createServer} from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app from "./app.js";
import {setupCollaboration} from "./socket/collaboration.js";

const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);
setupCollaboration(httpServer);

connectDB().then(()=>{
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});