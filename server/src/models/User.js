import mongoose from "mongoose";

const s = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "",
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: ["player", "admin"],
            default: "player",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("User", s);