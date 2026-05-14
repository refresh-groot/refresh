//깃허브 연습
#include <Arduino.h>
#include "pump.h"
#include "water_logic.h"
#include "sensor.h"
#include "serial_cmd.h"
#include "ble_cmd.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ArduinoJson.h> // [필수] platformio.ini에 추가했는지 확인!


const char* aiServerBaseUrl = "http://223.130.157.123:8080/plant/";
const char* serverUrl = "http://223.130.157.123:8080/api/watering-log";
const char* envServerUrl = "http://223.130.157.123:8080/api/environment-log";
const int MY_PLANT_ID = 101;

unsigned long lastEnvLogMs = 0;
const unsigned long REPORT_INTERVAL = 60000;

// [신규] AI 서버에서 식물 정보 가져오는 함수
void fetchPlantConfigFromAI(String plantName) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected!");
        return;
    }

    HTTPClient http;
    // URL 생성 (예: http://.../plant/바질)
    String url = String(aiServerBaseUrl) + plantName;
    
    Serial.print(">> AI 서버 요청 중: ");
    Serial.println(url);

    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
        String payload = http.getString();
        Serial.println(">> AI 응답 수신: " + payload);

        // JSON 파싱
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
            // JSON에서 값 추출
            int minMoisture = doc["min_moisture"]; 
            int duration = doc["water_duration_ms"];
            const char* tip = doc["care_tip"];

            // water_logic의 전역 변수 업데이트!
            ai_target_moisture = minMoisture;
            ai_water_duration = duration;

            Serial.println("====== [AI 설정 적용 완료] ======");
            Serial.printf("식물명    : %s\n", plantName.c_str());
            Serial.printf("기준 습도 : %d%% 미만일 때 급수\n", ai_target_moisture);
            Serial.printf("급수 시간 : %d ms\n", ai_water_duration);
            Serial.printf("관리 팁   : %s\n", tip);
            Serial.println("===============================");
        } else {
            Serial.println("JSON 파싱 실패");
        }
    } else {
        Serial.printf("서버 연결 실패 (Error: %d)\n", httpCode);
    }
    http.end();
}

void sendWateringLog(float duration) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        int moisture = getMoisturePercent();
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

void sendEnvironmentLog() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(envServerUrl);
        http.addHeader("Content-Type", "application/json");
        int moisture = getMoisturePercent(); 
        String json = "{\"plant_id\":" + String(MY_PLANT_ID) +
                      ",\"moisture_level\":" + String(moisture) + "}";
        int httpCode = http.POST(json);
        Serial.printf("[실시간 환경] 서버 전송 결과: %d\n", httpCode);
        http.end();
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
    Serial.println("Ready. Cmds: WATER <mL>, PLANT:<Name>, STOP, MODE:AUTO");
}

void loop() {
    waterLoop(); 
    handleSerial(); 
    
    unsigned long now = millis();
    if (now - lastEnvLogMs >= REPORT_INTERVAL) {
        lastEnvLogMs = now; 
        Serial.println(">>> 1분 주기 환경 데이터 자동 전송 시작");
        sendEnvironmentLog();
    }
}