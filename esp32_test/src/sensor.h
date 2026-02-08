#pragma once
#include <Arduino.h>

#define SOIL_PIN 8  // 센서 AOUT이 연결된 GPIO 번호

// 캘리브레이션 값 (환경에 맞게 수정하세요)
// 공기 중(Dry) 값과 물 속(Wet) 값
#define SOIL_DRY_VAL  3500 
#define SOIL_WET_VAL  1500

void sensorInit();
int getMoisture();        // 기존: 0~4095 Raw 값
int getMoisturePercent(); // 신규: 0~100% 변환 값