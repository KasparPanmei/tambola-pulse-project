import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";



export async function getActiveRoom(req, res) {
    try {
        const room = await Room.findOne({
            status: {
                $in: ["upcoming", "live"],
            },
        }).sort({
            startsAt: 1,
            createdAt: -1,
        });

        if (!room) {
            return res.status(404).json({
                message: "No active game room found",
            });
        }

        const tickets = await Ticket.find({
            room: room._id,
            status: "available",
        })
            .sort({
                number: 1,
            })
            .select(
                "_id number publicCode grid status"
            );

        return res.json({
            room,
            tickets,
        });
    } catch (error) {
        console.error(
            "Get active room error:",
            error
        );

        return res.status(500).json({
            message: "Unable to load active game room",
        });
    }
}


export async function getRoom(req, res) {
    try {
        const code = req.params.code
            ?.trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message: "Room code is required",
            });
        }

        const room = await Room.findOne({
            code,
        });

        if (!room) {
            return res.status(404).json({
                message: `Room ${code} not found`,
            });
        }

        const tickets = await Ticket.find({
            room: room._id,
            status: "available",
        })
            .sort({
                number: 1,
            })
            .select(
                "_id number publicCode grid status"
            );

        return res.json({
            room,
            tickets,
        });
    } catch (error) {
        console.error(
            "Get room error:",
            error
        );

        return res.status(500).json({
            message: "Unable to load game room",
            error: error.message,
        });
    }
}