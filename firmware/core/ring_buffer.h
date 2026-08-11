#pragma once

#include <stddef.h>

namespace gauntlet {

// Fixed-capacity allocation-free ring buffer for embedded telemetry.
// Capacity must be greater than one. No heap allocation is performed.
template <typename T, size_t Capacity>
class RingBuffer {
  static_assert(Capacity > 1, "RingBuffer capacity must be greater than one");

 public:
  bool push(const T& value) {
    const size_t next = increment(head_);
    if (next == tail_) {
      return false;  // full
    }
    storage_[head_] = value;
    head_ = next;
    return true;
  }

  bool pop(T& value) {
    if (empty()) {
      return false;
    }
    value = storage_[tail_];
    tail_ = increment(tail_);
    return true;
  }

  bool empty() const { return head_ == tail_; }

  size_t size() const {
    return head_ >= tail_ ? head_ - tail_ : Capacity - (tail_ - head_);
  }

  constexpr size_t usable_capacity() const { return Capacity - 1; }

 private:
  static constexpr size_t increment(size_t index) { return (index + 1) % Capacity; }

  T storage_[Capacity]{};
  size_t head_{0};
  size_t tail_{0};
};

}  // namespace gauntlet
