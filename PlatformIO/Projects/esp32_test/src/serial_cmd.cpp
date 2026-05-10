#include "serial_cmd.h"
#include "command.h"

static String line;

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    
    if (c == '\r') continue;
    
    if (c == '\n') {
      handleCommand(line); 
      line = ""; // 다음 문장을 위해 상자 비우기
    } 
    else {
      line += c; // 엔터가 오기 전까지 글자 모으기
    }
  }
}