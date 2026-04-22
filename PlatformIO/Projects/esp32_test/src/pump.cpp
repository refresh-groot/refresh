#include "pump.h"

const int DUTY_KICK = 255; //최대
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
  pumpState = PUMP_KICK;             // 기록장에 기동(Kick) 쓰기
}

void pumpRun() {
  ledcWrite(PWM_CHANNEL, DUTY_RUN);  
  pumpState = PUMP_RUN;              // 기록장에 운전(Run) 쓰기
}

void pumpOff() {
  ledcWrite(PWM_CHANNEL, 0);         // 전기 끊기
  pumpState = PUMP_IDLE;             // 기록장에 가동x(IDLE) 쓰기 
}