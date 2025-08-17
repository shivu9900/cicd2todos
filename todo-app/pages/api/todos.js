import db from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const [rows] = await db.query("SELECT * FROM todos");
    res.status(200).json(rows);
  } else if (req.method === "POST") {
    const { text } = req.body;
    await db.query("INSERT INTO todos (text) VALUES (?)", [text]);
    res.status(201).end();
  } else {
    res.status(405).end();
  }
}
