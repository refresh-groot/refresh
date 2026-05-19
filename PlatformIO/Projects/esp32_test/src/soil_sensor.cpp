#include <Arduino.h>
#include "sensor.h"


#define SOIL_PIN 8  // 센서 AOUT이 연결된 GPIO 번호
#define SOIL_DRY_VAL  2550 // 공기 중(Dry) 값
#define SOIL_WET_VAL  955 // 물 속(Wet) 값

void sensorInit() {
    analogReadResolution(12); // 12비트 0~4095
}

int getMoisture() {
    return analogRead(SOIL_PIN); //센서 값 읽기 
}

int getMoisturePercent() {
    int raw = getMoisture();

    // map함수 (비율 변환기 0~100등으로)
    // 예: 3000이 들어오면 -15%가 됨
    int percent = map(raw, SOIL_DRY_VAL, SOIL_WET_VAL, 0, 100);

    // constrain 함수 (범위 강제 고정) 안전장치
    // 0보다 작으면 0으로, 100보다 크면 100으로 딱 자름
    percent = constrain(percent, 0, 100);

    return percent;
}