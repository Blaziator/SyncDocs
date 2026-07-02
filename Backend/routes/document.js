import express from "express";
import {createDocumentSchema, claimDocumentSchema} from "../validators/documentValidator.js";
import {createGuestDoc, createDocument, getDashboard, getDocument, claimDocument, deleteDocument} from "../controllers/documentController.js";
import authMiddleware from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboard);
router.post("/guest", createGuestDoc);
router.post("/create", authMiddleware, validate(createDocumentSchema), createDocument);
router.post("/claim", authMiddleware, validate(claimDocumentSchema), claimDocument);
router.get("/:docId", optionalAuth, getDocument);
router.delete("/:docId", authMiddleware, deleteDocument);

export default router;