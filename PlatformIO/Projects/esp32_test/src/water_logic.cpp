#include "water_logic.h"
#include "pump.h"
#include "soil_sensor.h"     
#include "dht_sensor.h" // [수정] 새 온습도 센서 헤더 연결
#include <Preferences.h>
#include <BLEDevice.h>
extern BLECharacteristic *pTxCharacteristic;

float ml_per_sec = 8.0f; 
float target_seconds = 0;
WateringMode currentMode = MODE_MANUAL; 
Preferences modePrefs; 

int ai_target_moisture = 30;   
int ai_water_duration = 3000;  

static bool watering = false;
static uint32_t water_end_ms = 0;
static uint32_t pump_phase_end_ms = 0;
static uint32_t last_auto_check_ms = 0;
static uint32_t last_water_done_ms = 0;

const float MAX_ML_PER_DOSE = 150.0f; 

void waterInit() {
    modePrefs.begin("system-mode", false); 
    currentMode = (WateringMode)modePrefs.getInt("mode", 0);
    modePrefs.end(); 
    Serial.printf("시스템 초기화 모드: %s\n", currentMode == MODE_AUTO ? "AUTO" : "MANUAL");
}

void setWateringMode(WateringMode mode) { 
    currentMode = mode;
    modePrefs.begin("system-mode", false);
    modePrefs.putInt("mode", (int)mode); 
    modePrefs.end();
    Serial.printf("모드 변경됨: %s\n", mode == MODE_AUTO ? "AUTO" : "MANUAL");
}

bool canWaterNow() { 
    return true; 
}

bool shouldAIWater() {
    int currentPercent = getMoisturePercent(); 
    if (currentPercent < ai_target_moisture) {
        Serial.printf("[AI 판단] 현재수분: %d%% < 기준: %d%% -> 급수 필요!\n", currentPercent, ai_target_moisture);
        return true; 
    }
    return false;
}

void startWaterMl(float ml) {
    if (watering) {
        Serial.println("ERR: already watering");
        return;
    }
    if (ml <= 0) return;
    if (ml > MAX_ML_PER_DOSE) ml = MAX_ML_PER_DOSE;
    if (!canWaterNow()) {
        Serial.println("ERR: cooldown active");
        return;
    }

    target_seconds = ml / ml_per_sec; 
    uint32_t total_ms = (uint32_t)(target_seconds * 1000);    

    Serial.print("WATER START: ");
    Serial.print(ml);
    Serial.print(" mL (");
    Serial.print(target_seconds, 2);
    Serial.println(" s)");

    pumpKick();
    pumpState = PUMP_KICK;
    pump_phase_end_ms = millis() + KICK_MS;
    water_end_ms = millis() + total_ms;
    watering = true;
}

void stopWater() {
    pumpOff();
    watering = false;
    Serial.println("STOPPED");
}

void waterLoop() {
    uint32_t now = millis();

    if (!watering && currentMode == MODE_AUTO) {
        if (now - last_auto_check_ms > 10000) { 
            last_auto_check_ms = now;
            
            if (shouldAIWater()) {
                Serial.println("AI: 자동 급수 시작.");
                float calc_ml = (ai_water_duration / 1000.0) * ml_per_sec;
                startWaterMl(calc_ml); 
            }
        }
    }

    if (!watering) return;

    if (pumpState == PUMP_KICK && (int32_t)(now - pump_phase_end_ms) >= 0) {
        pumpRun();
        pumpState = PUMP_RUN;
    }

    if ((int32_t)(now - water_end_ms) >= 0) {
        pumpOff();
        watering = false;
        last_water_done_ms = now;
        Serial.println("WATER DONE");
        sendWateringLog(target_seconds);
    }
}

void printStatus() {
    int moist = getMoisturePercent();
    float temp = getTemperature(); // dht_sensor에서 가져옴
    float humi = getHumidity();    // dht_sensor에서 가져옴

    Serial.println("=== STATUS ===");
    Serial.printf("Mode       : %s\n", currentMode == MODE_AUTO ? "AUTO" : "MANUAL");
    Serial.printf("Moisture   : %d%% (AI기준: <%d%%)\n", moist, ai_target_moisture);
    Serial.printf("Air Temp   : %.1f C\n", temp); 
    Serial.printf("Air Humi   : %.1f %%\n", humi); 
    Serial.printf("AI Duration: %d ms\n", ai_water_duration);
    Serial.printf("Watering   : %s\n", watering ? "YES" : "NO");
    Serial.println("=============");

    if (pTxCharacteristic) {
        String msg = "Soil:" + String(moist) + "% / Temp:" + String(temp, 1) + "C / Humi:" + String(humi, 1) + "%";
        pTxCharacteristic->setValue(msg.c_str());
        pTxCharacteristic->notify(); 
    }
}