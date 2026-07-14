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
           .messages({
               "string.length": "Invalid document ID",
               "string.hex": "Invalid document ID"
           })
});

export const shareIdParamSchema = Joi.object({
    shareId: Joi.string().guid({ version: "uuidv4" }).required()
});

export const sharePermissionSchema = Joi.object({
    permission: Joi.string().valid("view", "edit").required()
});