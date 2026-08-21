#include <Arduino.h>
#include "../core/sensor_calibration.h"

namespace {

constexpr uint8_t kFlexPin = 34;
constexpr uint32_t kSamplePeriodMs = 10;  // 100 Hz
constexpr uint32_t kWindowSamples = 300;  // 3 seconds per posture

gauntlet::RunningStats g_rest;
gauntlet::RunningStats g_bent;

enum class Phase : uint8_t {
  Rest,
  Bent,
  Done,
};

Phase g_phase = Phase::Rest;
uint32_t g_lastSampleMs = 0;

void print_stats(const char* label, const gauntlet::RunningStats& stats) {
  Serial.printf(
      "%s count=%lu mean=%.1f stddev=%.2f min=%u max=%u p2p=%u\n",
      label,
      static_cast<unsigned long>(stats.count()),
      stats.mean(),
      stats.stddev(),
      stats.min(),
      stats.max(),
      stats.peak_to_peak());
}

void finish_phase() {
  if (g_phase == Phase::Rest) {
    print_stats("REST", g_rest);
    Serial.println("Agora dobre o sensor para a postura-alvo e mantenha por 3 segundos.");
    delay(1500);
    g_phase = Phase::Bent;
    g_lastSampleMs = millis();
    return;
  }

  if (g_phase == Phase::Bent) {
    print_stats("BENT", g_bent);
    const auto profile = gauntlet::build_flex_profile(g_rest, g_bent);

    Serial.printf(
        "PROFILE rest=%.1f bent=%.1f span=%.1f snr=%.2f valid=%s\n",
        profile.rest_center,
        profile.bent_center,
        profile.span,
        profile.signal_to_noise(),
        profile.valid ? "yes" : "no");

    if (!profile.valid) {
      Serial.println(
          "Calibracao insuficiente: confira encaixe, ruido, alimentacao e se as duas posturas realmente se separam.");
    } else {
      Serial.println(
          "Calibracao utilizavel para o primeiro teste. Ainda valide repetibilidade antes de criar gestos.");
    }

    g_phase = Phase::Done;
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  delay(1000);
  Serial.println("Manopla / flex calibration probe");
  Serial.println("Mantenha a mao em repouso por 3 segundos.");
}

void loop() {
  if (g_phase == Phase::Done) {
    delay(1000);
    return;
  }

  const uint32_t now = millis();
  if (now - g_lastSampleMs < kSamplePeriodMs) return;
  g_lastSampleMs = now;

  const uint16_t raw = static_cast<uint16_t>(analogRead(kFlexPin));
  auto& stats = g_phase == Phase::Rest ? g_rest : g_bent;
  stats.push(raw);

  if (stats.count() >= kWindowSamples) finish_phase();
}
