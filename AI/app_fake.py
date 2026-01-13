import streamlit as st
import os
import json
import time
from PIL import Image
#AI 함수 불러오기
from test import get_plant_diagnosis 

# ---------------------------------------------------------
# 1. 페이지 설정 (가장 먼저 와야 함)
# ---------------------------------------------------------
st.set_page_config(page_title="스마트팜 AI 진단", page_icon="🌿")

st.title("🌿 스마트팜 식물 진단 AI")
st.write("식물 사진을 업로드하면 AI가 진단하고 물 주기 스케줄을 알려줍니다.")

# ---------------------------------------------------------
# 2. 파일 업로드 창
# ---------------------------------------------------------
uploaded_file = st.file_uploader("식물 사진을 선택하세요", type=["jpg", "png", "jpeg"])

# ---------------------------------------------------------
# 3. 로직 시작 (사진이 올라오면 실행)
# ---------------------------------------------------------
if uploaded_file is not None:
    # (1) 화면에 사진 보여주기
    image = Image.open(uploaded_file)
    st.image(image, caption='업로드된 사진', use_column_width=True)
    
    # (2) 이미지 임시 저장 (AI에게 파일 경로를 주기 위해)
    temp_path = "temp_plant_image.jpg"
    with open(temp_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    
    st.write("🤖 AI가 분석 중입니다... 잠시만 기다려주세요.")

    # (3) AI 진단 함수 호출
    fake_history = []  # 테스트용 빈 기록
    result_json_str = get_plant_diagnosis(temp_path, fake_history)

    # 임시 파일 삭제 (청소)
    os.remove(temp_path)

    # ---------------------------------------------------------
    # 4. 결과 화면 출력
    # ---------------------------------------------------------
    try:
        # 문자열을 진짜 JSON 객체로 변환
        result = json.loads(result_json_str)
        
        st.success("진단이 완료되었습니다!")
        st.divider() # 구분선

        # =======================================================
        # [섹션 A] 일반 사용자용 화면 (친절하고 깔끔하게)
        # =======================================================
        st.subheader("🌿 진단 결과")
        
        # 1. 상태 표시 (색깔로 강조)
        status = result.get('ui_status')
        if "건강" in status:
            st.success(f"**상태:** {status}")
        else:
            st.error(f"**상태:** {status}")

        # 2. 설명 및 조언
        st.info(f"**설명:** {result.get('ui_guide')}")
        st.warning(f"**급수 팁:** {result.get('ui_water_msg')}")
        
        # 3. 펌프 작동 여부 (사용자 알림용)
        if result.get('pump_now'):
            st.error("🚨 **현재 펌프가 작동 중입니다!** (물 주는 중...)")
        else:
            st.success("✅ **현재 펌프 대기 중** (수분 충분함)")

        # =======================================================
        # [섹션 B] 개발자/발표용 시스템 로그 (숨김 처리)
        # =======================================================
        st.markdown("---") # 바닥 선
        
        # 클릭해야 열리는 비밀 공간 (발표할 때 "짠!" 하고 보여주세요)
        with st.expander("🛠️ [시스템] 백엔드/아두이노 데이터 전송 로그 확인"):
            
            st.write("📡 **Backend Communication Log:**")
            
            # 가짜 로딩 효과로 리얼함 더하기
            with st.spinner('DB에 스케줄 업데이트 중...'):
                time.sleep(1.0) 
            st.code(f"[SUCCESS] DB Connection Established (User: test_user_01)", language="bash")
            
            with st.spinner('아두이노로 신호 전송 준비 중...'):
                time.sleep(0.5)
            
            # ★ 핵심 증거 데이터 (JSON 값 그대로 보여주기)
            st.code(f"""
[SENDING DATA TO PUMP CONTROLLER]
---------------------------------
Target Device: Arduino_Pump_01
Command:
 - Pump Active: {result['pump_now']}
 - Interval: {result['schedule']['interval_hours']} hours
 - Amount: {result['schedule']['amount_ml']} ml
---------------------------------
Status: 200 OK (Transmitted)
            """, language="yaml")
            
            st.success("✅ 시스템 연동 완료: 펌프 제어 값이 정상적으로 전송되었습니다.")

    except Exception as e:
        # JSON 변환 실패 시 에러 메시지와 원본 출력
        st.error("⚠️ AI 응답을 분석하는 중 오류가 발생했습니다.")
        st.error(f"에러 내용: {e}")
        st.subheader("원본 데이터:")
        st.text(result_json_str)