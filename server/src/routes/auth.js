import { Router } from "express";
import { nanoid } from "nanoid";
import { getDb } from "../db.js";
import { checkPassword, createSession, deleteSession, hashPassword, requireUser, tokenFrom } from "../auth.js";

const router = Router();
const users = () => getDb().collection("users");

// Never send the password hash to the browser.
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email });

router.post("/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!name) return res.status(400).json({ error: "name required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "valid email required" });
  if (password.length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });

  const user = { _id: nanoid(12), name, email, passwordHash: await hashPassword(password), createdAt: new Date() };
  try {
    await users().insertOne(user);
  } catch (err) {
    // 11000 = duplicate key: the unique index on email (see db.js) rejected it.
    if (err.code === 11000) return res.status(409).json({ error: "email already registered" });
    throw err;
  }
  res.status(201).json({ token: await createSession(user._id), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = await users().findOne({ email });
  // Same message for "no such email" and "wrong password", so nobody can probe which emails exist.
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "wrong email or password" });
  }
  res.json({ token: await createSession(user._id), user: publicUser(user) });
});

router.get("/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

router.post("/logout", requireUser, async (req, res) => {
  await deleteSession(tokenFrom(req));
  res.status(204).end();
});

export default router;
