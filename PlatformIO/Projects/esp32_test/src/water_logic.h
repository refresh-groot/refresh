#pragma once
#include <Arduino.h>

enum WateringMode {
    MODE_MANUAL = 0, //자동모드
    MODE_AUTO = 1 //수동모드
}; 

extern float ml_per_sec;
extern float target_seconds; 
extern WateringMode currentMode; //자동, 수동모드 둘 중 최근


extern int ai_target_moisture;  // AI가 설정할 목표 습도
extern int ai_water_duration;   // AI가 설정할 급수 시간

void waterInit(); 
void startWaterMl(float ml);
void waterLoop();
void printStatus();
void stopWater();
void setWateringMode(WateringMode mode); 
void sendWateringLog(float duration);