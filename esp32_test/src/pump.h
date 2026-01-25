#pragma once //이 헤더가 중복 include 되는 것 방지
#include <Arduino.h> //uint32_t, millis(), ledc*() 사용 위해 필요 //외부는 <>로 불러오기

#define PUMP_PWM_PIN 7 //GPIO핀 7번
#define PWM_CHANNEL  0
#define PWM_FREQ     20000 //PWM 20kHz
#define PWM_RES      8 //8비트 해상도(0~255)

extern const int DUTY_KICK; //실제 값들은 pump.cpp에 있음, 중복정의 방지, 읽기만 가능 (참조)
extern const int DUTY_RUN;
extern const uint32_t KICK_MS;

//펌프 상태 정의
enum PumpState { //enum은 열거형 집합
  PUMP_IDLE, //정지
  PUMP_KICK, //기동
  PUMP_RUN //정상 운전
};

extern PumpState pumpState;

void pumpInit(); //함수는 extern 생략임(자동)
void pumpKick();
void pumpRun();
void pumpOff();
