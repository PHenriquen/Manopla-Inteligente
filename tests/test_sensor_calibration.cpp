#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "../firmware/core/sensor_calibration.h"

namespace {

void fill(gauntlet::RunningStats& stats, int center, int wobble, int count) {
  for (int i = 0; i < count; ++i) {
    const int offset = (i % 5) - 2;
    stats.push(static_cast<uint16_t>(center + offset * wobble));
  }
}

void test_forward_sensor() {
  gauntlet::RunningStats rest;
  gauntlet::RunningStats bent;
  fill(rest, 900, 2, 100);
  fill(bent, 2600, 3, 100);

  const auto profile = gauntlet::build_flex_profile(rest, bent);
  assert(profile.valid);
  assert(profile.normalize(900) < 0.02f);
  assert(profile.normalize(2600) > 0.98f);
  assert(profile.normalize(1750) > 0.45f);
  assert(profile.normalize(1750) < 0.55f);
}

void test_reverse_sensor() {
  gauntlet::RunningStats rest;
  gauntlet::RunningStats bent;
  fill(rest, 3000, 2, 100);
  fill(bent, 1200, 2, 100);

  const auto profile = gauntlet::build_flex_profile(rest, bent);
  assert(profile.valid);
  assert(profile.normalize(3000) < 0.02f);
  assert(profile.normalize(1200) > 0.98f);
}

void test_rejects_tiny_span() {
  gauntlet::RunningStats rest;
  gauntlet::RunningStats bent;
  fill(rest, 1500, 2, 100);
  fill(bent, 1580, 2, 100);

  const auto profile = gauntlet::build_flex_profile(rest, bent);
  assert(!profile.valid);
}

void test_rejects_noisy_signal() {
  gauntlet::RunningStats rest;
  gauntlet::RunningStats bent;
  fill(rest, 1000, 90, 100);
  fill(bent, 1400, 90, 100);

  const auto profile = gauntlet::build_flex_profile(rest, bent, 50, 180.0f, 6.0f);
  assert(!profile.valid);
}

void test_low_pass_filter() {
  gauntlet::LowPassFilter filter(0.5f);
  assert(fabsf(filter.push(100.0f) - 100.0f) < 0.001f);
  assert(fabsf(filter.push(200.0f) - 150.0f) < 0.001f);
  assert(fabsf(filter.push(200.0f) - 175.0f) < 0.001f);
}

}  // namespace

int main() {
  test_forward_sensor();
  test_reverse_sensor();
  test_rejects_tiny_span();
  test_rejects_noisy_signal();
  test_low_pass_filter();
  puts("sensor_calibration: all tests passed");
  return 0;
}
