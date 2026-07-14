import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .min(8)
        .required(),
    claimDocId: Joi.string()
        .length(24)
        .hex()
        .optional()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    claimDocId: Joi.string().length(24).hex().optional()
});