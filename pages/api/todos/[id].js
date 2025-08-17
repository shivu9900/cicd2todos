import db from "../../../lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "PUT") {
    const { completed } = req.body;
    await db.query("UPDATE todos SET completed = ? WHERE id = ?", [completed, id]);
    res.status(200).end();
  } else if (req.method === "DELETE") {
    await db.query("DELETE FROM todos WHERE id = ?", [id]);
    res.status(200).end();
  } else {
    res.status(405).end();
  }
}
