import unittest
import numpy as np
import os, json, tempfile
from backend.utils.face_utils import decide_match, normalize_vec

def mk_profile(avg, faces):
    return {'avg': normalize_vec(np.array(avg, dtype=np.float32)), 'faces': [normalize_vec(np.array(f, dtype=np.float32)) for f in faces]}

class TestMatching(unittest.TestCase):
    def test_positive_match(self):
        # user A centroid near query
        profiles = { 'A': mk_profile([0.5,0.1,0.2,0], [[0.5,0.1,0.2,0],[0.49,0.11,0.19,0]]) , 'B': mk_profile([-0.3,0.2,0.4,0], [[-0.3,0.2,0.4,0]])}
        q = [0.49,0.09,0.21,0]
        accepted, debug = decide_match(q, profiles, USER_TOL=0.6, USER_MARGIN=0.05, FACE_TOL=0.6)
        self.assertTrue(accepted)
        self.assertEqual(debug['best_uid'], 'A')

    def test_reject_ambiguous(self):
        # two users equivocal -> margin small -> reject
        profiles = { 'A': mk_profile([0.5,0.1,0.2,0], [[0.5,0.1,0.2,0]]), 'B': mk_profile([0.51,0.11,0.19,0], [[0.51,0.11,0.19,0]])}
        q = [0.505,0.105,0.195,0]
        accepted, debug = decide_match(q, profiles, USER_TOL=0.6, USER_MARGIN=0.02, FACE_TOL=0.6)
        # margin is small -> should be false if margin < required (we require margin >=0.02)
        self.assertFalse(accepted)

if __name__ == '__main__':
    unittest.main()
