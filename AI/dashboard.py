# --------------------------------------------------------------------------
#               테스트용 코드 (streamlit run dashboard.py)
# --------------------------------------------------------------------------

import streamlit as st
import os
import json
from PIL import Image
# main.py에서 함수 가져오기
from main import get_plant_diagnosis 

st.set_page_config(page_title="식물 AI 챗봇", page_icon="🌿", layout="wide")

st.title("🌿 스마트 화분 AI - 기억력 테스트")
st.markdown("---")

# --- 세션 초기화 ---
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "uploaded_img_path" not in st.session_state:
    st.session_state.uploaded_img_path = None

# --- 함수: 진단 실행 ---
def run_diagnosis(user_input, img_path):
    # 1. 사용자 질문 기록 (사진만 보낸 경우도 텍스트로 남겨둠)
    st.session_state.chat_history.append({"role": "user", "parts": [user_input]})
    
    # 2. AI 호출
    with st.spinner("AI가 식물을 분석 중입니다..."):
        # test.py의 함수가 (이미지, 질문, 히스토리)를 받도록 되어 있어야 함
        response_text = get_plant_diagnosis(img_path, user_input, st.session_state.chat_history)
        
        # 3. AI 답변 기록
        st.session_state.chat_history.append({"role": "model", "parts": [response_text]})

# ==========================================
# 1. 사이드바: 설정 및 사진 업로드
# ==========================================
with st.sidebar:
    st.header("⚙️ 설정")
    if st.button("🗑️ 대화 기록 초기화"):
        st.session_state.chat_history = []
        st.session_state.uploaded_img_path = None
        st.rerun()

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
                # 상태 표시
                status = json_data.get("ui_status", "")
                if "주의" in status or "부족" in status:
                    st.error(f"상태: {status}")
                elif "건강" in status:
                    st.success(f"상태: {status}")
                else:
                    st.info(f"상태: {status}")
                
                # 가이드 메시지
                st.write(json_data.get("ui_guide", "응답 없음"))
                
                # 상세 데이터 (접이식)
                with st.expander("📊 상세 분석 데이터 (JSON)"):
                    st.json(json_data)
            except:
                st.write(content)

# ==========================================
# 3. [핵심] 사진만 바로 진단하는 버튼 (채팅창 바로 위)
# ==========================================
# 사진은 있는데, 아직 아무 대화도 안 했을 때 or 사진을 새로 올렸을 때 편하게 누르라고 버튼 노출
if st.session_state.uploaded_img_path:
    # 팁: 채팅창 바로 위에 버튼을 둬서 접근성 높임
    if st.button("🚀 사진만으로 바로 진단하기 (클릭)", type="primary", use_container_width=True):
        run_diagnosis("이 식물의 상태를 진단해줘.", st.session_state.uploaded_img_path)
        st.rerun()

# ==========================================
# 4. 하단 채팅 입력창
# ==========================================
# (참고: 여기에 글자를 안 쓰면 전송 버튼이 안 눌리는 건 Streamlit의 고정된 특징입니다 ㅠㅠ)
if user_input := st.chat_input("궁금한 점을 물어보세요... (예: 물은 언제 줘?)"):
    run_diagnosis(user_input, st.session_state.uploaded_img_path)
    st.rerun()