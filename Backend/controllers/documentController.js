    import Document from "../models/document.js";

    export const createGuestDoc = async(req, res)=>{
        
        try{
            const newDoc = await Document.create({
                isGuest: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            res.status(201).json({ docId: newDoc._id});

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while creating guest document"});
        }
    };

    export const createDocument = async(req, res)=>{

        try{

            const {title} = req.body;

            const newDoc = await Document.create({
                title,
                owner: req.userId
            });

            res.status(201).json({newDoc});

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while creating new document"});
        }
    };

    export const getDashboard = async(req,res)=>{

        try{

            const allDoc = await Document.find({owner:req.userId}).sort({ updatedAt: -1});

            res.status(200).json({ allDoc });

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while loading dashboard"});
        }
    };

    export const getDocument = async(req, res)=>{
        try{

            const {docId} = req.params;

            const existingDoc = await Document.findById(docId);

            if(!existingDoc){
                return res.status(404).json({message: "Document not found"});
            }

            if(existingDoc.owner && (!req.userId || existingDoc.owner.toString() !== req.userId)){
                const isCollaborator = existingDoc.collaborators.some(
                    (c)=> c.user.toString() === req.userId
                );
                if(!isCollaborator){
                    return res.status(403).json({message: "You don't have access to this document"});
                }
            }

            res.status(200).json({ existingDoc });

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while fetching document"});
        }
    };

    export const claimDocument = async(req, res)=>{

        try{
            const {docId} = req.body;

            const existingDoc = await Document.findById(docId);

            if(!existingDoc){
                return res.status(404).json({message: "Document not found or already expired"});
            }

            if(!existingDoc.isGuest){
                return res.status(400).json({ message: "Document already has an owner" });
            }

            existingDoc.owner = req.userId;
            existingDoc.isGuest = false;
            existingDoc.expiresAt= null;

            await existingDoc.save();

            res.status(200).json({ message: "Document claimed successfully", existingDoc });

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while claiming this document"});
        }
    };

    export const deleteDocument = async(req, res)=>{

        try{
            const {docId} = req.params;

            const existingDoc = await Document.findById(docId);

            if(!existingDoc){
                return res.status(404).json({message: "Document not found or expired"});
            }

            if(!existingDoc.owner || existingDoc.owner.toString() !== req.userId){
                return res.status(403).json({ message: "Only the owner can delete this document" });
            }

            await Document.findByIdAndDelete(docId);

            res.status(200).json({ message: "Document deleted successfully" });

        }catch(err){
            console.error(err);
            res.status(500).json({message: "Server error while deleting document"});
        }

    };