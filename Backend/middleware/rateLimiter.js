import rateLimit from "express-rate-limit";

const RATE_LIMIT_DISABLED = process.env.DISABLE_RATE_LIMIT === "true";

const passThrough = (req, res, next) => next();

function buildLimiter(options) {
    if (RATE_LIMIT_DISABLED) {
        return passThrough;
    }
    return rateLimit(options);
}

export const authLimiter = buildLimiter({
    windowMs: 15*60*1000,
    max: 10,
    message: {message: "Too many attempts. Please try again in 15 minutes."},
    standardHeaders: true,
    legacyHeaders: false,
});

export const guestDocLimiter = buildLimiter({
    windowMs: 10*60*1000,
    max: 20,
    message: {message: "Too many documents created. Please try again later."},
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalLimiter = buildLimiter({
    windowMs: 15*60*1000,
    max: 300,
    message: {message: "Too many requests. Please slow down."},
    standardHeaders: true,
    legacyHeaders: false,
})