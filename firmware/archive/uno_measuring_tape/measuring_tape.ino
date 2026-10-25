/*
 * Measuring Tape - Arduino UNO firmware
 * -------------------------------------
 *
 * Reads an HC-SR04 ultrasonic sensor, smooths the result and streams it over a
 * Bluetooth SPP link (HC-05/HC-06) as newline-delimited ASCII frames:
 *
 *     DIST:127.1\n
 *
 * The React Native app (../mobile) consumes these frames. The same frames are
 * mirrored to the USB serial port so the sketch can be verified without the
 * phone connected.
 *
 * Incoming commands (one per line):
 *     THRESH:<cm>    set the alert threshold, e.g. THRESH:30
 *     BEEP:<0|1>     enable/disable the local buzzer
 *     PING           reply with PONG
 *
 * Wiring
 * ------
 *   HC-SR04 VCC  -> 5V
 *   HC-SR04 GND  -> GND
 *   HC-SR04 TRIG -> D9
 *   HC-SR04 ECHO -> D10
 *   Buzzer   +   -> D8 (through a 220R resistor)
 *   HC-05    VCC -> 5V
 *   HC-05    GND -> GND
 *   HC-05    TXD -> D2  (UNO SoftwareSerial RX)
 *   HC-05    RXD -> D3  (UNO SoftwareSerial TX) *through a voltage divider*
 *
 * HC-05 RX is a 3.3 V input. Use a divider (e.g. 1k series + 2k to GND) on the
 * D3 -> RXD line, otherwise the module degrades over time.
 *
 * Target board: Arduino UNO (ATmega328P), Arduino IDE 2.x, AVR core 1.8.6+.
 */

#include <SoftwareSerial.h>

// --- Pin map ---------------------------------------------------------------
static const uint8_t TRIG_PIN = 9;
static const uint8_t ECHO_PIN = 10;
static const uint8_t BUZZER_PIN = 8;

static const uint8_t BT_RX_PIN = 2;  // UNO receives on D2  <- HC-05 TXD
static const uint8_t BT_TX_PIN = 3;  // UNO transmits on D3 -> HC-05 RXD

// --- Tuning ----------------------------------------------------------------
static const unsigned long SAMPLE_INTERVAL_MS = 200;   // 5 Hz output rate
static const unsigned long ECHO_TIMEOUT_US = 30000UL;  // ~5 m round trip
static const float SOUND_CM_PER_US = 0.0343f;
static const float SMOOTHING = 0.35f;                  // EMA weight, 0..1

SoftwareSerial bluetooth(BT_RX_PIN, BT_TX_PIN);

float smoothedDistanceCm = -1.0f;
float alertThresholdCm = 30.0f;
bool buzzerEnabled = true;
unsigned long lastSampleAt = 0;

/**
 * Fire the sensor and return the distance in cm.
 * Returns -1 when the echo times out (nothing in range).
 */
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) {
    return -1.0f;
  }
  return (duration * SOUND_CM_PER_US) / 2.0f;
}

void sendLine(const String &line) {
  bluetooth.println(line);
  Serial.println(line);
}

void applyAlert(float distanceCm) {
  if (buzzerEnabled && distanceCm >= 0.0f && distanceCm < alertThresholdCm) {
    tone(BUZZER_PIN, 2000);
  } else {
    noTone(BUZZER_PIN);
  }
}

void handleCommand(const String &raw) {
  String command = raw;
  command.trim();
  if (command.length() == 0) {
    return;
  }

  if (command.equalsIgnoreCase("PING")) {
    sendLine(F("PONG"));
    return;
  }

  if (command.startsWith("THRESH:")) {
    const float value = command.substring(7).toFloat();
    if (value >= 0.0f) {
      alertThresholdCm = value;
      sendLine("OK:THRESH=" + String(alertThresholdCm, 1));
    } else {
      sendLine(F("ERR:THRESH"));
    }
    return;
  }

  if (command.startsWith("BEEP:")) {
    buzzerEnabled = command.substring(5).toInt() != 0;
    if (!buzzerEnabled) {
      noTone(BUZZER_PIN);
    }
    sendLine("OK:BEEP=" + String(buzzerEnabled ? 1 : 0));
    return;
  }

  sendLine("ERR:UNKNOWN");
}

void readCommands() {
  if (!bluetooth.available()) {
    return;
  }
  String line = bluetooth.readStringUntil('\n');
  handleCommand(line);
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  noTone(BUZZER_PIN);

  Serial.begin(9600);
  bluetooth.begin(9600);

  Serial.println(F("Measuring Tape firmware ready"));
  sendLine(F("INFO:MEASURING_TAPE_V1"));
}

void loop() {
  readCommands();

  const unsigned long now = millis();
  if (now - lastSampleAt < SAMPLE_INTERVAL_MS) {
    return;
  }
  lastSampleAt = now;

  const float raw = readDistanceCm();

  if (raw < 0.0f) {
    sendLine(F("DIST:ERR"));
    applyAlert(-1.0f);
    return;
  }

  if (smoothedDistanceCm < 0.0f) {
    smoothedDistanceCm = raw;
  } else {
    smoothedDistanceCm += (raw - smoothedDistanceCm) * SMOOTHING;
  }

  sendLine("DIST:" + String(smoothedDistanceCm, 1));
  applyAlert(smoothedDistanceCm);
}
