#include "serial_cmd.h"
#include "command.h"

// main.cpp에 있는 함수를 가져다 쓰겠다고 선언
extern void fetchPlantConfigFromAI(String plantName);

static String line;

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      
      // [신규] PLANT:바질 명령어를 처리하는 로직 추가
      if (line.startsWith("PLANT:")) {
          String plantName = line.substring(6); // "PLANT:" 뒤의 글자
          plantName.trim();
          fetchPlantConfigFromAI(plantName); // AI 호출!
      } else {
          handleCommand(line);
      }
      
      line = "";
    } else {
      line += c;
    }
  }
}