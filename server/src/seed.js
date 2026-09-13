import "dotenv/config";
import { connectDB } from "./config/db.js";
import Room from "./models/Room.js";
import Ticket from "./models/Ticket.js";
import { generateTicket } from "./utils/tickets.js";
await connectDB();
await Ticket.deleteMany({});
await Room.deleteMany({});
const room = await Room.create({
    code: "TAM-8842",
    title: "Pick Your Lucky Numbers & Win Jackpot Housie",
    description:
        "Official weekend mega bumper draw with instant UPI automated settlements.",
    status: "live",
    startsAt: new Date(Date.now() - 300000),
    ticketPrice: 50,
    jackpot: 15000,
    balls: 90,
});
const docs = Array.from({ length: 24 }, (_, i) => ({
    room: room._id,
    number: 101 + i,
    publicCode: `TAM-8842-${String(i + 1).padStart(2, "0")}`,
    grid: generateTicket(),
}));
await Ticket.insertMany(docs);
console.log(`Seeded ${room.code} with ${docs.length} tickets`);
process.exit(0);
