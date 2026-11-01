import { Router } from "express";
import { nanoid } from "nanoid";
import { getDb } from "../db.js";
import { requireUser } from "../auth.js";
import { onlineCount } from "../yjs.js";

const LANGUAGES = ["python", "javascript", "java", "cpp", "c"];
const TEMP_HOURS = 24; // how long a temporary room lives
export const MAX_TEAM = 6; // a room is for 1 to 6 people

// Rooms made before team sizes existed have no teamSize; they allow the maximum.
export const teamLimit = (room) => room.teamSize ?? MAX_TEAM;

const router = Router();
const rooms = () => getDb().collection("rooms");

// MongoDB's TTL cleaner runs about once a minute, so also hide rooms that expired a moment ago.
export function findLiveRoom(id) {
  return rooms().findOne({ _id: id, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] });
}

// My long-term projects (the dashboard list), most recently opened first.
router.get("/", requireUser, async (req, res) => {
  const list = await rooms()
    .find({ kind: "project", members: req.user._id })
    .sort({ lastOpenedAt: -1, createdAt: -1 })
    .toArray();
  res.json(list);
});

router.post("/", async (req, res) => {
  const kind = req.body?.kind === "project" ? "project" : "temporary";
  if (kind === "project" && !req.user) return res.status(401).json({ error: "login required" });
  const teamSize = Number(req.body?.teamSize);
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > MAX_TEAM) {
    return res.status(400).json({ error: `team size must be 1 to ${MAX_TEAM}` });
  }

  const room = {
    _id: nanoid(8),
    name: req.body?.name || "Untitled room",
    language: LANGUAGES.includes(req.body?.language) ? req.body.language : "python",
    kind,
    teamSize,
    createdAt: new Date(),
  };
  if (kind === "project") {
    room.ownerId = req.user._id;
    room.members = [req.user._id];
    room.lastOpenedAt = room.createdAt;
  } else {
    room.expiresAt = new Date(Date.now() + TEMP_HOURS * 60 * 60 * 1000);
  }
  await rooms().insertOne(room);
  if (room.expiresAt) {
    // Give the code document the same expiry, so the TTL index deletes it with the room.
    await getDb().collection("yjs_docs").insertOne({ _id: room._id, expiresAt: room.expiresAt });
  }
  res.status(201).json(room);
});

router.get("/:id", async (req, res) => {
  const room = await findLiveRoom(req.params.id);
  if (!room) return res.status(404).json({ error: "room not found" });
  const limit = teamLimit(room);
  if (room.kind === "project") {
    if (!req.user) return res.status(401).json({ error: "login required" });
    // Any signed-in user with the link joins the project (it then shows on their dashboard),
    // as long as the team isn't full yet.
    if (!room.members.includes(req.user._id)) {
      // Only add if there is no member at position limit-1, i.e. fewer than `limit` members.
      // Doing the check inside the update makes it atomic: two people joining at the same
      // moment can't both squeeze into the last seat.
      const joined = await rooms().updateOne(
        { _id: room._id, [`members.${limit - 1}`]: { $exists: false } },
        { $addToSet: { members: req.user._id } }
      );
      if (joined.modifiedCount === 0) return res.status(403).json({ error: "project is full" });
      room.members.push(req.user._id);
    }
    room.lastOpenedAt = new Date(); // powers "past projects", most recent first
    await rooms().updateOne({ _id: room._id }, { $set: { lastOpenedAt: room.lastOpenedAt } });
  } else if (onlineCount(room._id) >= limit) {
    // Quick sessions have no accounts, so the limit is on people in the room at the same time.
    return res.status(403).json({ error: "room is full" });
  }
  res.json(room);
});

export default router;
