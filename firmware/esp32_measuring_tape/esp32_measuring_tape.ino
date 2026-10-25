/*
 * Measuring Tape - ESP32 firmware
 * -------------------------------
 *
 * A hand-held distance meter. Press the KY-004 button, the HC-SR04 takes a
 * filtered measurement, the SSD1306 shows it, and the ESP32 notifies the
 * Android app over BLE.
 *
 * Device -> app frames (newline-delimited ASCII):
 *
 *     DIST:127.1\n
 *     DIST:ERR\n
 *     INFO:MEASURING_TAPE_V2\n
 *     PONG\n
 *     OK:CAL=1.5\n
 *     ERR:UNKNOWN\n
 *
 * App -> device commands (write to the command characteristic):
 *
 *     PING\n
 *     CAL:<cm>\n     datum offset added to sensor readings
 *
 * Wiring
 * ------
 *   HC-SR04 VCC   -> 5V (VIN)
 *   HC-SR04 GND   -> GND
 *   HC-SR04 TRIG  -> GPIO18
 *   HC-SR04 ECHO  -> GPIO19  *through a 1k/2k divider to 3.3V*
 *   KY-004 S      -> GPIO27
 *   KY-004 VCC    -> 3.3V
 *   KY-004 GND    -> GND
 *   SSD1306 SDA   -> GPIO21
 *   SSD1306 SCL   -> GPIO22
 *   SSD1306 VCC   -> 3.3V
 *   SSD1306 GND   -> GND
 *
 * The HC-SR04 ECHO output is 5V. Never connect it directly to an ESP32 GPIO.
 * Use a divider: ECHO -> 1k -> GPIO19, and 2k from GPIO19 to GND.
 *
 * Board: "ESP32 Dev Module" (ESP32 Arduino core 2.0.17+ or 3.x).
 * Libraries: Adafruit SSD1306, Adafruit GFX Library, Adafruit BusIO.
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>

// ---------------------------------------------------------------------------
// Pin map
// ---------------------------------------------------------------------------
static const uint8_t TRIG_PIN = 18;
static const uint8_t ECHO_PIN = 19;
static const uint8_t BUTTON_PIN = 27;
static const uint8_t I2C_SDA_PIN = 21;
static const uint8_t I2C_SCL_PIN = 22;

// The KY-004 used in the prototype is active HIGH. If your module is active
// LOW, change this to LOW.
static const int BUTTON_ACTIVE_LEVEL = HIGH;

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------
static const uint32_t SERIAL_BAUD = 115200;
static const uint32_t SCREEN_TIMEOUT_MS = 10000;
static const unsigned long DEBOUNCE_MS = 40;
static const uint8_t SAMPLES = 5;
static const uint16_t SAMPLE_GAP_MS = 40;
static const uint32_t ECHO_TIMEOUT_US = 30000;  // ~5 m round trip
static const float SOUND_CM_PER_US = 0.0343f;
static const float MIN_VALID_CM = 2.0f;
static const float MAX_VALID_CM = 400.0f;

// Added to every reading so the app measures from the front face of the case.
// Set with the CAL command or change this default.
static float datumOffsetCm = 0.0f;

// ---------------------------------------------------------------------------
// BLE
// ---------------------------------------------------------------------------
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define MEASUREMENT_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define COMMAND_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a9"

static const char *DEVICE_NAME = "DistanceMeter";

BLECharacteristic *measurementChar = nullptr;
volatile bool bleConnected = false;
volatile bool advertisingRestartPending = false;
volatile bool screenRefreshPending = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    (void)server;
    bleConnected = true;
    screenRefreshPending = true;
    BLEDevice::getAdvertising()->stop();
  }

  void onDisconnect(BLEServer *server) override {
    (void)server;
    bleConnected = false;
    screenRefreshPending = true;
    advertisingRestartPending = true;
  }
};

std::string trimCopy(const std::string &value) {
  const size_t first = value.find_first_not_of(" \r\n\t");
  if (first == std::string::npos) {
    return "";
  }
  const size_t last = value.find_last_not_of(" \r\n\t");
  return value.substr(first, last - first + 1);
}

void publishFrame(const char *frame) {
  char line[64];
  snprintf(line, sizeof(line), "%s\n", frame);

  if (measurementChar != nullptr) {
    measurementChar->setValue(reinterpret_cast<uint8_t *>(line), strlen(line));
    if (bleConnected) {
      measurementChar->notify();
    }
  }

  Serial.print(frame);
  Serial.println();
}

void handleCommand(const std::string &raw) {
  const std::string command = trimCopy(raw);
  if (command.empty()) {
    return;
  }

  if (command == "PING") {
    publishFrame("PONG");
    return;
  }

  if (command.rfind("CAL:", 0) == 0) {
    const float value = static_cast<float>(atof(command.c_str() + 4));
    if (value >= -100.0f && value <= 100.0f) {
      datumOffsetCm = value;
      char reply[40];
      snprintf(reply, sizeof(reply), "OK:CAL=%.1f", datumOffsetCm);
      publishFrame(reply);
    } else {
      publishFrame("ERR:CAL");
    }
    return;
  }

  publishFrame("ERR:UNKNOWN");
}

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    // ESP32 core 3.x returns Arduino String here; core 2.x returned
    // std::string. Converting through c_str()/length() supports both.
    const auto value = characteristic->getValue();
    const std::string raw(value.c_str(), value.length());
    size_t start = 0;

    while (start < raw.size()) {
      const size_t end = raw.find('\n', start);
      const std::string line =
          raw.substr(start, end == std::string::npos ? std::string::npos : end - start);
      handleCommand(line);
      if (end == std::string::npos) {
        break;
      }
      start = end + 1;
    }
  }
};

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool displayReady = false;
bool screenOn = true;
unsigned long lastActivityMs = 0;
bool hasLastDistance = false;
float lastDistanceCm = -1.0f;

void screenWake() {
  if (!displayReady) {
    return;
  }
  if (!screenOn) {
    display.ssd1306_command(SSD1306_DISPLAYON);
    screenOn = true;
  }
  lastActivityMs = millis();
}

void screenSleep() {
  if (!displayReady) {
    return;
  }
  if (screenOn) {
    display.ssd1306_command(SSD1306_DISPLAYOFF);
    screenOn = false;
  }
}

void showMessage(const char *line1, const char *line2) {
  if (!displayReady) {
    return;
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(line1);
  display.setTextSize(2);
  display.setCursor(0, 24);
  display.println(line2);
  display.display();
}

void showIdle() {
  if (!displayReady) {
    return;
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Distance Meter");
  display.setCursor(92, 0);
  display.print(bleConnected ? "BLE ok" : "BLE --");

  display.setTextSize(2);
  display.setCursor(0, 24);
  display.println("Ready");

  display.setTextSize(1);
  display.setCursor(0, 52);
  display.println("Press the button");
  display.display();
}

void showDistance(float cm) {
  if (!displayReady) {
    return;
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Distance");
  display.setCursor(92, 0);
  display.print(bleConnected ? "BLE ok" : "BLE --");

  display.setTextSize(3);
  display.setCursor(0, 22);
  if (cm < 0) {
    display.print("--");
  } else {
    display.print(cm, 1);
  }

  display.setTextSize(1);
  display.setCursor(0, 56);
  display.print(cm < 0 ? "No echo" : "cm");
  display.display();
}

void refreshScreen() {
  if (!displayReady || !screenOn) {
    return;
  }
  if (hasLastDistance) {
    showDistance(lastDistanceCm);
  } else {
    showIdle();
  }
  lastActivityMs = millis();
}

// ---------------------------------------------------------------------------
// Sensor
// ---------------------------------------------------------------------------
float readOnceCm() {
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

float measureCm() {
  float values[SAMPLES];
  uint8_t count = 0;

  for (uint8_t i = 0; i < SAMPLES; i++) {
    const float value = readOnceCm();
    if (value >= MIN_VALID_CM && value <= MAX_VALID_CM) {
      values[count++] = value;
    }
    delay(SAMPLE_GAP_MS);
  }

  if (count == 0) {
    return -1.0f;
  }

  for (uint8_t i = 0; i < count - 1; i++) {
    for (uint8_t j = i + 1; j < count; j++) {
      if (values[j] < values[i]) {
        const float temporary = values[i];
        values[i] = values[j];
        values[j] = temporary;
      }
    }
  }

  return values[count / 2] + datumOffsetCm;
}

// ---------------------------------------------------------------------------
// Button + measurement
// ---------------------------------------------------------------------------
int lastButtonReading = LOW;
int stableButtonState = LOW;
unsigned long lastButtonChangeMs = 0;

void doMeasurement();

void pollButton() {
  const int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonReading) {
    lastButtonChangeMs = millis();
    lastButtonReading = reading;
  }

  if ((millis() - lastButtonChangeMs) > DEBOUNCE_MS && reading != stableButtonState) {
    stableButtonState = reading;
    if (stableButtonState == BUTTON_ACTIVE_LEVEL) {
      doMeasurement();
    }
  }
}

void doMeasurement() {
  screenWake();
  showMessage("Measuring", "...");

  const float cm = measureCm();
  lastDistanceCm = cm;
  hasLastDistance = true;
  showDistance(cm);

  if (cm < 0.0f) {
    publishFrame("DIST:ERR");
    Serial.println("No reading");
  } else {
    char frame[32];
    snprintf(frame, sizeof(frame), "DIST:%.1f", cm);
    publishFrame(frame);
  }

  lastActivityMs = millis();
}

// ---------------------------------------------------------------------------
// Setup + loop
// ---------------------------------------------------------------------------
void setupDisplay() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000);

  displayReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!displayReady) {
    Serial.println("OLED not found - continuing without display");
    return;
  }

  display.clearDisplay();
  display.display();
  screenOn = true;
  showMessage("Distance Meter", "Starting");
}

void setupBle() {
  BLEDevice::init(DEVICE_NAME);

  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);

  measurementChar = service->createCharacteristic(
      MEASUREMENT_CHAR_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  measurementChar->addDescriptor(new BLE2902());
  {
    char initial[] = "INFO:MEASURING_TAPE_V2\n";
    measurementChar->setValue(reinterpret_cast<uint8_t *>(initial), strlen(initial));
  }

  BLECharacteristic *commandChar = service->createCharacteristic(
      COMMAND_CHAR_UUID,
      BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  commandChar->setCallbacks(new CommandCallbacks());

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE advertising as DistanceMeter");
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(250);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  pinMode(BUTTON_PIN, INPUT);

  lastButtonReading = digitalRead(BUTTON_PIN);
  stableButtonState = lastButtonReading;
  lastButtonChangeMs = millis();

  setupDisplay();
  setupBle();

  publishFrame("INFO:MEASURING_TAPE_V2");
  lastActivityMs = millis();
  showIdle();
}

void loop() {
  pollButton();

  if (advertisingRestartPending) {
    advertisingRestartPending = false;
    delay(100);
    BLEDevice::startAdvertising();
  }

  if (screenRefreshPending) {
    screenRefreshPending = false;
    refreshScreen();
  }

  if (screenOn && displayReady && (millis() - lastActivityMs > SCREEN_TIMEOUT_MS)) {
    screenSleep();
  }

  delay(5);
}
