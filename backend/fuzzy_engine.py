import sys
import json
import numpy as np

def trimf(x, a, b, c, d):
    """Fungsi trapesium: a,b = naik; c,d = turun"""
    if x <= a or x >= d:
        return 0.0
    elif b <= x <= c:
        return 1.0
    elif a < x < b:
        return (x - a) / (b - a)
    elif c < x < d:
        return (d - x) / (d - c)
    return 0.0

def calculate_grade(umur_val, rasa_val, kematangan_val):
    # ── FUZZIFIKASI ──
    # Umur: Baru[0,0,2,3], Sedang[2,3,3,5], Lama[4,5,7,7]
    mu_baru   = trimf(umur_val, 0, 0, 2, 3)
    mu_sedang = trimf(umur_val, 2, 3, 3, 5)
    mu_lama   = trimf(umur_val, 4, 5, 7, 7)

    # Rasa: Tawar[0,0,2,4], Manis[3,5,5,7], Asam[6,8,10,10]
    mu_tawar = trimf(rasa_val, 0, 0, 2, 4)
    mu_manis = trimf(rasa_val, 3, 5, 5, 7)
    mu_asam  = trimf(rasa_val, 6, 8, 10, 10)

    # Kematangan: Belum[0,0,20,35], Cukup[30,50,50,80], Matang[75,90,100,100]
    mu_belum  = trimf(kematangan_val, 0, 0, 20, 35)
    mu_cukup  = trimf(kematangan_val, 30, 50, 50, 80)
    mu_matang = trimf(kematangan_val, 75, 90, 100, 100)

    # ── STEP 1: Umur × Rasa → Grade Sementara (MIN) ──
    rules_s1 = {
        'A': [
            min(mu_baru,   mu_tawar),  # R1
            min(mu_baru,   mu_manis),  # R2
            min(mu_sedang, mu_manis),  # R5
        ],
        'B': [
            min(mu_baru,   mu_asam),   # R3
            min(mu_sedang, mu_tawar),  # R4
            min(mu_lama,   mu_manis),  # R8
        ],
        'C': [
            min(mu_sedang, mu_asam),   # R6
            min(mu_lama,   mu_tawar),  # R7
            min(mu_lama,   mu_asam),   # R9
        ],
    }

    # Agregasi Step 1 — MAX per grade
    alpha_A = max(rules_s1['A'])
    alpha_B = max(rules_s1['B'])
    alpha_C = max(rules_s1['C'])

    # ── STEP 2: Grade Sementara × Kematangan → Grade Final (MIN) ──
    rules_s2 = {
        'A': [
            min(alpha_A, mu_cukup),   # R2: GradeA & Cukup → A
            min(alpha_A, mu_matang),  # R3: GradeA & Matang → A
            min(alpha_B, mu_matang),  # R6: GradeB & Matang → A
        ],
        'B': [
            min(alpha_A, mu_belum),   # R1: GradeA & Belum → B
            min(alpha_B, mu_cukup),   # R5: GradeB & Cukup → B
            min(alpha_C, mu_matang),  # R9: GradeC & Matang → B
        ],
        'C': [
            min(alpha_B, mu_belum),   # R4: GradeB & Belum → C
            min(alpha_C, mu_belum),   # R7: GradeC & Belum → C
            min(alpha_C, mu_cukup),   # R8: GradeC & Cukup → C
        ],
    }

    # Agregasi Step 2 — MAX per grade
    final_A = max(rules_s2['A'])
    final_B = max(rules_s2['B'])
    final_C = max(rules_s2['C'])

    # Tentukan Grade Final
    scores = {'A': final_A, 'B': final_B, 'C': final_C}
    grade  = max(scores, key=scores.get)

    return {
        "grade": grade,
        "alpha": {"A": round(final_A, 4), "B": round(final_B, 4), "C": round(final_C, 4)},
        "mu": {
            "umur":       {"baru": round(mu_baru,4), "sedang": round(mu_sedang,4), "lama": round(mu_lama,4)},
            "rasa":       {"tawar": round(mu_tawar,4), "manis": round(mu_manis,4), "asam": round(mu_asam,4)},
            "kematangan": {"belum": round(mu_belum,4), "cukup": round(mu_cukup,4), "matang": round(mu_matang,4)},
        },
        "grade_sementara": max(scores, key=lambda g: {'A':alpha_A,'B':alpha_B,'C':alpha_C}[g])
    }

if __name__ == "__main__":
    args = json.loads(sys.argv[1])
    result = calculate_grade(args['umur'], args['rasa'], args['kematangan'])
    print(json.dumps(result))