import express from "express";
import {createDocumentSchema, claimDocumentSchema, sharePermissionSchema} from "../validators/documentValidator.js";
import {createGuestDoc, createDocument, getDashboard, getDocument, updateDocument,claimDocument, deleteDocument, generateShareLink, updateSharePermission, getDocumentByShareId} from "../controllers/documentController.js";
import authMiddleware from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboard);
router.post("/guest", createGuestDoc);
router.post("/create", authMiddleware, validate(createDocumentSchema), createDocument);
router.patch("/:docId", authMiddleware, validate(createDocumentSchema), updateDocument)
router.post("/claim", authMiddleware, validate(claimDocumentSchema), claimDocument);
router.post("/:docId/share", authMiddleware, generateShareLink );
router.patch("/:docId/share-permission", authMiddleware, validate(sharePermissionSchema), updateSharePermission);
router.get("/shared/:shareId", optionalAuth, getDocumentByShareId);
router.get("/:docId", optionalAuth, getDocument);
router.delete("/:docId", authMiddleware, deleteDocument);

export default router;