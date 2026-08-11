#pragma once

#include <stdint.h>
#include <string.h>

namespace gauntlet {

constexpr uint16_t kPacketMagic = 0xA61D;
constexpr uint8_t kProtocolVersion = 1;

enum class PacketType : uint8_t {
  Telemetry = 1,
  Gesture = 2,
  CommandAck = 3,
  Heartbeat = 4,
};

#pragma pack(push, 1)
struct PacketHeader {
  uint16_t magic;
  uint8_t version;
  uint8_t type;
  uint16_t sequence;
  uint16_t payload_size;
};

struct TelemetryPayload {
  int16_t accel_x_mg;
  int16_t accel_y_mg;
  int16_t accel_z_mg;
  uint16_t battery_mv;
  uint16_t flex_raw;
  uint8_t gesture;
};
#pragma pack(pop)

static_assert(sizeof(PacketHeader) == 8, "PacketHeader layout changed");
static_assert(sizeof(TelemetryPayload) == 11, "TelemetryPayload layout changed");

inline uint16_t crc16_ccitt(const uint8_t* data, size_t length, uint16_t seed = 0xFFFF) {
  uint16_t crc = seed;
  for (size_t i = 0; i < length; ++i) {
    crc ^= static_cast<uint16_t>(data[i]) << 8;
    for (uint8_t bit = 0; bit < 8; ++bit) {
      crc = (crc & 0x8000) ? static_cast<uint16_t>((crc << 1) ^ 0x1021)
                           : static_cast<uint16_t>(crc << 1);
    }
  }
  return crc;
}

template <typename Payload>
struct Packet {
  PacketHeader header{};
  Payload payload{};
  uint16_t crc{};
};

template <typename Payload>
Packet<Payload> make_packet(PacketType type, uint16_t sequence, const Payload& payload) {
  Packet<Payload> packet{};
  packet.header.magic = kPacketMagic;
  packet.header.version = kProtocolVersion;
  packet.header.type = static_cast<uint8_t>(type);
  packet.header.sequence = sequence;
  packet.header.payload_size = sizeof(Payload);
  packet.payload = payload;

  const auto* bytes = reinterpret_cast<const uint8_t*>(&packet);
  packet.crc = crc16_ccitt(bytes, sizeof(PacketHeader) + sizeof(Payload));
  return packet;
}

template <typename Payload>
bool validate_packet(const Packet<Payload>& packet) {
  if (packet.header.magic != kPacketMagic ||
      packet.header.version != kProtocolVersion ||
      packet.header.payload_size != sizeof(Payload)) {
    return false;
  }

  const auto* bytes = reinterpret_cast<const uint8_t*>(&packet);
  const uint16_t expected = crc16_ccitt(bytes, sizeof(PacketHeader) + sizeof(Payload));
  return expected == packet.crc;
}

}  // namespace gauntlet
