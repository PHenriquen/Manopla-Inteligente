import json
import pathlib
import sys
import unittest


MODULE_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_DIR))

from hand_state import (  # noqa: E402
    FingerState,
    HandStateEstimator,
    Point3D,
    calculate_roll,
    classify_fingers,
)


def open_hand() -> list[Point3D]:
    points = [Point3D(0.0, 0.0) for _ in range(21)]
    points[0] = Point3D(0.0, 1.0)
    points[1] = Point3D(-0.55, 0.35)
    points[2] = Point3D(-0.75, 0.15)
    points[3] = Point3D(-0.95, -0.05)
    points[4] = Point3D(-1.15, -0.25)
    for x, ids in zip(
        (-0.6, -0.2, 0.2, 0.6),
        ((5, 6, 7, 8), (9, 10, 11, 12), (13, 14, 15, 16), (17, 18, 19, 20)),
    ):
        for y, landmark_id in zip((0.25, -0.1, -0.45, -0.8), ids):
            points[landmark_id] = Point3D(x, y)
    return points


def closed_hand() -> list[Point3D]:
    points = open_hand()
    points[4] = Point3D(-0.45, 0.2)
    for mcp, pip, dip, tip in ((5, 6, 7, 8), (9, 10, 11, 12), (13, 14, 15, 16), (17, 18, 19, 20)):
        base = points[mcp]
        points[pip] = Point3D(base.x, 0.0)
        points[dip] = Point3D(base.x + 0.18, 0.12)
        points[tip] = Point3D(base.x + 0.3, 0.25)
    return points


class HandStateTests(unittest.TestCase):
    def test_open_hand_sets_all_bits(self) -> None:
        state = classify_fingers(open_hand())
        self.assertEqual(state, FingerState(True, True, True, True, True))
        self.assertEqual(state.mask, 0b11111)

    def test_closed_hand_clears_all_bits(self) -> None:
        self.assertEqual(classify_fingers(closed_hand()).mask, 0)

    def test_roll_uses_knuckle_axis(self) -> None:
        points = open_hand()
        self.assertAlmostEqual(calculate_roll(points), 0.0)
        points[17] = Point3D(0.6, 0.85)
        self.assertGreater(calculate_roll(points), 20.0)

    def test_state_change_requires_consecutive_frames(self) -> None:
        estimator = HandStateEstimator(change_frames=3, roll_alpha=1.0)
        first = estimator.update(open_hand(), handedness="Right", confidence=0.9, timestamp_ms=1)
        self.assertEqual(first.finger_mask, 0b11111)

        for timestamp in (2, 3):
            frame = estimator.update(
                closed_hand(), handedness="Right", confidence=0.9, timestamp_ms=timestamp
            )
            self.assertEqual(frame.finger_mask, 0b11111)

        changed = estimator.update(
            closed_hand(), handedness="Right", confidence=0.9, timestamp_ms=4
        )
        self.assertEqual(changed.finger_mask, 0)
        self.assertEqual(changed.gesture, "fist")

    def test_frame_json_has_versioned_contract(self) -> None:
        frame = HandStateEstimator(change_frames=1).update(
            open_hand(), handedness="Left", confidence=1.2, timestamp_ms=25
        )
        payload = json.loads(frame.to_json())
        self.assertEqual(payload["schema"], "gauntlet.control.v1")
        self.assertEqual(payload["source"], "vision")
        self.assertEqual(payload["confidence"], 1.0)
        self.assertEqual(payload["finger_mask"], 31)


if __name__ == "__main__":
    unittest.main()
