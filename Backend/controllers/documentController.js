import Document from "../models/document.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { asyncWrapper } from "../utils/asyncWrapper.js";
import { AppError } from "../utils/AppError.js";

export const createGuestDoc = asyncWrapper(async(req, res)=>{
    const newDoc = await Document.create({
        isGuest: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ docId: newDoc._id});
});

export const createDocument = asyncWrapper(async(req, res)=>{
    const {title} = req.body;
    const newDoc = await Document.create({
        title,
        owner: req.userId
    });

    res.status(201).json({doc: newDoc});
});

export const getDashboard = asyncWrapper(async(req,res)=>{
    const allDoc = await Document.find({
        $or: [
            {owner: req.userId},
            {"collaborators.user": req.userId}
        ]
    }).sort({ updatedAt: -1}).populate("owner", "name");

    res.status(200).json({ docs: allDoc });
});

export const getDocument = asyncWrapper(async(req, res)=>{

    const {docId} = req.params;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const existingDoc = await Document.findById(docId);

    if(!existingDoc){
        throw new AppError("Document not found", 404);
    }

    if(existingDoc.owner && (!req.userId || existingDoc.owner.toString() !== req.userId)){
        const isCollaborator = existingDoc.collaborators.some(
            (c)=> c.user.toString() === req.userId
        );
        if(!isCollaborator){
            throw new AppError("You don't have access to this document", 403);
        }
    }

    res.status(200).json({ doc: existingDoc });
});

export const updateDocument = asyncWrapper(async(req, res)=>{

    const {docId} = req.params;
    const {title} = req.body;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const doc = await Document.findById(docId);

    if(!doc){
        throw new AppError("Document not found", 404);
    }

    if(!doc.owner || doc.owner.toString() !== req.userId){
        throw new AppError("Only the owner can rename this document", 403);
    }

    doc.title = title;
    await doc.save();
    await doc.populate("owner", "name");

    res.status(200).json({doc});
});

export const claimDocument = asyncWrapper(async(req, res)=>{

    const {docId} = req.body;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const existingDoc = await Document.findById(docId);

    if(!existingDoc){
        throw new AppError("Document not found or already expired", 404);
    }

    if(!existingDoc.isGuest){
        throw new AppError("Document already has an owner", 400);
    }

    existingDoc.owner = req.userId;
    existingDoc.isGuest = false;
    existingDoc.expiresAt= null;

    await existingDoc.save();

    res.status(200).json({ message: "Document claimed successfully", doc: existingDoc });
});

export const generateShareLink = asyncWrapper(async(req, res)=>{

    const {docId} = req.params;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const existingDoc = await Document.findById(docId);

    if(!existingDoc){
        throw new AppError("Document not found or already expired", 404);
    }

    if (!existingDoc.owner || existingDoc.owner.toString() !== req.userId) {
        throw new AppError("Only the owner can share this document", 403);
    }

    if(!existingDoc.shareId){
        existingDoc.shareId = crypto.randomUUID();
        await existingDoc.save();
    }         
    
    return res.status(200).json({
        shareId: existingDoc.shareId,
        sharePermission: existingDoc.sharePermission
    });
});

export const updateSharePermission = asyncWrapper(async(req, res)=>{

    const {docId} = req.params;
    const { permission } = req.body;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const existingDoc = await Document.findById(docId);

    if(!existingDoc){
        throw new AppError("Document not found or already expired", 404);
    }     

    if (!existingDoc.owner || existingDoc.owner.toString() !== req.userId) {
        throw new AppError("Only the owner can change sharing permissions", 403);
    }

    existingDoc.sharePermission = permission;
    await existingDoc.save();

        res.status(200).json({
        message: "Share permission updated",
        sharePermission: existingDoc.sharePermission
    });        
});

export const getDocumentByShareId = asyncWrapper(async(req, res)=>{

    const {shareId} = req.params;
    const existingDoc = await Document.findOne({ shareId });

    if(!existingDoc){
        throw new AppError("Document not found or already expired", 404);
    }

    const isOwner = existingDoc.owner && existingDoc.owner.toString() === req.userId;

    if (existingDoc.sharePermission === "edit" && req.userId && !isOwner) {

        await Document.updateOne(
            {
                _id: existingDoc._id,
                "collaborators.user": { $ne: req.userId } 
            },
            {
                $push: { collaborators: { user: req.userId, permission: "edit" } }
            }
        );
    }

    const updatedDoc = await Document.findById(existingDoc._id);
    res.status(200).json({doc: updatedDoc});
});

export const deleteDocument = asyncWrapper(async(req, res)=>{

    const {docId} = req.params;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
        throw new AppError("Document not found", 404);
    }

    const existingDoc = await Document.findById(docId);

    if(!existingDoc){
        throw new AppError("Document not found or expired", 404);
    }

    if(!existingDoc.owner || existingDoc.owner.toString() !== req.userId){
        throw new AppError("Only the owner can delete this document", 403);
    }

    await Document.findByIdAndDelete(docId);

    res.status(200).json({ message: "Document deleted successfully" });
});