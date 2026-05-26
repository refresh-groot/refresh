#               테스트용 코드 (streamlit run dashboard.py)
import streamlit as st
import os
import json
from PIL import Image
# app.py에서 함수 가져오기
from app import get_plant_diagnosis 

st.set_page_config(page_title="식물 AI 챗봇", page_icon="🌿", layout="wide")

st.title("🌿 스마트 화분 AI - 지능형 센서 진단 테스트")
st.markdown("---")

# --- 세션 초기화 ---
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "uploaded_img_path" not in st.session_state:
    st.session_state.uploaded_img_path = None

# --- 함수: 진단 실행 ---
def run_diagnosis(user_input, img_path):
    st.session_state.chat_history.append({"role": "user", "parts": [user_input]})
    
    with st.spinner("AI가 식물과 센서 데이터를 분석 중입니다..."):
        # ✨ 사이드바에서 설정한 개별 센서값(None 포함)을 그대로 전달
        response_text = get_plant_diagnosis(
            img_path, 
            user_input, 
            st.session_state.chat_history, 
            user_plant_species,
            mock_moisture, 
            mock_light, 
            mock_temp, 
            mock_humid
        )
        
        st.session_state.chat_history.append({"role": "model", "parts": [response_text]})

# ==========================================
# 1. 사이드바: 설정 및 개별 센서 모킹(Mocking)
# ==========================================
with st.sidebar:
    st.header("⚙️ 일반 설정")
    if st.button("🗑️ 대화 기록 초기화", key="reset_chat_btn"):
        st.session_state.chat_history = []
        st.session_state.uploaded_img_path = None
        st.rerun()

    st.header("🌱 식물 정보")
    user_plant_species = st.text_input("어떤 식물인가요?", value="난", help="예: 난, 로즈마리, 다육이")
    
    st.markdown("---")
    
    # ✨ [핵심] 개별 가상 센서값 주입 컨트롤러
    st.header("🎛️ 가상 센서 개별 제어")
    st.info("체크된 센서의 값만 전송됩니다. 꺼두면 null로 처리되어 AI가 무시합니다.")
    
    # 1. 토양 수분
    use_moisture = st.checkbox("💧 토양 수분 켜기", value=True)
    if use_moisture:
        mock_moisture = st.slider("토양 수분 (%)", 0, 100, 15)
    else:
        mock_moisture = None

    # 2. 온도
    use_temp = st.checkbox("🌡️ 온도 켜기", value=True)
    if use_temp:
        mock_temp = st.slider("온도 (°C)", -10.0, 50.0, 22.5)
    else:
        mock_temp = None

    # 3. 조도
    use_light = st.checkbox("☀️ 조도 켜기", value=False)
    if use_light:
        mock_light = st.slider("조도 (lux)", 0, 2000, 500)
    else:
        mock_light = None
        
    # 4. 공기 습도
    use_humid = st.checkbox("☁️ 공기 습도 켜기", value=False)
    if use_humid:
        mock_humid = st.slider("공기 습도 (%)", 0, 100, 40)
    else:
        mock_humid = None

    st.markdown("---")
    
    st.header("📸 사진 업로드")
    uploaded_file = st.file_uploader("식물 사진을 올려주세요", type=['jpg', 'png', 'jpeg'])
    
    if uploaded_file is not None:
        if not os.path.exists("temp_dashboard"):
            os.makedirs("temp_dashboard")
        
        img_path = os.path.join("temp_dashboard", uploaded_file.name)
        with open(img_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        
        st.session_state.uploaded_img_path = img_path
        st.image(uploaded_file, caption='분석 대기 중...', use_column_width=True)
        st.success("사진 업로드 완료!")

# ==========================================
# 2. 메인 화면: 채팅 기록 표시
# ==========================================
for message in st.session_state.chat_history:
    role = message["role"]
    content = message["parts"][0]
    
    if role == "user":
        with st.chat_message("user"):
            st.write(content)
    else:
        with st.chat_message("assistant"):
            try:
                json_data = json.loads(content)
                status = json_data.get("ui_status", "")
                if "주의" in status or "부족" in status or "위험" in status:
                    st.error(f"상태: {status}")
                elif "건강" in status or "완료" in status or "유지" in status:
                    st.success(f"상태: {status}")
                else:
                    st.info(f"상태: {status}")
                
                st.write(json_data.get("ui_guide", "응답 없음"))
                
                with st.expander("📊 아두이노/UI 제어 데이터 (JSON)"):
                    st.json(json_data)
            except:
                st.write(content)

# ==========================================
# 3. 사진만으로 바로 진단 (빠른 실행)
# ==========================================
if st.session_state.uploaded_img_path:
    if st.button("🚀 사진 + 센서 데이터로 바로 진단하기", type="primary", use_container_width=True):
        run_diagnosis("현재 식물과 환경 상태를 종합적으로 진단해줘.", st.session_state.uploaded_img_path)
        st.rerun()

# ==========================================
# 4. 하단 채팅 입력창
# ==========================================
if user_input := st.chat_input("궁금한 점을 물어보세요... (예: 지금 온도가 적당한가요?)"):
    run_diagnosis(user_input, st.session_state.uploaded_img_path)
    st.rerun()