import os                           #운영체제
import google.generativeai as genai #구글 AI 사용을 위한 라이브러리
from dotenv import load_dotenv      #env파일을 위한 라이브러리
import PIL.Image                    #이미지 읽어오는 라이브러리
import json                         #응답 처리 도구

#-------------------------------------------------------------------------------------------------------

# 1. 환경 변수 설정
load_dotenv("api.env", override=True) #방금 수정한 api.env 파일을 강제로 다시 읽음 -> api 수정 시 오류를 막기 위함
MY_KEY = os.getenv("GOOGLE_API_KEY") 
genai.configure(api_key=MY_KEY)        #api 키 받아오기

#-------------------------------------------------------------------------------------------------------

# 2. 모델 설정 (추후에 결제 연동하여 모델 다시 선정해야 할 수도 있음)
model = genai.GenerativeModel('gemini-flash-latest')
def get_plant_diagnosis(image_path, user_message, history):

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    # history (이전 대화내역 뽑아오기)
    history_text = ""
    if history:                                        #히스토리가 있으면
        history_text = "\n[이전 대화 내역]\n"           # 뽑아보기
        for msg in history:                            # 뽑아온게 사용자껀지 AI 인지 구분
            role_name = "사용자" if msg['role'] == 'user' else "AI"
            content = msg['parts'][0] if isinstance(msg['parts'], list) else msg['parts'] # 내용이 리스트인 경우와 문자열인 경우 처리
            history_text += f"- {role_name}: {content}\n" # 대화 내용을 한 줄씩 기록에 추가

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

    # 답변 형식 기틀 짜기 (JSON) 
    format_instruction = """
    반드시 다음 JSON 형식으로만 답해 (마크다운 없이):
    {
        "ui_status": "상태 요약 (예: 물 부족, 건강함)",
        "ui_guide": "사용자에게 할 말 (친절하게, 3문장 이내)", 
        "ui_water_msg": "물주기 팁 (1문장)",
        "pump_now": true 또는 false,
        "schedule": {"interval_hours": 0, "amount_ml": 0}
    }
    """
    if not user_message: #시용자가 문자 없이 사진만 올린 경우
        user_message = "이 식물의 상태를 진단하고 관리 방법을 알려줘."

    # 프롬프트 작성 (AI 교육 시키기) 
    system_rules = f"""
    당신은 '스마트 화분 AI'로 식물을 키우는 사람을 위한 진단 시스템 입니다.
    
    {history_text}

    현재 사용자 질문: "{user_message}"

    [행동 수칙]
    1. **문맥 파악**: 위 [이전 대화 내역]을 참고하여 자연스럽게 대화해.
    2. **사진 유무**: 사진이 없으면 사용자의 말에 의존해서 추론해.
    3. **제어**: 식물이 시들었거나 흙이 말랐다면 'pump_now': true.
    4. ui_guide 와 ui_water_msg 를 참고하여 질문에 대한 답을 자연스럽게 대답해줘.
    
    {format_instruction}
    """

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    inputs = []
    # 이미지 유무 확인
    if image_path and os.path.exists(image_path): #이미지가 있으면 시도하라.
        try:
            with PIL.Image.open(image_path) as img_file: #사진을 열어서 AI에게 보내라
                img = img_file.copy()
                inputs = [system_rules, img] #명령과 이미지를 리스트에 담는다
        except Exception as e:               #이미지를 읽을 수 없다면 오류 처리
            return json.dumps({"ui_status": "오류", "ui_guide": "이미지 파일을 읽을 수 없습니다."})
    else:
        # 사진 없음 -> 텍스트 모드 (펌프 작동 금지)
        inputs = [system_rules + "\n[주의] 사진이 없습니다. 텍스트로만 상담하고 pump_now는 false로 설정하세요."]

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    # --- AI 실행 (깔끔한 버전) ---
    try:
        response = model.generate_content(inputs) #구글에 요청을 보내 답을 받기
        result_text = response.text
        
        # AI가 가끔 ```json 같은 마크다운 기호를 붙여서 줄 때가 있음 -> 제거해서 순수 JSON만 남김
        if "```" in result_text:
            result_text = result_text.replace("```json", "").replace("```", "").strip()

        return result_text 

    except Exception as e:
        # API 오류(429 등)나 기타 시스템 오류가 발생했을 때 앱이 꺼지지 않도록 처리
        return json.dumps({
            "ui_status": "API 에러", 
            "ui_guide": f"시스템 오류가 발생했습니다: {str(e)}"
        })

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 