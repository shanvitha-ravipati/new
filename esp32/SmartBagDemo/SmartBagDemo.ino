#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Use your Wi-Fi network and the computer's LAN IP address (not localhost).
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://YOUR_COMPUTER_IP:5000/api/sensors";

const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSendTime = 0;
int demoTick = 0;

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected. ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void sendSensorReading() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected; reconnecting.");
    connectToWiFi();
  }

  // Replace these simulated values with your sensor readings when hardware is ready.
  float weightKg = 4.2 + (demoTick % 6) * 0.1;
  float temperatureC = 27.5 + (demoTick % 5) * 0.3;
  int batteryPercent = 82 - (demoTick % 20);
  bool motionDetected = (demoTick % 17 == 0);
  const char* bagStatus = (demoTick % 23 == 0) ? "OPEN" : "CLOSED";
  float latitude = 17.3850;
  float longitude = 78.4867;
  demoTick++;

  StaticJsonDocument<256> document;
  document["bagId"] = "BAG001";
  document["weight"] = weightKg;
  document["temperature"] = temperatureC;
  document["battery"] = batteryPercent;
  document["bagStatus"] = bagStatus;
  document["motion"] = motionDetected;
  document["latitude"] = latitude;
  document["longitude"] = longitude;

  String requestBody;
  serializeJson(document, requestBody);
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  int responseCode = http.POST(requestBody);

  Serial.print("POST response: ");
  Serial.println(responseCode);
  if (responseCode > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(http.errorToString(responseCode));
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    sendSensorReading();
  }
}
