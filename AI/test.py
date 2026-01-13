import os #내 컴퓨터를 빌려쓰는 코드
import google.generativeai as genai #제미나이 통신 라이브러리
from dotenv import load_dotenv #env 파일을 열기 위한s
import PIL.Image #이미지 읽기

#API 설정
load_dotenv("api.env") #API 코드 받아오기
MY_KEY = os.getenv("GOOGLE_API_KEY") #API 코드 적용
genai.configure(api_key=MY_KEY) #API 를 제미나이에 적용

#모델 설정
model=genai.GenerativeModel('gemini-flash-latest')

def get_plant_diagnosis(image_path, chat_history=[]):
    """
    image_path: 사진 파일 경로
    chat_history: 지금까지의 대화 기록 (리스트 형태)
    """
    try:
        img = PIL.Image.open(image_path)
        
        # 3. 과거 기록이 있으면 기억을 되살림 (start_chat 사용!)
        chat = model.start_chat(history=chat_history)
        
        # 4. 질문 던지기 (채팅 모드에서는 send_message를 씀)
        Q = """
        당신은 스마트팜 자동 제어 AI입니다. 
        제공된 사진을 정밀 분석하여 식물의 상태를 진단하고, 물 주기 스케줄을 결정하세요.

        결과는 반드시 아래 **JSON 형식**으로만 출력하세요. (설명글 금지)

        {
          "ui_status": "상태 요약 (예: 건강함 / 건조함 / 과습 / 병충해)",
          "ui_guide": "사용자 관리 가이드 (한국어, 2문장 이내. 예: 잎이 처져 있으니 통풍에 신경 써주세요.)",
          "ui_water_msg": "물 주기 스케줄 요약 (한국어 1줄. 예: '하루 1회 200ml 급수' 또는 '4시간마다 50ml 집중 급수')",
          "pump_now": true 또는 false, (지금 당장 펌프 작동이 필요하면 true)
          "schedule": {
              "interval_hours": 숫자, (몇 시간 간격인지 정수. 0이면 중단)
              "amount_ml": 숫자 (1회 급수량 ml 정수)
          }
        }
        
        [판단 기준]
        - 심각한 건조: interval_hours 짧게(4~6), amount_ml 적게, ui_water_msg에 '집중 케어' 언급. 
        - 건강함: interval_hours 길게(24~48), amount_ml 넉넉히, ui_water_msg에 '유지 관리' 언급.
        - 과습: interval_hours 0, ui_water_msg에 '급수 중단' 언급.

        주의사항:
        1. 반드시 순수한 JSON 문자열 하나만 출력하세요.
        2. 마크다운(```json)이나 기타 설명은 절대 붙이지 마세요.
        3. 중복해서 출력하지 말고, 딱 한 번만 출력하고 종료하세요.
        """
        response = chat.send_message([Q, img])
        
        return response.text  # 결과를 백엔드에게 돌려줌 (return)

    except Exception as e:
        return f"에러 발생: {e}"
    
#!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!테스트용 코드!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
#!!!!!!!!!!!!!!!!!!!!!!!보험용 코드이니 건들지도 말것!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
if __name__ == "__main__":
    img_path = os.path.join("img", "nanbad.jpg") # 테스트용 사진

    print("--- 🎬 [상황 1] 첫 번째 질문 (기억 없음) ---")
    
    # 1. 빈 리스트([])를 넣어서 보냄 -> AI는 첫 만남이라고 생각함
    history_step_1 = [] 
    
    print("사용자: 난초에 물을 어제 줬어. (라고 말했다고 치자)")

    history_step_2 = [
        {"role": "user", "parts": ["이 난초에 어제 물을 종이컵 한 컵 줬어."]},
        {"role": "model", "parts": ["네, 알겠습니다. 어제 물을 주셨군요."]}
    ]
    
    print("\n--- 🎬 [상황 2] 두 번째 질문 (기억을 가지고 질문!) ---")
    print(f"👉 AI에게 주입할 기억: {history_step_2}")
    
    # 여기서 'history_step_2'를 넣어주는 게 핵심!
    result = get_plant_diagnosis(img_path, chat_history=history_step_2)
    
    print("\n✅ AI의 답변 결과:")
    print(result)