import Joi from "joi";

export const createDocumentSchema = Joi.object({
  title: Joi.string()
        .min(1)
        .max(100)
        .trim()
        .optional()
});

export const claimDocumentSchema = Joi.object({
    docId: Joi.string()
           .length(24)
           .hex()
           .required()
           .message({
               "string.length": "Invalid document ID",
               "string.hex": "Invalid document ID"
           })
});