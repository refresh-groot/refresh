#include "water_logic.h"
#include "pump.h"
#include "sensor.h"
#include <Preferences.h>
#include <BLEDevice.h>
extern BLECharacteristic *pTxCharacteristic;

// [설정] 전역 변수
float ml_per_sec = 8.0f; // 내가 초당 펌프 물 얼만큼 나오는지 보고 수정할 것!! //초당 물 양 계산
float target_seconds = 0;
WateringMode currentMode = MODE_MANUAL; 
Preferences modePrefs; // 세이브 공간 (esp32 꺼도 지워지지 않음)

// AI 제어 변수 (기본값 설정)
int ai_target_moisture = 30;   // 기본 30% 이하면 물 줌
int ai_water_duration = 3000;  // 기본 3초 급수

// [상태] 내부 변수
static bool watering = false;
static uint32_t water_end_ms = 0;
static uint32_t pump_phase_end_ms = 0;
static uint32_t last_auto_check_ms = 0;
static uint32_t last_water_done_ms = 0;

const float MAX_ML_PER_DOSE = 150.0f; //const로 물 양 락 걸어놓음
// const uint32_t COOLDOWN_MS = 6UL * 60UL * 60UL * 1000UL; //시간 락

void waterInit() {
    modePrefs.begin("system-mode", false); //세이브 공간 열기
    currentMode = (WateringMode)modePrefs.getInt("mode", 0);
    modePrefs.end(); //닫기
    Serial.printf("시스템 초기화 모드: %s\n", currentMode == MODE_AUTO ? "AUTO" : "MANUAL");
}

// 모드 변경
void setWateringMode(WateringMode mode) { 
    currentMode = mode;
    modePrefs.begin("system-mode", false);
    modePrefs.putInt("mode", (int)mode); // 입력 받기
    modePrefs.end();
    Serial.printf("모드 변경됨: %s\n", mode == MODE_AUTO ? "AUTO" : "MANUAL");
}

//일단 무한으로 쿨타임 없음 (나중에 바꿔야함 !!!!!)
bool canWaterNow() { 
    return true; 
}

// [핵심] AI 센서 판단 로직
bool shouldAIWater() {
    int currentPercent = getMoisturePercent(); // % 단위로 가져옴
    
    // AI가 설정한 값(ai_target_moisture)보다 흙이 마르면 True 반환
    if (currentPercent < ai_target_moisture) {
        Serial.printf("[AI 판단] 현재수분: %d%% < 기준: %d%% -> 급수 필요!\n", currentPercent, ai_target_moisture);
        return true; //물 줌
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

    target_seconds = ml / ml_per_sec; //몇 초 줘야 하는지
    uint32_t total_ms = (uint32_t)(target_seconds * 1000); // 밀리스 값으로 변경 (정수로)   

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

    // 1. [자동 급수 모드]
    if (!watering && currentMode == MODE_AUTO) {
        if (now - last_auto_check_ms > 10000) { // 10초마다 체크
            last_auto_check_ms = now;
            
            if (shouldAIWater()) {
                Serial.println("AI: 자동 급수 시작.");
                
                // [수정] AI가 설정한 시간(ms)을 mL로 환산해서 급수
                float calc_ml = (ai_water_duration / 1000.0) * ml_per_sec;
                startWaterMl(calc_ml); 
            }
        }
    }

    // 2. 펌프 제어
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
    // 퍼센트와 AI 기준값 표시
    Serial.printf("Moisture   : %d%% (AI기준: <%d%%)\n", getMoisturePercent(), ai_target_moisture);
    Serial.printf("AI Duration: %d ms\n", ai_water_duration);
    Serial.printf("Watering   : %s\n", watering ? "YES" : "NO");
    Serial.println("=============");

    if (pTxCharacteristic) {
        String msg = "Moisture: " + String(getMoisturePercent()) + "%";
        pTxCharacteristic->setValue(msg.c_str());
        pTxCharacteristic->notify(); 
    }
}