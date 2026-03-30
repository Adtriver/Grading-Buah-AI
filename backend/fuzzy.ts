type GradeKey = "A" | "B" | "C";

function trimf(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}

export function calculateGrade(umur: number, rasa: number, kematangan: number) {
  // ── Fuzzifikasi ──
  const mu = {
    umur: {
      baru:   trimf(umur, 0, 0, 2, 3),
      sedang: trimf(umur, 2, 3, 3, 5),
      lama:   trimf(umur, 4, 5, 7, 7),
    },
    rasa: {
      tawar: trimf(rasa, 0, 0, 2, 4),
      manis: trimf(rasa, 3, 5, 5, 7),
      asam:  trimf(rasa, 6, 8, 10, 10),
    },
    kematangan: {
      belum:  trimf(kematangan, 0, 0, 20, 35),
      cukup:  trimf(kematangan, 30, 50, 50, 80),
      matang: trimf(kematangan, 75, 90, 100, 100),
    },
  };

  // ── Step 1: Umur × Rasa → Grade Sementara ──
  const s1: Record<GradeKey, number[]> = {
    A: [
      Math.min(mu.umur.baru,   mu.rasa.tawar),  // R1
      Math.min(mu.umur.baru,   mu.rasa.manis),  // R2
      Math.min(mu.umur.sedang, mu.rasa.manis),  // R5
    ],
    B: [
      Math.min(mu.umur.baru,   mu.rasa.asam),   // R3
      Math.min(mu.umur.sedang, mu.rasa.tawar),  // R4
      Math.min(mu.umur.lama,   mu.rasa.manis),  // R8
    ],
    C: [
      Math.min(mu.umur.sedang, mu.rasa.asam),   // R6
      Math.min(mu.umur.lama,   mu.rasa.tawar),  // R7
      Math.min(mu.umur.lama,   mu.rasa.asam),   // R9
    ],
  };

  const alpha = {
    A: Math.max(...s1.A),
    B: Math.max(...s1.B),
    C: Math.max(...s1.C),
  };

  const gradeSementara = (Object.keys(alpha) as GradeKey[]).reduce((a, b) =>
    alpha[a] >= alpha[b] ? a : b
  );

  // ── Step 2: Grade Sementara × Kematangan → Grade Final ──
  const s2: Record<GradeKey, number[]> = {
    A: [
      Math.min(alpha.A, mu.kematangan.cukup),   // R2
      Math.min(alpha.A, mu.kematangan.matang),  // R3
      Math.min(alpha.B, mu.kematangan.matang),  // R6
    ],
    B: [
      Math.min(alpha.A, mu.kematangan.belum),   // R1
      Math.min(alpha.B, mu.kematangan.cukup),   // R5
      Math.min(alpha.C, mu.kematangan.matang),  // R9
    ],
    C: [
      Math.min(alpha.B, mu.kematangan.belum),   // R4
      Math.min(alpha.C, mu.kematangan.belum),   // R7
      Math.min(alpha.C, mu.kematangan.cukup),   // R8
    ],
  };

  const final = {
    A: Math.max(...s2.A),
    B: Math.max(...s2.B),
    C: Math.max(...s2.C),
  };

  const grade = (Object.keys(final) as GradeKey[]).reduce((a, b) =>
    final[a] >= final[b] ? a : b
  );

  return {
    grade,
    alpha: {
      A: +final.A.toFixed(4),
      B: +final.B.toFixed(4),
      C: +final.C.toFixed(4),
    },
    mu: {
      umur: {
        baru:   +mu.umur.baru.toFixed(4),
        sedang: +mu.umur.sedang.toFixed(4),
        lama:   +mu.umur.lama.toFixed(4),
      },
      rasa: {
        tawar: +mu.rasa.tawar.toFixed(4),
        manis: +mu.rasa.manis.toFixed(4),
        asam:  +mu.rasa.asam.toFixed(4),
      },
      kematangan: {
        belum:  +mu.kematangan.belum.toFixed(4),
        cukup:  +mu.kematangan.cukup.toFixed(4),
        matang: +mu.kematangan.matang.toFixed(4),
      },
    },
    grade_sementara: gradeSementara,
  };
}