import Room from "../models/Room.js";
// CHANGED: Every ball draw runs the server-side automatic prize evaluator.
import { autoClaimEligiblePrizes } from "./autoPrizeClaims.js";

export async function drawNextBall(roomCode) {
    const code = roomCode
        ?.trim()
        .toUpperCase();

    if (!code) {
        throw new Error("Room code is required");
    }

    for (let attempt = 0; attempt < 10; attempt++) {
        const room = await Room.findOne({
            code,
        });

        if (!room) {
            throw new Error(
                `Room ${code} not found`,
            );
        }

        if (room.status !== "live") {
            throw new Error(
                "Game is not currently live",
            );
        }

        const called = Array.isArray(
            room.calledNumbers,
        )
            ? room.calledNumbers
            : [];

        const totalBalls =
            Number(room.balls) || 90;

        if (called.length >= totalBalls) {
            throw new Error(
                "All balls have already been called",
            );
        }

        const remaining = [];

        for (
            let number = 1;
            number <= totalBalls;
            number++
        ) {
            if (!called.includes(number)) {
                remaining.push(number);
            }
        }

        const nextNumber =
            remaining[
            Math.floor(
                Math.random() *
                remaining.length,
            )
            ];

        const updated =
            await Room.findOneAndUpdate(
                {
                    _id: room._id,
                    status: "live",

                    calledNumbers: {
                        $ne: nextNumber,
                    },
                },

                {
                    $push: {
                        calledNumbers:
                            nextNumber,
                    },

                    $set: {
                        currentNumber:
                            nextNumber,

                        lastCalledAt:
                            new Date(),
                    },

                    $inc: {
                        gameVersion: 1,
                    },
                },

                {
                    new: true,
                },
            );

        if (updated) {
            // CHANGED: Award all newly eligible prizes automatically on the server; no player claim request is needed.
            await autoClaimEligiblePrizes(updated);
            return (await Room.findById(updated._id)) || updated;
        }
    }

    throw new Error(
        "Unable to draw the next ball",
    );
}



export function startGameEngine() {
    setInterval(async () => {
        try {
            const rooms =
                await Room.find({
                    status: "live",
                    autoCaller: true,
                });

            const now = Date.now();

            for (const room of rooms) {
                const cadence =
                    Number(
                        room.callCadence,
                    ) || 5;

                const lastCall =
                    room.lastCalledAt
                        ? new Date(
                            room.lastCalledAt,
                        ).getTime()
                        : 0;

                /*
                 * First ball is called after the
                 * configured cadence.
                 */
                if (
                    lastCall &&
                    now - lastCall <
                    cadence * 1000
                ) {
                    continue;
                }

                try {
                    const updated =
                        await drawNextBall(
                            room.code,
                        );

                } catch (error) {
                    console.error(
                        `Auto caller ${room.code}:`,
                        error.message,
                    );
                }
            }
        } catch (error) {
            console.error(
                "Game engine error:",
                error,
            );
        }
    }, 1000);
}