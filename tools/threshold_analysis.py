import csv
import numpy as np
import os
import statistics
import json

LOG_CSV_PATH = './logs/face_match_log.csv'

def analyze_log(csv_path=LOG_CSV_PATH):
    rows = []
    if not os.path.exists(csv_path):
        print("No log file at", csv_path)
        return
    with open(csv_path, 'r') as fh:
        reader = csv.DictReader(fh)
        for r in reader:
            try:
                rows.append({
                    'best_d': float(r.get('best_d') or 1.0),
                    'accepted': r.get('accepted') in ('True','true','1', '1.0'),
                    'margin': float(r.get('margin') or 0.0),
                    'per_face_min': float(r.get('per_face_min') or 1.0),
                    'true_label': r.get('true_label')
                })
            except Exception:
                continue
    if not rows:
        print("no rows")
        return
    best_d_true = [r['best_d'] for r in rows if r['accepted']]
    best_d_all = [r['best_d'] for r in rows]
    margins_false_accept = [r['margin'] for r in rows if not r['accepted']]

    print("entries:", len(rows))
    print("best_d mean", np.mean(best_d_all), "std", np.std(best_d_all))
    print("accepted mean best_d", np.mean(best_d_true) if best_d_true else "none")
    # simple heuristic suggestions:
    suggested_user_tol = min(0.55, np.percentile(best_d_all, 90))
    suggested_margin = max(0.05, np.percentile([r['margin'] for r in rows], 75))
    suggested_face_tol = min(0.65, np.percentile([r['per_face_min'] for r in rows], 90))
    print("suggested_user_tol:", round(suggested_user_tol,3))
    print("suggested_user_margin:", round(suggested_margin,3))
    print("suggested_face_tol:", round(suggested_face_tol,3))


if __name__ == '__main__':
    analyze_log()
