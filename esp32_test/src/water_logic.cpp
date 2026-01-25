#include "water_logic.h"
#include "pump.h"
#include "sensor.h"
#include <Preferences.h>
#include <BLEDevice.h>
extern BLECharacteristic *pTxCharacteristic;

// [설정] 전역 변수
float ml_per_sec = 8.0f;
float target_seconds = 0;
WateringMode currentMode = MODE_MANUAL; // 기본값은 수동 (Preferences에서 복구됨)
Preferences modePrefs;

// [상태] 내부 변수
static bool watering = false;
static uint32_t water_end_ms = 0;
static uint32_t pump_phase_end_ms = 0;
static uint32_t last_auto_check_ms = 0;
static uint32_t last_water_done_ms = 0;

// [기준] 하드코딩된 상수들
const float MAX_ML_PER_DOSE = 150.0f;
const uint32_t COOLDOWN_MS = 6UL * 60UL * 60UL * 1000UL; 

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
    // [하드코딩 기준] 현재는 쿨다운 없이 즉시 급수 가능하도록 설정됨
    return true; 
    
    // 쿨다운 키려면 위에 지우고 주석 제거
    // if (last_water_done_ms == 0) return true;
    // return (millis() - last_water_done_ms >= COOLDOWN_MS);
}

// [핵심] AI 판단 로직이 들어갈 함수
bool shouldAIWater() {
    int moisture = getMoisture();
    
    // -----------------------------------------------------------
    // [미래의 AI 판단 로직 교체 구간]
    // 나중에 이곳에 서버 API 호출 결과나 AI 모델의 판단 결과가 들어감.
    // 예: if (server_AI_decision == "WATER_NOW") return true;
    // -----------------------------------------------------------
    
    // [현재 기준] 하드코딩된 수분값(3000)을 기준으로 판단
    if (moisture > 2300) return true; 
    
    return false;
}

void startWaterMl(float ml) {
    if (watering) {
        Serial.println("ERR: already watering");
        return;
    }
    if (ml <= 0) {
        Serial.println("ERR: invalid mL");
        return;
    }
    if (ml > MAX_ML_PER_DOSE) {
        ml = MAX_ML_PER_DOSE;
        Serial.println("WARN: capped dose");
    }
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

    // 1. [자동 급수 모드] AI 판단 및 실행 구간
    if (!watering && currentMode == MODE_AUTO) {
        // [하드코딩 기준] 10초마다 한 번씩만 판단 루틴 실행 (CPU 부하 감소)
        if (now - last_auto_check_ms > 10000) {
            last_auto_check_ms = now;
            
            if (shouldAIWater()) {
                Serial.println("AI: 토양 건조 감지. 자동 급수를 시작합니다.");
                
                // [하드코딩 기준] 자동 급수 시 한 번에 50ml씩 주도록 설정됨
                startWaterMl(50); 
            }
        }
    }

    // 2. [공통] 펌프 하드웨어 제어 구간
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
    Serial.println("=== STATUS ===");
    Serial.printf("Mode       : %s\n", currentMode == MODE_AUTO ? "AUTO" : "MANUAL");
    Serial.printf("Moisture   : %d (AI기준: > 2300)\n", getMoisture()); // 기준값 주석 표시
    Serial.print("ml_per_sec = ");
    Serial.println(ml_per_sec, 3);
    Serial.print("watering   = ");
    Serial.println(watering ? "YES" : "NO");
    Serial.println("=============");

    // 2. [추가] 아이폰 앱으로 답장 보내기
    if (pTxCharacteristic) {
        String msg = "Moisture: " + String(getMoisture()) + "\n";
        pTxCharacteristic->setValue(msg.c_str());
        pTxCharacteristic->notify(); // 아이폰에 띵동! 하고 알림 보내기
    }
}