import type { VercelRequest, VercelResponse } from "@vercel/node";
import { calculateGrade } from "./fuzzy";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

type Buah = {
  id: number;
  nama: string;
  umur: number;
  rasa: number;
  kematangan: number;
  grade?: string;
};

type BuahInput = {
  nama: string;
  umur: number;
  rasa: number;
  kematangan: number;
};

const DB_PATH = "/tmp/database.json";

function readDB(): Buah[] {
  if (!existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeDB(data: Buah[]) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function validate(input: BuahInput): string | null {
  if (!input.nama) return "Nama buah wajib diisi";
  if (input.umur < 0 || input.umur > 7) return "Umur harus 0–7 hari";
  if (input.rasa < 0 || input.rasa > 10) return "Rasa harus 0–10";
  if (input.kematangan < 0 || input.kematangan > 100) return "Kematangan harus 0–100%";
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.url?.split("?")[0];

  try {
    // POST /buah
    if (path === "/buah" && req.method === "POST") {
      const body = req.body as BuahInput;
      const err = validate(body);
      if (err) return res.status(400).json({ error: err });

      const result = calculateGrade(body.umur, body.rasa, body.kematangan);
      const data = readDB();
      const newBuah: Buah = { id: Date.now(), ...body, grade: result.grade };
      data.push(newBuah);
      writeDB(data);
      return res.json({ ...newBuah, detail: result });
    }

    // GET /buah
    if (path === "/buah" && req.method === "GET") {
      return res.json(readDB());
    }

    // DELETE /buah/:id
    if (path?.startsWith("/buah/") && req.method === "DELETE") {
      const id = Number(path.split("/")[2]);
      const data = readDB();
      const filtered = data.filter((b) => b.id !== id);
      if (filtered.length === data.length)
        return res.status(404).json({ error: "Data tidak ditemukan" });
      writeDB(filtered);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "Not Found" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}