#pragma once

#include <math.h>
#include <stdint.h>

namespace gauntlet {

class RunningStats {
 public:
  void reset() {
    count_ = 0;
    mean_ = 0.0f;
    m2_ = 0.0f;
    min_ = 0;
    max_ = 0;
  }

  void push(uint16_t value) {
    if (count_ == 0) {
      min_ = value;
      max_ = value;
    } else {
      if (value < min_) min_ = value;
      if (value > max_) max_ = value;
    }

    ++count_;
    const float delta = static_cast<float>(value) - mean_;
    mean_ += delta / static_cast<float>(count_);
    const float delta2 = static_cast<float>(value) - mean_;
    m2_ += delta * delta2;
  }

  uint32_t count() const { return count_; }
  float mean() const { return mean_; }
  uint16_t min() const { return min_; }
  uint16_t max() const { return max_; }

  float variance() const {
    return count_ > 0 ? m2_ / static_cast<float>(count_) : 0.0f;
  }

  float stddev() const { return sqrtf(variance()); }

  uint16_t peak_to_peak() const {
    return count_ > 0 ? static_cast<uint16_t>(max_ - min_) : 0;
  }

 private:
  uint32_t count_ = 0;
  float mean_ = 0.0f;
  float m2_ = 0.0f;
  uint16_t min_ = 0;
  uint16_t max_ = 0;
};

struct FlexCalibrationProfile {
  float rest_center = 0.0f;
  float bent_center = 0.0f;
  float rest_noise = 0.0f;
  float bent_noise = 0.0f;
  float span = 0.0f;
  bool valid = false;

  float normalize(uint16_t raw) const {
    if (!valid || span <= 0.0f) return 0.0f;

    const float direction = bent_center >= rest_center ? 1.0f : -1.0f;
    const float progress =
        (static_cast<float>(raw) - rest_center) * direction / span;

    if (progress < 0.0f) return 0.0f;
    if (progress > 1.0f) return 1.0f;
    return progress;
  }

  float signal_to_noise() const {
    const float noise = rest_noise > bent_noise ? rest_noise : bent_noise;
    return noise > 0.0001f ? span / noise : span;
  }
};

inline FlexCalibrationProfile build_flex_profile(
    const RunningStats& rest,
    const RunningStats& bent,
    uint32_t minimum_samples = 50,
    float minimum_span = 180.0f,
    float minimum_signal_to_noise = 6.0f) {
  FlexCalibrationProfile profile{};
  profile.rest_center = rest.mean();
  profile.bent_center = bent.mean();
  profile.rest_noise = rest.stddev();
  profile.bent_noise = bent.stddev();
  profile.span = fabsf(profile.bent_center - profile.rest_center);

  const bool enough_samples =
      rest.count() >= minimum_samples && bent.count() >= minimum_samples;
  const bool enough_span = profile.span >= minimum_span;
  const bool enough_separation =
      profile.signal_to_noise() >= minimum_signal_to_noise;

  profile.valid = enough_samples && enough_span && enough_separation;
  return profile;
}

class LowPassFilter {
 public:
  explicit LowPassFilter(float alpha = 0.25f) { set_alpha(alpha); }

  void set_alpha(float alpha) {
    if (alpha < 0.0f) alpha_ = 0.0f;
    else if (alpha > 1.0f) alpha_ = 1.0f;
    else alpha_ = alpha;
  }

  void reset() {
    initialized_ = false;
    value_ = 0.0f;
  }

  float push(float sample) {
    if (!initialized_) {
      initialized_ = true;
      value_ = sample;
      return value_;
    }

    value_ += alpha_ * (sample - value_);
    return value_;
  }

  float value() const { return value_; }

 private:
  float alpha_ = 0.25f;
  float value_ = 0.0f;
  bool initialized_ = false;
};

}  // namespace gauntlet
