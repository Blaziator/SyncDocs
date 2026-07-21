import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error(err);

    const statusCode = err.statusCode || 500;
    const message = err.statusCode? err.message: "Something went wrong. Please try again.";

    res.status(statusCode).json({ message });
};