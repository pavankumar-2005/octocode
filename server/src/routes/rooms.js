import { Router } from "express";
import { nanoid } from "nanoid";
import { getDb } from "../db.js";
import { requireUser } from "../auth.js";

const LANGUAGES = ["python", "javascript", "java", "cpp", "c"];
const TEMP_HOURS = 24; // how long a temporary room lives

const router = Router();
const rooms = () => getDb().collection("rooms");

// MongoDB's TTL cleaner runs about once a minute, so also hide rooms that expired a moment ago.
export function findLiveRoom(id) {
  return rooms().findOne({ _id: id, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] });
}

// My long-term projects (the dashboard list).
router.get("/", requireUser, async (req, res) => {
  const list = await rooms()
    .find({ kind: "project", members: req.user._id })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(list);
});

router.post("/", async (req, res) => {
  const kind = req.body?.kind === "project" ? "project" : "temporary";
  if (kind === "project" && !req.user) return res.status(401).json({ error: "login required" });

  const room = {
    _id: nanoid(8),
    name: req.body?.name || "Untitled room",
    language: LANGUAGES.includes(req.body?.language) ? req.body.language : "python",
    kind,
    createdAt: new Date(),
  };
  if (kind === "project") {
    room.ownerId = req.user._id;
    room.members = [req.user._id];
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
  if (room.kind === "project") {
    if (!req.user) return res.status(401).json({ error: "login required" });
    // Any signed-in user with the link joins the project; it then shows on their dashboard.
    if (!room.members.includes(req.user._id)) {
      await rooms().updateOne({ _id: room._id }, { $addToSet: { members: req.user._id } });
      room.members.push(req.user._id);
    }
  }
  res.json(room);
});

export default router;
