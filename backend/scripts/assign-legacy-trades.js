import "dotenv/config";
import { db } from "../db.js";

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run assign-legacy-trades -- user@example.com");
  process.exit(1);
}
const user = db.prepare("SELECT id, email FROM users WHERE email = ? COLLATE NOCASE").get(email);
if (!user) {
  console.error("No account found. Register the account first.");
  process.exit(1);
}
const assign = db.transaction(() =>
  db.prepare("UPDATE journal_entries SET user_id = ? WHERE user_id IS NULL").run(user.id).changes
);
console.log(`Assigned ${assign()} legacy trade(s) to ${user.email}.`);
