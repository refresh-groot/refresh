#include "pump.h"

const int DUTY_KICK = 255;
const int DUTY_RUN  = 255;
const uint32_t KICK_MS = 500;

PumpState pumpState = PUMP_IDLE;

void pumpInit() {
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RES);
  ledcAttachPin(PUMP_PWM_PIN, PWM_CHANNEL);
  pumpOff();
}

void pumpKick() {
  ledcWrite(PWM_CHANNEL, DUTY_KICK);
}

void pumpRun() {
  ledcWrite(PWM_CHANNEL, DUTY_RUN);
}

void pumpOff() {
  ledcWrite(PWM_CHANNEL, 0);
  pumpState = PUMP_IDLE;
}
