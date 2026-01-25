#include <Arduino.h>
#include "pump.h"
#include "water_logic.h"
#include "sensor.h"
#include "serial_cmd.h"
#include "ble_cmd.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>

const char* serverUrl = "http://223.130.157.123:8080/api/watering-log";
const int MY_PLANT_ID = 83;

void sendWateringLog(float duration) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        int moisture = getMoisture();
        String json = "{\"plant_id\":" + String(MY_PLANT_ID) +
                      ",\"duration_sec\":" + String((int)duration) +
                      ",\"is_auto\":" + (currentMode == MODE_AUTO ? "true" : "false") +
                      ",\"moisture_level\":" + String(moisture) + "}";
        
        int httpCode = http.POST(json);
        Serial.printf("서버 전송 결과: %d\n", httpCode);
        http.end();
    } else {
        Serial.println("WiFi disconnected, cannot send log");
    }
}

void setup() {
    Serial.begin(115200);
    delay(1500);

    sensorInit();
    pumpInit();
    waterInit();

    Preferences prefs;
    prefs.begin("wifi-info", true);
    String savedSSID = prefs.getString("ssid", "");
    String savedPASS = prefs.getString("pass", "");
    prefs.end();

    if (savedSSID != "") {
        Serial.println("Connecting to Saved WiFi: " + savedSSID);
        WiFi.begin(savedSSID.c_str(), savedPASS.c_str());
        int retry = 0;
        while (WiFi.status() != WL_CONNECTED && retry < 60) {
            delay(500);
            Serial.print(".");
            retry++;
        }
        if(WiFi.status() == WL_CONNECTED) Serial.println("\nWiFi Connected!");
        else Serial.println("\nWiFi FAIL");
    }

    bleInit();
    Serial.println("Ready. Commands: WATER <mL>, STOP, STATUS, MODE:AUTO, MODE:MANUAL");
}

void loop() {
    waterLoop();
    handleSerial();
}