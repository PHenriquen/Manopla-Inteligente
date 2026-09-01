"""Webcam input for the Gauntlet mirror/teleoperation experiment."""

from __future__ import annotations

import argparse
import json
import socket
import sys
import time
from typing import Any

from hand_state import HandControlFrame, HandStateEstimator, Point3D


class EventPublisher:
    def __init__(self, udp_host: str | None, udp_port: int) -> None:
        self.destination = (udp_host, udp_port) if udp_host else None
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) if udp_host else None

    def publish(self, frame: HandControlFrame) -> None:
        encoded = frame.to_json()
        print(encoded, flush=True)
        if self.socket and self.destination:
            self.socket.sendto(encoded.encode("utf-8"), self.destination)

    def close(self) -> None:
        if self.socket:
            self.socket.close()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Track one hand and publish gauntlet.control.v1 frames."
    )
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    parser.add_argument("--headless", action="store_true", help="Do not open a preview window")
    parser.add_argument("--emit-hz", type=float, default=15.0, help="Maximum output frequency")
    parser.add_argument("--udp-host", help="Also send JSON frames to this host")
    parser.add_argument("--udp-port", type=int, default=8765, help="UDP destination port")
    parser.add_argument("--detection-confidence", type=float, default=0.65)
    parser.add_argument("--tracking-confidence", type=float, default=0.65)
    return parser.parse_args()


def _load_runtime() -> tuple[Any, Any]:
    try:
        import cv2
        import mediapipe as mp
    except ImportError as error:
        raise SystemExit(
            "Dependencias ausentes. Execute: pip install -r "
            "tools/vision_mirror/requirements.txt"
        ) from error
    return cv2, mp


def main() -> int:
    args = _parse_args()
    if args.emit_hz <= 0:
        raise SystemExit("--emit-hz precisa ser maior que zero")

    cv2, mp = _load_runtime()
    camera = cv2.VideoCapture(args.camera)
    if not camera.isOpened():
        raise SystemExit(f"Nao foi possivel abrir a camera {args.camera}")

    publisher = EventPublisher(args.udp_host, args.udp_port)
    estimator = HandStateEstimator(change_frames=3, roll_alpha=0.25)
    hands_api = mp.solutions.hands
    drawing = mp.solutions.drawing_utils
    emit_period = 1.0 / args.emit_hz
    last_emit = 0.0

    try:
        with hands_api.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=args.detection_confidence,
            min_tracking_confidence=args.tracking_confidence,
        ) as tracker:
            while camera.isOpened():
                ok, image = camera.read()
                if not ok:
                    break

                image = cv2.flip(image, 1)
                rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False
                result = tracker.process(rgb)

                if result.multi_hand_landmarks:
                    hand = result.multi_hand_landmarks[0]
                    handedness = "Unknown"
                    confidence = 0.0
                    if result.multi_handedness:
                        classification = result.multi_handedness[0].classification[0]
                        handedness = classification.label
                        confidence = classification.score

                    points = [Point3D(point.x, point.y, point.z) for point in hand.landmark]
                    now = time.monotonic()
                    frame = estimator.update(
                        points,
                        handedness=handedness,
                        confidence=confidence,
                        timestamp_ms=time.time_ns() // 1_000_000,
                    )
                    if now - last_emit >= emit_period:
                        publisher.publish(frame)
                        last_emit = now

                    if not args.headless:
                        drawing.draw_landmarks(image, hand, hands_api.HAND_CONNECTIONS)
                        label = (
                            f"{frame.gesture} | mask {frame.finger_mask:05b} | "
                            f"roll {frame.roll_deg:+.1f}"
                        )
                        cv2.putText(
                            image,
                            label,
                            (18, 36),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7,
                            (80, 255, 180),
                            2,
                            cv2.LINE_AA,
                        )

                if not args.headless:
                    cv2.imshow("Gauntlet Vision Mirror", image)
                    if cv2.waitKey(1) & 0xFF in (27, ord("q")):
                        break
    except KeyboardInterrupt:
        pass
    finally:
        publisher.close()
        camera.release()
        if not args.headless:
            cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    sys.exit(main())
