// AEGIS GAUNTLET - Firmware inicial
// Este arquivo representa uma base de desenvolvimento para ESP32.
// O objetivo é estruturar a lógica principal do projeto para futura integração com hardware real.

#include <Arduino.h>

const int ledPin = 2;
const int vibrationPin = 4;

enum GestureMode {
  IDLE,
  FIST,
  OPEN,
  POINT,
  WAVE
};

GestureMode currentMode = IDLE;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(vibrationPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("AEGIS GAUNTLET firmware initialized");
}

void loop() {
  // Lógica placeholder para futura leitura de sensores
  currentMode = OPEN;

  if (currentMode == OPEN) {
    digitalWrite(ledPin, HIGH);
    digitalWrite(vibrationPin, HIGH);
    Serial.println("Mode: OPEN - feedback active");
  } else {
    digitalWrite(ledPin, LOW);
    digitalWrite(vibrationPin, LOW);
  }

  delay(1000);
}
