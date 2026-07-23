import winston, { format } from "winston";

const {combine, timestamp, printf, colorize, errors, json} = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${typeof message === "object" ? JSON.stringify(message) : message}${metaStr}`;
});

const fileFormat = combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production"? "info": "debug",
    format: combine(
        timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
        errors({stack: true}),
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp({format: "YYYY-MM-DD HH:mm:ss"}), consoleFormat),
        }),
    ],
});

if(process.env.NODE_ENV !== "production"){
    logger.add(new winston.transports.File({ filename: "logs/combined.log", format: fileFormat }));
    logger.add(new winston.transports.File({ filename: "logs/error.log", level: "error", format: fileFormat }));
}

export default logger;