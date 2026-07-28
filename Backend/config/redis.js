import Redis from "ioredis";
import logger from "./utils/logger.js";

const useRedis = process.env.USE_REDIS === "true";

let publisher = null;
let subscriber = null;

if (useRedis) {
    logger.warn("Redis enabled");

    publisher = new Redis(process.env.REDIS_URL);
    subscriber = new Redis(process.env.REDIS_URL);

    publisher.on("connect", () =>
        logger.info("Redis publisher connected")
    );

    subscriber.on("connect", () =>
        logger.info("Redis subscriber connected")
    );

    publisher.on("error", (err) =>
        logger.error("Redis publisher error", err)
    );

    subscriber.on("error", (err) =>
        logger.error("Redis subscriber error", err)
    );
} else {
    logger.warn("Redis disabled");
}

export { publisher, subscriber, useRedis};