#pragma once
#include <Arduino.h>

extern float ml_per_sec;

void startWaterMl(float ml);
void waterLoop();
void printStatus();
void stopWater();
