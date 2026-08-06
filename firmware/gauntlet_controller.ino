// AEGIS GAUNTLET - firmware para ESP32
// Base para controle de LEDs, vibração e servos em um protótipo mecatrônico.

#include <Arduino.h>

const int ledPin = 2;
const int vibrationPin = 4;
const int servoPin = 13;
const int buttonPin = 15;

bool systemActive = false;
int gestureMode = 0;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(vibrationPin, OUTPUT);
  pinMode(servoPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  Serial.begin(115200);
  Serial.println("AEGIS GAUNTLET controller ready");
}

void loop() {
  if (digitalRead(buttonPin) == LOW) {
    systemActive = !systemActive;
    delay(300);
  }

  if (systemActive) {
    digitalWrite(ledPin, HIGH);
    digitalWrite(vibrationPin, HIGH);
    analogWrite(servoPin, 180);
    Serial.println("System active: gesture feedback enabled");
  } else {
    digitalWrite(ledPin, LOW);
    digitalWrite(vibrationPin, LOW);
    analogWrite(servoPin, 0);
    Serial.println("System idle");
  }

  delay(250);
}
