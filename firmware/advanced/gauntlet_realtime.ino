#include <Arduino.h>
#include "../core/packet_protocol.h"
#include "../core/ring_buffer.h"

using gauntlet::PacketType;
using gauntlet::TelemetryPayload;

namespace {

constexpr uint8_t kFlexPin = 34;
constexpr uint8_t kBatteryPin = 35;
constexpr TickType_t kSensorPeriod = pdMS_TO_TICKS(10);     // 100 Hz
constexpr TickType_t kTelemetryPeriod = pdMS_TO_TICKS(50); // 20 Hz

struct SensorSample {
  uint32_t timestamp_ms;
  uint16_t flex_raw;
  uint16_t battery_raw;
};

gauntlet::RingBuffer<SensorSample, 128> g_samples;
portMUX_TYPE g_bufferMux = portMUX_INITIALIZER_UNLOCKED;
uint16_t g_sequence = 0;

void sensorTask(void*) {
  TickType_t nextWake = xTaskGetTickCount();

  while (true) {
    SensorSample sample{
      .timestamp_ms = millis(),
      .flex_raw = static_cast<uint16_t>(analogRead(kFlexPin)),
      .battery_raw = static_cast<uint16_t>(analogRead(kBatteryPin)),
    };

    portENTER_CRITICAL(&g_bufferMux);
    g_samples.push(sample);
    portEXIT_CRITICAL(&g_bufferMux);

    vTaskDelayUntil(&nextWake, kSensorPeriod);
  }
}

void telemetryTask(void*) {
  TickType_t nextWake = xTaskGetTickCount();

  while (true) {
    SensorSample latest{};
    bool found = false;

    portENTER_CRITICAL(&g_bufferMux);
    while (g_samples.pop(latest)) {
      found = true; // consume burst, keep most recent sample for this packet
    }
    portEXIT_CRITICAL(&g_bufferMux);

    if (found) {
      TelemetryPayload payload{
        .accel_x_mg = 0,
        .accel_y_mg = 0,
        .accel_z_mg = 0,
        .battery_mv = static_cast<uint16_t>((latest.battery_raw * 3300UL) / 4095UL),
        .flex_raw = latest.flex_raw,
        .gesture = 0,
      };

      const auto packet = gauntlet::make_packet(PacketType::Telemetry, g_sequence++, payload);
      Serial.write(reinterpret_cast<const uint8_t*>(&packet), sizeof(packet));
    }

    vTaskDelayUntil(&nextWake, kTelemetryPeriod);
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  xTaskCreatePinnedToCore(sensorTask, "sensor", 3072, nullptr, 2, nullptr, 1);
  xTaskCreatePinnedToCore(telemetryTask, "telemetry", 4096, nullptr, 1, nullptr, 0);
}

void loop() {
  // Work is scheduled by FreeRTOS tasks. Keep Arduino's loop idle.
  vTaskDelay(pdMS_TO_TICKS(1000));
}
