import crypto from "crypto";
import { promisify } from "util";
import { getDb } from "./db.js";

// scrypt is built into Node: a deliberately slow hash, so stolen hashes are hard to brute-force.
const scrypt = promisify(crypto.scrypt);
const SESSION_DAYS = 7;

const users = () => getDb().collection("users");
const sessions = () => getDb().collection("sessions");

export async function hashPassword(password) {
  // A random salt per user: two people with the same password get different hashes.
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function checkPassword(password, stored) {
  const [salt, hex] = stored.split(":");
  const hash = await scrypt(password, salt, 64);
  // timingSafeEqual takes the same time for every input, so timing can't leak the hash.
  return crypto.timingSafeEqual(hash, Buffer.from(hex, "hex"));
}

// We store only a SHA-256 of the token, so a leaked database can't be used to log in.
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await sessions().insertOne({
    _id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000), // TTL index deletes it
  });
  return token;
}

export const deleteSession = (token) => sessions().deleteOne({ _id: hashToken(token) });

export async function userFromToken(token) {
  if (!token) return null;
  const session = await sessions().findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return users().findOne({ _id: session.userId }, { projection: { passwordHash: 0 } });
}

// "Authorization: Bearer <token>" → "<token>"
export const tokenFrom = (req) => req.headers.authorization?.replace(/^Bearer /, "") || null;

// Runs on every request: sets req.user to the logged-in user, or null for guests.
export function attachUser(req, _res, next) {
  userFromToken(tokenFrom(req))
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(next);
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "login required" });
  next();
}
