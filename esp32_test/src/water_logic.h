#pragma once
#include <Arduino.h>

enum WateringMode {
    MODE_MANUAL = 0,
    MODE_AUTO = 1
}; //수동 자동 모드

extern float ml_per_sec;
extern float target_seconds; 
extern WateringMode currentMode;

void waterInit(); // 로직 초기화(설정값 복구)
void startWaterMl(float ml);
void waterLoop();
void printStatus();
void stopWater();
void setWateringMode(WateringMode mode); 
void sendWateringLog(float duration);