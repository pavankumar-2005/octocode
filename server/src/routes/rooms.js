import { Router } from "express";
import { nanoid } from "nanoid";
import { getDb } from "../db.js";

const LANGUAGES = ["python", "javascript", "java", "cpp", "c"];

const router = Router();

router.post("/", async (req, res) => {
  const room = {
    _id: nanoid(8),
    name: req.body?.name || "Untitled room",
    language: LANGUAGES.includes(req.body?.language) ? req.body.language : "python",
    createdAt: new Date(),
  };
  await getDb().collection("rooms").insertOne(room);
  res.status(201).json(room);
});

router.get("/:id", async (req, res) => {
  const room = await getDb().collection("rooms").findOne({ _id: req.params.id });
  if (!room) return res.status(404).json({ error: "room not found" });
  res.json(room);
});

export default router;
