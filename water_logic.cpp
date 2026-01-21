#include "water_logic.h"
#include "pump.h"

float ml_per_sec = 8.0f;

static bool watering = false;
static uint32_t water_end_ms = 0;
static uint32_t pump_phase_end_ms = 0;

const float MAX_ML_PER_DOSE = 150.0f;
const uint32_t COOLDOWN_MS =
  6UL * 60UL * 60UL * 1000UL;

static uint32_t last_water_done_ms = 0;

bool canWaterNow() {
  if (last_water_done_ms == 0) return true;
  return millis() - last_water_done_ms >= COOLDOWN_MS;
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

  float seconds = ml / ml_per_sec;
  uint32_t total_ms = (uint32_t)(seconds * 1000);

  Serial.print("WATER START: ");
  Serial.print(ml);
  Serial.print(" mL (");
  Serial.print(seconds, 2);
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
  if (!watering) return;

  uint32_t now = millis();

  if (pumpState == PUMP_KICK &&
      (int32_t)(now - pump_phase_end_ms) >= 0) {
    pumpRun();
    pumpState = PUMP_RUN;
  }

  if ((int32_t)(now - water_end_ms) >= 0) {
    pumpOff();
    watering = false;
    last_water_done_ms = now;
    Serial.println("WATER DONE");
  }
}

void printStatus() {
  Serial.println("=== STATUS ===");
  Serial.print("ml_per_sec = ");
  Serial.println(ml_per_sec, 3);
  Serial.print("watering   = ");
  Serial.println(watering ? "YES" : "NO");
  Serial.println("=============");
}
