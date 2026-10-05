// CHANGED: Player-submitted claims are no longer accepted. `autoPrizeClaims.js` writes verified winners during each draw.
import Room from "../models/Room.js";
import PrizeClaim from "../models/PrizeClaim.js";

export async function getAdminClaims(req, res) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message:
                    "Room code is required",
            });
        }

        const room = await Room.findOne({
            code,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const claims =
            await PrizeClaim.find({
                room: room._id,
            })
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                )
                .sort({
                    createdAt: -1,
                });

        return res.json({
            claims,
        });
    } catch (error) {
        console.error(
            "Get admin claims error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to load claims",
        });
    }
}

export async function verifyClaim(req, res) {
    try {
        const { claimId } = req.params;

        if (!claimId) {
            return res.status(400).json({
                message:
                    "Claim ID is required",
            });
        }

        const claim =
            await PrizeClaim.findById(
                claimId
            );

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending claims can be verified",
            });
        }

        claim.status = "verified";
        claim.verifiedAt = new Date();

        await claim.save();

        await PrizeClaim.updateMany(
            {
                room: claim.room,
                prizeId: claim.prizeId,
                _id: {
                    $ne: claim._id,
                },
                status: "pending",
            },
            {
                $set: {
                    status: "rejected",
                },
            }
        );

        const updatedClaim =
            await PrizeClaim.findById(
                claim._id
            )
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                );

        return res.json({
            message:
                "Prize claim verified successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error(
            "Verify claim error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to verify claim",
        });
    }
}

export async function rejectClaim(req, res) {
    try {
        const { claimId } = req.params;

        if (!claimId) {
            return res.status(400).json({
                message:
                    "Claim ID is required",
            });
        }

        const claim =
            await PrizeClaim.findById(
                claimId
            );

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending claims can be rejected",
            });
        }

        claim.status = "rejected";

        await claim.save();

        const updatedClaim =
            await PrizeClaim.findById(
                claim._id
            )
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                );

        return res.json({
            message:
                "Prize claim rejected successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error(
            "Reject claim error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to reject claim",
        });
    }
}
