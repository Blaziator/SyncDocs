import User from "../models/user.js";
import Document from "../models/document.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

export const register = async(req, res)=>{
    const {name, email, password, claimDocId} = req.body;

    try{
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(409).json({message: "An account with this email already exists."});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        generateToken(res, newUser._id);

        if(claimDocId){
            const doc = await Document.findById(claimDocId);
            if(doc && doc.isGuest){
                doc.owner = newUser._id;
                doc.isGuest = false;
                doc.expiresAt = null;
                await doc.save();
            }
        }

        res.status(201).json({
            message: "User registered successfully",
            user: { id: newUser._id, name: newUser.name, email: newUser.email }
        })

    }catch(err){
        console.error(err);
        res.status(500).json({message: "Server error during registration"});
    }
};

export const login = async(req, res)=>{
    const {email, password, claimDocId} = req.body;

    try{
        const existingUser = await User.findOne({email}).select("+password");

        if(!existingUser){
            return res.status(401).json({message: "Invalid email or password"});
        }

        const isMatch = await bcrypt.compare(password, existingUser.password);

        if(!isMatch){
            return res.status(401).json({ message: "Invalid email or password" });
        }

        generateToken(res, existingUser._id);

        if(claimDocId){
            const doc = await Document.findById(claimDocId);
            if(doc && doc.isGuest){
                doc.owner = existingUser._id;
                doc.isGuest = false;
                doc.expiresAt = null;
                await doc.save();
            }
        }

        res.status(200).json({
            message: "Login successful",
            user: {id: existingUser._id, name: existingUser.name, email: existingUser.email}
        });

    }catch(err){
        console.error(err);
        res.status(500).json({message: "Server error during login"});
    }
};

export const logout = (req, res)=>{
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.status(200).json({message: "Logged out successfully"});
};

export const getMe = async(req, res)=>{
    try{
        const existingUser = await User.findById(req.userId);
        if(!existingUser){
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user: { id: existingUser._id, name: existingUser.name, email: existingUser.email } });

    }catch(err){
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
};