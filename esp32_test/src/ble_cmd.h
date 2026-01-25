#pragma once
#include <BLEDevice.h>

void bleInit(); 
// 다른 파일에서도 블루투스 답장을 보낼 수 있게 변수를 공유합니다.
extern BLECharacteristic *pTxCharacteristic;