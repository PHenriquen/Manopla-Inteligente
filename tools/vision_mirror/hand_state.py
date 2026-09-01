"""Pure hand-state estimation used by the camera mirror mode.

This module deliberately has no OpenCV or MediaPipe dependency. Keeping the
geometry and temporal filtering separate makes it possible to test the control
contract without a camera or physical hardware.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import math
from typing import Iterable, Sequence


FINGER_NAMES = ("thumb", "index", "middle", "ring", "pinky")


@dataclass(frozen=True)
class Point3D:
    x: float
    y: float
    z: float = 0.0


@dataclass(frozen=True)
class FingerState:
    thumb: bool
    index: bool
    middle: bool
    ring: bool
    pinky: bool

    @property
    def mask(self) -> int:
        values = (self.thumb, self.index, self.middle, self.ring, self.pinky)
        return sum((1 << bit) for bit, extended in enumerate(values) if extended)

    @classmethod
    def from_mask(cls, mask: int) -> "FingerState":
        return cls(*(bool(mask & (1 << bit)) for bit in range(5)))


@dataclass(frozen=True)
class HandControlFrame:
    source: str
    sequence: int
    timestamp_ms: int
    handedness: str
    fingers: FingerState
    finger_mask: int
    roll_deg: float
    gesture: str
    confidence: float

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["schema"] = "gauntlet.control.v1"
        return payload

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"), sort_keys=True)


def _distance(a: Point3D, b: Point3D) -> float:
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)


def _joint_angle(a: Point3D, vertex: Point3D, c: Point3D) -> float:
    first = (a.x - vertex.x, a.y - vertex.y, a.z - vertex.z)
    second = (c.x - vertex.x, c.y - vertex.y, c.z - vertex.z)
    first_length = math.sqrt(sum(value * value for value in first))
    second_length = math.sqrt(sum(value * value for value in second))
    if first_length == 0.0 or second_length == 0.0:
        return 0.0
    cosine = sum(left * right for left, right in zip(first, second)) / (
        first_length * second_length
    )
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


def _normalize_roll(angle: float) -> float:
    while angle > 90.0:
        angle -= 180.0
    while angle < -90.0:
        angle += 180.0
    return angle


def classify_fingers(
    landmarks: Sequence[Point3D], extension_threshold_deg: float = 150.0
) -> FingerState:
    """Convert the 21 MediaPipe landmarks into five extended/closed states."""
    if len(landmarks) < 21:
        raise ValueError("expected 21 hand landmarks")

    wrist = landmarks[0]
    palm_width = max(_distance(landmarks[5], landmarks[17]), 1e-6)

    thumb_angle = _joint_angle(landmarks[1], landmarks[2], landmarks[4])
    thumb_separation = _distance(landmarks[4], landmarks[5]) / palm_width
    thumb_extended = thumb_angle >= 140.0 and thumb_separation >= 0.45

    states: list[bool] = [thumb_extended]
    for mcp, pip, tip in ((5, 6, 8), (9, 10, 12), (13, 14, 16), (17, 18, 20)):
        angle = _joint_angle(landmarks[mcp], landmarks[pip], landmarks[tip])
        reaches_beyond_joint = _distance(landmarks[tip], wrist) > (
            _distance(landmarks[pip], wrist) * 1.02
        )
        states.append(angle >= extension_threshold_deg and reaches_beyond_joint)

    return FingerState(*states)


def calculate_roll(landmarks: Sequence[Point3D]) -> float:
    if len(landmarks) < 18:
        raise ValueError("expected at least 18 hand landmarks")
    index_mcp = landmarks[5]
    pinky_mcp = landmarks[17]
    angle = math.degrees(
        math.atan2(pinky_mcp.y - index_mcp.y, pinky_mcp.x - index_mcp.x)
    )
    return _normalize_roll(angle)


def classify_gesture(fingers: FingerState, landmarks: Sequence[Point3D]) -> str:
    if fingers.mask == 0b11111:
        return "open_hand"
    if fingers.mask == 0:
        return "fist"
    if fingers.mask == 0b00010:
        return "point"

    palm_width = max(_distance(landmarks[5], landmarks[17]), 1e-6)
    pinch_distance = _distance(landmarks[4], landmarks[8]) / palm_width
    if pinch_distance < 0.32:
        return "pinch"
    return "custom"


class HandStateEstimator:
    """Adds dwell-time hysteresis and roll smoothing to raw hand geometry."""

    def __init__(self, change_frames: int = 3, roll_alpha: float = 0.25) -> None:
        if change_frames < 1:
            raise ValueError("change_frames must be at least 1")
        if not 0.0 < roll_alpha <= 1.0:
            raise ValueError("roll_alpha must be in (0, 1]")
        self.change_frames = change_frames
        self.roll_alpha = roll_alpha
        self._stable_mask: int | None = None
        self._candidate_mask: int | None = None
        self._candidate_count = 0
        self._smoothed_roll: float | None = None
        self._sequence = 0

    def update(
        self,
        landmarks: Iterable[Point3D],
        *,
        handedness: str,
        confidence: float,
        timestamp_ms: int,
    ) -> HandControlFrame:
        points = tuple(landmarks)
        raw_fingers = classify_fingers(points)

        if self._stable_mask is None:
            self._stable_mask = raw_fingers.mask
        elif raw_fingers.mask == self._stable_mask:
            self._candidate_mask = None
            self._candidate_count = 0
        elif raw_fingers.mask == self._candidate_mask:
            self._candidate_count += 1
            if self._candidate_count >= self.change_frames:
                self._stable_mask = raw_fingers.mask
                self._candidate_mask = None
                self._candidate_count = 0
        else:
            self._candidate_mask = raw_fingers.mask
            self._candidate_count = 1

        raw_roll = calculate_roll(points)
        if self._smoothed_roll is None:
            self._smoothed_roll = raw_roll
        else:
            self._smoothed_roll += self.roll_alpha * (raw_roll - self._smoothed_roll)

        fingers = FingerState.from_mask(self._stable_mask)
        frame = HandControlFrame(
            source="vision",
            sequence=self._sequence,
            timestamp_ms=timestamp_ms,
            handedness=handedness,
            fingers=fingers,
            finger_mask=fingers.mask,
            roll_deg=round(self._smoothed_roll, 2),
            gesture=classify_gesture(fingers, points),
            confidence=round(max(0.0, min(1.0, confidence)), 3),
        )
        self._sequence = (self._sequence + 1) & 0xFFFF
        return frame
