import User from "../models/user.js";
import Document from "../models/document.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import {asyncWrapper} from "../utils/asyncWrapper.js";
import {AppError} from "../utils/AppError.js";

export const register = asyncWrapper(async(req, res)=>{
    const {name, email, password, claimDocId} = req.body;

    const existingUser = await User.findOne({email});

    if(existingUser){
        throw new AppError("An account with this email already exists.", 409);
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
});

export const login = asyncWrapper(async(req, res)=>{
    const {email, password, claimDocId} = req.body;

    const existingUser = await User.findOne({email}).select("+password");

    if(!existingUser){
        throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if(!isMatch){
        throw new AppError("Invalid email or password", 401);
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
});

export const logout = (req, res)=>{
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.status(200).json({message: "Logged out successfully"});
};

export const getMe = asyncWrapper(async(req, res)=>{
    const existingUser = await User.findById(req.userId);
    if(!existingUser){
        throw new AppError("User not found", 404);
    }

    res.status(200).json({ user: { id: existingUser._id, name: existingUser.name, email: existingUser.email } });
});