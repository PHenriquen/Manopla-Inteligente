# Low-Level and Embedded Engineering

The Manopla Inteligente is the portfolio project responsible for the lowest software layer: firmware, embedded constraints, protocols, real-time scheduling and the physical interface between code and hardware.

## Memory-conscious firmware

`firmware/core/ring_buffer.h` implements a fixed-capacity generic ring buffer with no heap allocation. This is useful for sensor/telemetry paths where predictable memory use matters more than dynamic convenience.

Concepts demonstrated:

- static memory allocation;
- bounded buffers;
- deterministic push/pop operations;
- overflow handling;
- embedded-friendly templates.

## Binary protocol

`firmware/core/packet_protocol.h` defines a compact binary packet format for telemetry and commands.

It includes:

- fixed-width integer types;
- explicit packed memory layout;
- protocol versioning;
- sequence numbers;
- payload sizing;
- CRC-16/CCITT integrity verification;
- `static_assert` checks for binary compatibility.

The same protocol can later be decoded by the web gateway, SincroHub or another desktop tool.

## FreeRTOS experiment

`firmware/advanced/gauntlet_realtime.ino` is a separate ESP32 experiment that uses the RTOS already present in the ESP32 Arduino environment.

It separates work into two tasks:

```text
sensor task (100 Hz) -> bounded buffer -> telemetry task (20 Hz) -> binary serial packet
```

The experiment introduces:

- pinned FreeRTOS tasks;
- deterministic periodic scheduling with `vTaskDelayUntil`;
- critical sections;
- different task priorities;
- binary serial output;
- separation between acquisition and transport.

It is intentionally separate from the simpler demonstration sketches so the project retains an approachable first version while still exposing more advanced embedded engineering.

## Next low-level steps

Useful future extensions, only when physical hardware is available:

1. IMU over I2C/SPI rather than simulated/placeholder acceleration;
2. interrupt-driven buttons/touch sensors;
3. DMA-capable acquisition where appropriate;
4. watchdog and brownout recovery;
5. persistent calibration in NVS;
6. BLE/Wi-Fi transport using the same packet contract;
7. power profiling and sleep modes;
8. hardware-in-the-loop tests.

## Portfolio coverage

This layer demonstrates knowledge below normal application development:

- C/C++-style memory/layout thinking;
- firmware architecture;
- RTOS scheduling;
- serial/binary protocols;
- integrity checking;
- hardware/software integration.
