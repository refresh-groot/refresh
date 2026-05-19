#include "command.h"
#include "water_logic.h"
#include "pump.h"
#include <Preferences.h> // [추가] 저장 기능을 위해 필요

extern void fetchPlantConfigFromAI(String plantName);
extern int MY_PLANT_ID; // [추가] main.cpp에 있는 변수를 수정하기 위해 불러옴

void handleCommand(String cmd) {
    cmd.trim(); // 공백 지우기
    String up = cmd;
    up.toUpperCase(); // 대문자 변경

    // --- SET_ID 명령어 처리 ---
    if (up.startsWith("SET_ID ")) {
        // "SET_ID 128"에서 7번째 글자부터 끝까지가 숫자(128)
        int newId = cmd.substring(7).toInt();
        if (newId > 0) {
            MY_PLANT_ID = newId; // 전역 변수 업데이트

            // 기기 메모리(NVM)에 영구 저장
            Preferences prefs;
            prefs.begin("plant-data", false); // "plant-data" 저장소 열기
            prefs.putInt("id", newId);         // "id"라는 이름으로 저장
            prefs.end();

            Serial.print("▶ [ID 연동 완료] 새로운 식물 ID: ");
            Serial.println(MY_PLANT_ID);
        }
        return;
    }

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

    // ml_per_sec = 8.0f 값을 명령으로 바꿀 때
    if (up.startsWith("CAL ")) {
        float v = cmd.substring(4).toFloat();
        if (v > 0.1f) {
            ml_per_sec = v;
            Serial.print("CAL SET: ");
            Serial.println(ml_per_sec, 3);
        }
        return;
    }

    if (up.startsWith("WATER ")) { // 시작이 WATER
        float ml = cmd.substring(6).toFloat(); // 숫자부분 ml에 넣기
        startWaterMl(ml);
        return;
    }

    // 여기서 AI 식물 설정을 먼저 체크
    if (up.startsWith("PLANT-TYPE:")) {
        String name = cmd.substring(6);
        name.trim();
        fetchPlantConfigFromAI(name); // AI 서버 요청
        return;
    }

    Serial.println("ERR: Unknown command");
}