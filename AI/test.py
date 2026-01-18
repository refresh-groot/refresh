import os 
import google.generativeai as genai 
from dotenv import load_dotenv 
import PIL.Image 
import json

# --- 환경 변수 로드 ---
load_dotenv("api.env") 
MY_KEY = os.getenv("GOOGLE_API_KEY") 
genai.configure(api_key=MY_KEY) 

# --- 모델 설정 (안전장치 포함) ---
# 최신 모델을 우선 시도하고, 안 되면 구버전(안정적)으로 자동 전환
try:
    model = genai.GenerativeModel('gemini-flash-latest')
except:
    model = genai.GenerativeModel('gemini-1.5-flash')


def get_plant_diagnosis(image_path, user_message, history):
    """
    Args:
        image_path: 이미지 경로 (없으면 None)
        user_message: 사용자 질문
        history: 이전 대화 기록 list [{"role": "user", "parts": [...]}, ...]
    """

    # 1. [핵심 복구] 이전 대화 기록을 텍스트로 복원 (기억력 주입)
    # 아까 코드엔 이 부분이 빠져 있어서 AI가 기억을 못했습니다.
    history_text = ""
    if history:
        history_text = "\n[이전 대화 내역 (참고용)]\n"
        for msg in history:
            role_name = "사용자" if msg['role'] == 'user' else "AI"
            # 내용이 리스트일 수도, 문자열일 수도 있어서 안전하게 처리
            content = msg['parts'][0] if isinstance(msg['parts'], list) else msg['parts']
            history_text += f"- {role_name}: {content}\n"

    # 2. 답변 형식 (JSON) 정의
    format_instruction = """
    반드시 다음 JSON 형식으로만 답해:
    {
        "ui_status": "상태 요약 (예: 물 부족, 건강함)",
        "ui_guide": "사용자에게 할 말 (친절하게, 2문장 이내)",
        "ui_water_msg": "물주기 팁 (1문장)",
        "pump_now": true 또는 false,
        "schedule": {"interval_hours": 0, "amount_ml": 0}
    }
    """

    # 3. 사용자 질문이 비어있을 때 기본 질문 설정
    if not user_message:
        user_message = "이 식물의 상태를 진단하고 관리 방법을 알려줘."

    # 4. 페르소나 및 시스템 프롬프트 조립
    # 여기서 {history_text}를 넣어줘야 AI가 아까 했던 말을 기억합니다.
    system_rules = f"""
    너는 '스마트 화분 AI'야.
    
    {history_text}

    현재 사용자 질문: "{user_message}"

    [행동 수칙]
    1. **문맥 파악**: 위 [이전 대화 내역]을 보고 대화를 자연스럽게 이어가.
    2. **사진 유무**: 사진이 없으면 사용자의 텍스트 묘사에 의존해서 추론해.
    3. **제어**: 식물이 위험해 보이면 'pump_now': true.
    
    {format_instruction}
    """

    inputs = []

    # 5. 사진 유무에 따른 분기 처리
    if image_path and os.path.exists(image_path):
        # 📸 Case A: 사진이 있는 경우
        try:
            with PIL.Image.open(image_path) as img_file:
                img = img_file.copy()
            
            # 프롬프트 + 이미지 같이 전송
            inputs = [system_rules, img]
            
        except Exception as e:
            return json.dumps({"ui_status": "이미지 오류", "ui_guide": "이미지 파일을 읽을 수 없습니다."})
    else:
        # 💬 Case B: 사진이 없는 경우 (텍스트 전용 모드)
        # 이미지 없이 텍스트만 리스트에 담아서 보냄
        # (주의: pump_now는 안전을 위해 false로 고정하라고 지시 추가)
        text_only_prompt = system_rules + "\n[추가 지시] 현재 사진이 제공되지 않았어. 사용자의 말만 듣고 상담해줘. pump_now는 false로 설정해."
        inputs = [text_only_prompt]

    # 6. AI 실행
    try:
        response = model.generate_content(inputs)
        result_text = response.text
        
        # JSON 포장지 벗기기
        if "```" in result_text:
            result_text = result_text.replace("```json", "").replace("```", "").strip()

        return result_text 
        
    except Exception as e:
        return json.dumps({"ui_status": "API 에러", "ui_guide": f"시스템 오류가 발생했습니다: {str(e)}"})