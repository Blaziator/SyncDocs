import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    message: {message: "Too many attempts. Please try again in 15 minutes."},
    standardHeaders: true,
    legacyHeaders: false,
});

export const guestDocLimiter = rateLimit({
    windowMs: 10*60*1000,
    max: 20,
    message: {message: "Too many documents created. Please try again later."},
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 300,
    message: {message: "Too many requests. Please slow down."},
    standardHeaders: true,
    legacyHeaders: false,
})