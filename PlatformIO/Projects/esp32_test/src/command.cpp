#include "command.h"
#include "water_logic.h"
#include "pump.h"

extern void fetchPlantConfigFromAI(String plantName);

void handleCommand(String cmd) {
    cmd.trim(); //공백 지우기
    String up = cmd; 
    up.toUpperCase(); //대문자 변경

    if (up == "STOP") {
        pumpOff();
        Serial.println("STOPPED");
        return;
    }

    if (up == "STATE") {
        printStatus();
        return;
    }

    if (up == "MODE:AUTO") {
        setWateringMode(MODE_AUTO);
        return;
    }

    if (up == "MODE:MANUAL") {
        setWateringMode(MODE_MANUAL);
        return;
    }

    //ml_per_sec = 8.0f 값을 명령으로 바꿀 때
    if (up.startsWith("CAL ")) { 
        float v = cmd.substring(4).toFloat();
        if (v > 0.1f) {
            ml_per_sec = v;
            Serial.print("CAL SET: ");
            Serial.println(ml_per_sec, 3);
        }
        return;
    }

    if (up.startsWith("WATER ")) { //시작이 WATER
        float ml = cmd.substring(6).toFloat(); //숫자부분 ml에 넣기
        startWaterMl(ml);
        return;
    }

    //  여기서 AI 식물 설정을 먼저 체크
    if (up.startsWith("PLANT-TYPE:")) {
        String name = cmd.substring(6);
        name.trim();
        fetchPlantConfigFromAI(name); // AI 
        return;
    }

    Serial.println("ERR: Unknown command");
}