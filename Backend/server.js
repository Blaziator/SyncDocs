import "dotenv/config";
import {createServer} from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app from "./app.js";
import {setupCollaboration} from "./socket/collaboration.js";
import logger from "./utils/logger.js";

if (process.env.DISABLE_RATE_LIMIT === "true") {
    logger.warn("Rate limiting is DISABLED");
}

const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);
setupCollaboration(httpServer);

connectDB().then(()=>{
    httpServer.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });
});