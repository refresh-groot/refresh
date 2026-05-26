from flask import Flask, request, jsonify
import os
import json
import re
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
# ==============================================================================
# 3. AI 진단 핵심 로직 (Gemini 2.5 Flash + 비서 프롬프트 버전)
# ==============================================================================
def get_plant_diagnosis(image_path, user_message, history, plant_species): 
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

    # ✨ [수정 1] ui_water_msg에 구체적인 작성 가이드라인(포맷)을 강제 주입
    # ✨ [수정 1] ui_guide의 분량을 늘리고, 내용을 통합하도록 지시
    # ✨ [수정 1] AI가 자유롭게 말하도록 족쇄를 풀고, JSON은 맨 뒤에 몰아서 출력하도록 지시
    format_instruction = """
    [답변 출력 규칙 - 매우 중요]
    1. 먼저 일반적인 채팅 비서처럼 다정하고 자유롭게 대답해. (사용자가 2가지 이상을 물어보면 문단을 나누어서 모두 길고 상세하게 대답해 줘!)
    2. 당신의 자유로운 텍스트 답변이 모두 끝난 후, **맨 마지막에만** 아두이노 제어 및 앱 UI 업데이트를 위한 아래 JSON 데이터를 딱 한 번 덧붙여.

    {
        "ui_status": "잎 마름 (물 부족)",
        "ui_water_msg": "3일에 한 번, 200ml 급수 (※ 상황상 굳이 필요 없으면 빈칸 처리)",
        "pump_now": true,
        "min_moisture": 30,
        "water_duration_ms": 2000
    }
    """

    # ✨ [수정 2] 복합 질문 대응과 상황에 맞는 물주기 처방 룰 추가
    system_rules = f"""
    당신은 '스마트 화분 AI'로 식물을 키우는 사람을 위한 다정한 '원예 비서'입니다.
    
    [사전 정보]
    - 사이드바 입력 식물 종: {plant_species} 
    
    {history_text}
    현재 사용자 질문: "{user_message}"
    
    [행동 수칙]
    1. **자유롭고 풍성한 대화**: 기계적인 요약은 피하고, 사용자가 여러 개(예: 진단 + 팁)를 한 번에 물어보면 문단을 나누어 모두 친절하게 답해. 길고 상세할수록 좋아! 이모지도 팍팍 써.
    2. **상황에 맞는 물주기 처방**: 매번 억지로 물주기 주기를 말할 필요 없어. 식물이 말라 보이거나, 사용자가 물주기에 대해 물어볼 때만 대화 흐름에 자연스럽게 녹여내.
    3. **사진 분석 최우선**: 새로운 사진이 들어왔다면 과거 대화보다 방금 들어온 사진의 시각적 증거를 관찰해서 가장 먼저 언급해.
    4. **[매우 중요] 예외 처리 (철벽 방어)**: 식물이 전혀 없는 사진이면 무조건 "인식 불가"로 세팅해. 억지로 꾸며내지 말고 "앗, 식물 사진이 아니네요 🥺"라고 부드럽게 거절해. 기기 오작동을 막기 위해 pump_now: false, water_duration_ms: 0 으로 강제 세팅해.
    5. **하드웨어 제어 데이터 (숨겨진 데이터)**: 정상적인 식물이고 급수가 필요한 상황이라면 아두이노가 읽을 수 있도록 제어용 숫자를 정확히 계산해.
    
    {format_instruction}
    """

    inputs = []
    
    if image_path and os.path.exists(image_path): 
        try:
            with PIL.Image.open(image_path) as img_file: 
                img = img_file.copy()
                # ✨ 제미나이에게도 "사진 들어왔다!"고 빨간불 경고문 강제 삽입
                alert_msg = "\n🚨[새로운 식물 사진이 방금 첨부되었습니다! 과거 대화보다 이 사진을 최우선으로 시각적 분석하세요!]🚨\n"
                inputs = [system_rules + alert_msg, img] 
        except Exception as e:                            
            return json.dumps({"ui_status": "오류", "ui_guide": f"이미지 처리 오류: {str(e)}"})
    else:
        # 사진 없을 때의 텍스트 모드 우회
        inputs = [system_rules + "\n[주의] 현재 사용자가 추가 사진을 올리지 않았습니다. 이전 대화 문맥과 텍스트만 보고 자연스럽게 이어가세요."]
        
    try:
        # 제미나이 2.5 Flash 호출 (자유도를 위해 temperature를 살짝 올림)
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=inputs,
            config={'temperature': 0.3} 
        )
        result_text = response.text                
        
        # [핵심 방어 로직] 정규식으로 텍스트 속에서 { } JSON 덩어리만 쏙 찾아내기
        match = re.search(r'\{.*\}', result_text, re.DOTALL)
        
        if match:
            json_str = match.group(0) # 찾아낸 순수 JSON 문자열
            
            # 전체 답변에서 JSON 덩어리를 지워 "자유로운 대화 내용"만 추출
            chat_text = result_text.replace(json_str, '').replace('```json', '').replace('```', '').strip()
            
            # 문자열을 파이썬 딕셔너리로 변환
            parsed_json = json.loads(json_str)
            
            # 프론트엔드로 보낼 최종 데이터 조립
            final_data = {
                "ui_status": parsed_json.get("ui_status", "진단 완료"),
                "ui_guide": chat_text if chat_text else "질문에 대한 답변입니다. 🌱", 
                "ui_water_msg": parsed_json.get("ui_water_msg", ""),
                "pump_now": parsed_json.get("pump_now", False),
                "min_moisture": parsed_json.get("min_moisture", 0),
                "water_duration_ms": parsed_json.get("water_duration_ms", 0)
            }
            return json.dumps(final_data)
            
        else:
            # ⭐ [수정 핵심 1] 사진이 없어서 AI가 JSON을 아예 빼먹었을 때의 방어선
            # 스트림릿에서 KeyError가 나지 않도록 모든 필수 키값을 기본값으로 채워줍니다.
            return json.dumps({
                "ui_status": "텍스트 답변",
                "ui_guide": result_text, # JSON이 없으므로 제미나이가 쓴 글 전체가 답변이 됩니다.
                "ui_water_msg": "사진이 첨부되지 않아 정확한 물주기 처방이 어렵습니다. 😥",
                "pump_now": False,
                "min_moisture": 0,
                "water_duration_ms": 0
            })
            
    except Exception as e:
        # ⭐ [수정 핵심 2] 시스템 에러가 발생했을 때도 스트림릿이 터지지 않도록 규격을 완벽히 맞춥니다.
        return json.dumps({
            "ui_status": "API 에러",
            "ui_guide": f"시스템 오류가 발생했습니다: {str(e)}",
            "ui_water_msg": "",
            "pump_now": False,
            "min_moisture": 0,
            "water_duration_ms": 0
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