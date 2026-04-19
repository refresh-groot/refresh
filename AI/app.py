from flask import Flask, request, jsonify
import os
import json
from google import genai       # 라이브러리 수정
from dotenv import load_dotenv
import PIL.Image

# ==============================================================================
# 1. 환경 변수 및 AI 설정
# ==============================================================================
load_dotenv("api.env", override=True)
MY_KEY = os.getenv("GOOGLE_API_KEY") 
client = genai.Client(api_key=MY_KEY) # 최신 클라이언트 방식 유지

# ==============================================================================
# 2. Flask 서버 및 폴더 설정
# ==============================================================================
app = Flask(__name__)

UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"📁 [System] 임시 업로드 폴더 생성됨: {UPLOAD_FOLDER}")

# ==============================================================================
# 3. AI 진단 핵심 로직
# ==============================================================================
# 매개변수에 plant_species 추가
def get_plant_diagnosis(image_path, user_message, history, plant_species): # 식물 종 추가
    history_text = ""
    try:
        if history:
            history_text = "\n[이전 대화 내역]\n"
            for msg in history:
                role = msg.get('role', '')
                is_user = msg.get('isUser', False)
                role_name = "사용자" if (role == 'user' or is_user) else "AI"
                
                content = msg.get('parts', '') or msg.get('text', '') or msg.get('message', '')
                if isinstance(content, list) and len(content) > 0:
                    content = content[0]
                    
                history_text += f"- {role_name}: {content}\n" 
    except Exception as e:
        print(f" [Warning] 대화 내역 파싱 무시됨: {e}")
        pass 

    # format_instruction (confidence 포함) 유지
    format_instruction = """
    반드시 다음 JSON 형식으로만 답해 (마크다운 없이).
    [주의] 아래 JSON의 값들은 구조를 보여주기 위한 단순 예시일 뿐입니다. 
    반드시 네가 직접 분석하고 추론한 실제 결과값(특히 confidence는 네가 계산한 0.0~1.0 사이의 숫자)으로 교체해서 응답해!
    
    {
        "ui_status": "상태 요약 (예: 물 부족, 건강함)",
        "ui_guide": "사용자에게 할 말 (친절하게, 3문장 이내)", 
        "ui_water_msg": "물주기 팁 (1문장)",
        "pump_now": true 또는 false,
        "schedule": {"interval_hours": 0, "amount_ml": 0},
        "confidence": 0
    }
    """

    if not user_message: 
        user_message = "이 식물의 상태를 진단하고 관리 방법을 알려줘."

    # 프롬프트에 plant_species 강력 주입
    system_rules = f"""
    당신은 '스마트 화분 AI'로 식물을 키우는 사람을 위한 진단 시스템 입니다.
    
    [사전 정보]
    - 진단할 식물의 종(품종): {plant_species}
    
    {history_text}
    현재 사용자 질문: "{user_message}"
    
    [행동 수칙]
    1. **식물 맞춤 진단**: 반드시 위 [사전 정보]의 식물 종({plant_species}) 특성을 바탕으로 사진과 질문을 분석해. 다른 식물로 착각하지 마.
    2. **문맥 파악**: 위 [이전 대화 내역]을 참고하여 자연스럽게 대화해.
    3. **사진 유무**: 사진이 없으면 사용자의 말에 의존해서 추론해.
    4. **제어**: 식물이 시들었거나 흙이 말랐다면 'pump_now': true.
    5. ui_guide 와 ui_water_msg 를 참고하여 질문에 대한 답을 자연스럽게 대답해줘.
    6. **[매우 중요]** 현재 주어진 정보(사진, 대화)로 판단했을 때 진단의 확신도를 `confidence`에 적어줘. 
    
    {format_instruction}
    """

    inputs = []
    
    if image_path and os.path.exists(image_path): 
        try:
            with PIL.Image.open(image_path) as img_file: 
                img = img_file.copy()
                inputs = [system_rules, img] 
        except Exception as e:                            
            return json.dumps({"ui_status": "오류", "ui_guide": f"이미지 처리 오류: {str(e)}"})
    else:
        inputs = [system_rules + "\n[주의] 사진이 없습니다. 텍스트로만 상담하고 pump_now는 false로 설정하세요."]
        
    try:
        # 최신 라이브러리 실행 코드 유지!
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=inputs
        )
        result_text = response.text                
        if "```" in result_text:
            result_text = result_text.replace("```json", "").replace("```", "").strip()
        return result_text 
    except Exception as e:
        return json.dumps({
            "ui_status": "API 에러", 
            "ui_guide": f"시스템 오류가 발생했습니다: {str(e)}"
        })

# ==============================================================================
# 4. API 엔드포인트 라우팅
# ==============================================================================
@app.route('/', methods=['GET'])
def health_check():
    return "✅ 스마트 화분 AI 서버가 정상적으로 켜져 있습니다! (Gemini 2.5 Flash 연결됨)"

@app.route('/predict', methods=['POST'])
def predict():                                   
    print("\n📸 [Flask] 새로운 진단 요청 도착!")
    image_path = None
    user_message = ""
    plant_species = "알 수 없는 식물" # 기본값
    history = []
    
    try:                                        
        if 'image' in request.files:
            file = request.files['image'] 
            if file.filename != '':                          
                temp_path = os.path.join(UPLOAD_FOLDER, file.filename)
                file.save(temp_path)                        
                image_path = temp_path                      
                print(f"   └─ 이미지 수신 완료: {file.filename}")
                
        req_json = request.get_json(silent=True) if request.is_json else None

        # 메세지 추출
        if request.form.get('message'):                                  
            user_message = request.form.get('message')
        elif req_json and 'message' in req_json: 
            user_message = req_json.get('message')               
            
        # Node.js에서 보낸 plant_species 추출
        if request.form.get('plant_species'):
            plant_species = request.form.get('plant_species')
        elif req_json and 'plant_species' in req_json:
            plant_species = req_json.get('plant_species')

        # 히스토리 추출
        raw_history = request.form.get('history') or (req_json.get('history') if req_json else None)                
        
        if raw_history:                                               
            if isinstance(raw_history, str):
                try:
                    history = json.loads(raw_history)
                except:
                    history = []                                      
            elif isinstance(raw_history, list):                               
                history = raw_history                                                 
                
        print(f"   └─ 타겟 식물: {plant_species}") # ✨ 어떤 식물인지 로그 출력
        print(f"   └─ 질문 내용: {user_message if user_message else '(질문 없음)'}")
        print(f"   └─ 이전 대화 개수: {len(history)}개")
        
        if image_path is None and not user_message:                      
            print("❌ [Error] 빈 요청입니다.")
            return jsonify({'error': '이미지 또는 질문을 보내주세요.'}), 400 
            
        print("🤖 [AI] 식물 상태 분석 시작...")
        # ✨ get_plant_diagnosis에 plant_species 전달
        result_json_str = get_plant_diagnosis(image_path, user_message, history, plant_species)                        
        
        try:
            result_data = json.loads(result_json_str)
        except json.JSONDecodeError:                                                                     
            result_data = {                                                  
                "ui_status": "데이터 오류",
                "ui_guide": "AI 응답을 해석하는 중 오류가 발생했습니다.",
                "raw_data": result_json_str
            }                                                                                         
            
        print(f"✅ [Success] 응답 전송 완료 (상태: {result_data.get('ui_status', 'Unknown')})")
        return jsonify(result_data)
        
    except Exception as e:                                     
        print(f"❌ [Server Error] {str(e)}")
        return jsonify({'error': str(e)}), 500                      
        
    finally:                               
        if image_path and os.path.exists(image_path):                        
            os.remove(image_path)                                            
            print("🧹 [Clean] 임시 이미지 파일 삭제 완료")

# ==============================================================================
# 5. 서버 실행부
# ==============================================================================
if __name__ == '__main__':
    print("🚀 [Start] 스마트 화분 Flask 서버가 실행되었습니다. (Port: 7860)")
    app.run(host='0.0.0.0', port=7860, debug=False) # 🔵 팀원분의 허깅페이스 포트 반영