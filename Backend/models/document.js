import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        default: "Untitled Document"
    },
    content:{
        type: Buffer,
        default: null
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    collaborators: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            permission: {
                type: String,
                enum: ["view", "edit"],
                default: "view"
            }
        }
    ],
    shareId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {timestamps: true});

documentSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

export default mongoose.model("Document", documentSchema);