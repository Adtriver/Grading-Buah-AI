import { join } from "path";
import { calculateGrade } from "./fuzzy";

// ── Types ──
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

// ── Path ──
const DB_PATH = join(import.meta.dir, "database.json");

// ── Database ──
async function readDB(): Promise<Buah[]> {
  const file = Bun.file(DB_PATH);
  if (!(await file.exists())) return [];
  try {
    return JSON.parse(await file.text()) as Buah[];
  } catch {
    return [];
  }
}

async function writeDB(data: Buah[]) {
  await Bun.write(DB_PATH, JSON.stringify(data, null, 2));
}

// ── AI ──
async function getGrade(input: BuahInput) {
  return calculateGrade(input.umur, input.rasa, input.kematangan);
}

// ── Validation ──
function validate(input: BuahInput): string | null {
  if (!input.nama) return "Nama buah wajib diisi";
  if (input.umur < 0 || input.umur > 7) return "Umur harus 0–7 hari";
  if (input.rasa < 0 || input.rasa > 10) return "Rasa harus 0–10";
  if (input.kematangan < 0 || input.kematangan > 100) return "Kematangan harus 0–100%";
  return null;
}

// ── CORS helper ──
function cors(res: Response): Response {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

// ── Server ──
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*" },
      });
    }

    try {
      // POST /buah — tambah buah baru
      if (url.pathname === "/buah" && req.method === "POST") {
        const body = (await req.json()) as BuahInput;
        const err = validate(body);
        if (err) return cors(Response.json({ error: err }, { status: 400 }));

        const result = await getGrade(body);
        const data = await readDB();
        const newBuah: Buah = { id: Date.now(), ...body, grade: result.grade };
        data.push(newBuah);
        await writeDB(data);
        return cors(Response.json({ ...newBuah, detail: result }));
      }

      // GET /buah — ambil semua data
      if (url.pathname === "/buah" && req.method === "GET") {
        const data = await readDB();
        return cors(Response.json(data));
      }

      // DELETE /buah/:id
      if (url.pathname.startsWith("/buah/") && req.method === "DELETE") {
        const id = Number(url.pathname.split("/")[2]);
        const data = await readDB();
        const filtered = data.filter((b) => b.id !== id);
        if (filtered.length === data.length)
          return cors(Response.json({ error: "Data tidak ditemukan" }, { status: 404 }));
        await writeDB(filtered);
        return cors(Response.json({ success: true }));
      }

      // Static files
      if (url.pathname === "/")
        return cors(new Response(Bun.file(join(import.meta.dir, "../frontend/index.html"))));
      if (url.pathname === "/style.css")
        return cors(new Response(Bun.file(join(import.meta.dir, "../frontend/style.css")), { headers: { "Content-Type": "text/css" } }));
      if (url.pathname === "/script.js")
        return cors(new Response(Bun.file(join(import.meta.dir, "../frontend/script.js"))));

      return cors(new Response("Not Found", { status: 404 }));
    } catch (err: any) {
      return cors(Response.json({ error: err.message }, { status: 500 }));
    }
  },
});

console.log("🚀 Server jalan di http://localhost:3000");