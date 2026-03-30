const DESC = {
  A: "Kualitas TINGGI — Layak jual premium ✅",
  B: "Kualitas SEDANG — Layak jual biasa 🟡",
  C: "Kualitas RENDAH — Tidak layak jual ❌",
};

async function gradekan() {
  const nama       = document.getElementById("nama").value.trim();
  const umur       = parseFloat(document.getElementById("umur").value);
  const rasa       = parseFloat(document.getElementById("rasa").value);
  const kematangan = parseFloat(document.getElementById("kematangan").value);

  if (!nama || isNaN(umur) || isNaN(rasa) || isNaN(kematangan)) {
    alert("Lengkapi semua field dulu!");
    return;
  }

  const btn = document.querySelector("button");
  btn.textContent = "⏳ Memproses...";
  btn.disabled = true;

  try {
    const res = await fetch("/buah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, umur, rasa, kematangan }),
    });

    const data = await res.json();
    if (data.error) { alert("Error: " + data.error); return; }

    tampilkanHasil(data);
  } catch (e) {
    alert("Gagal konek ke server!");
  } finally {
    btn.textContent = "🔍 Cek Grade";
    btn.disabled = false;
  }
}

function tampilkanHasil(data) {
  const { grade, detail } = data;
  const { mu, alpha, grade_sementara } = detail;

  // Badge
  const badge = document.getElementById("grade-badge");
  badge.textContent = grade;
  badge.className = "grade-badge grade-" + grade;

  // Info
  document.getElementById("result-nama").textContent = data.nama;
  document.getElementById("result-desc").textContent = DESC[grade];

  // μ Umur
  document.getElementById("mu-baru").textContent   = mu.umur.baru;
  document.getElementById("mu-sedang").textContent = mu.umur.sedang;
  document.getElementById("mu-lama").textContent   = mu.umur.lama;

  // μ Rasa
  document.getElementById("mu-tawar").textContent = mu.rasa.tawar;
  document.getElementById("mu-manis").textContent = mu.rasa.manis;
  document.getElementById("mu-asam").textContent  = mu.rasa.asam;

  // μ Kematangan
  document.getElementById("mu-belum").textContent  = mu.kematangan.belum;
  document.getElementById("mu-cukup").textContent  = mu.kematangan.cukup;
  document.getElementById("mu-matang").textContent = mu.kematangan.matang;

  // Alpha
  document.getElementById("alpha-a").textContent = alpha.A;
  document.getElementById("alpha-b").textContent = alpha.B;
  document.getElementById("alpha-c").textContent = alpha.C;
  document.getElementById("grade-sementara").textContent = grade_sementara;

  document.getElementById("result-card").style.display = "block";
  document.getElementById("result-card").scrollIntoView({ behavior: "smooth" });
}