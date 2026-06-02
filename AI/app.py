from flask import Flask, request, jsonify
import os
import json
import re
from google import genai       
from dotenv import load_dotenv
import PIL.Image

# ==============================================================================
# 1. 환경 변수 및 AI 설정
# ==============================================================================
load_dotenv("api.env", override=True)
MY_KEY = os.getenv("GOOGLE_API_KEY") 
client = genai.Client(api_key=MY_KEY)

app = Flask(__name__)

UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"📁 [System] 임시 업로드 폴더 생성됨: {UPLOAD_FOLDER}")

# ==============================================================================
# 3. AI 진단 핵심 로직
# ==============================================================================
# 파라미터 이름을 바뀐 데이터에 맞게 직관적으로 수정 (moisture_level -> soil 등)
def get_plant_diagnosis(image_path, user_message, history, plant_species, soil=None, light=None, temp=None, water_level=None): 
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
        pass 

    # 값이 없으면 빼는게 아니라 "데이터 없음"으로 강제 명시하여 과거 기억 차단!
    def format_sensor(val, unit):
        if val is not None and val != "":
            return f"{val}{unit}"
        return "데이터 없음 (센서 연결 끊김)"

    # AI가 인식할 센서 이름도 변경 ('공기 습도' -> '물탱크 물 잔량')
    sensor_lines = [
        f"- 토양 수분: {format_sensor(soil, '%')}",
        f"- 현재 조도: {format_sensor(light, ' lux')}",
        f"- 주변 온도: {format_sensor(temp, '°C')}",
        f"- 물탱크 물 잔량: {format_sensor(water_level, '%')} (주의: 공기 습도가 아님!)"
    ]

    sensor_info_text = "\n[하드웨어 실시간 센서 측정값 (현재 시점)]\n" + "\n".join(sensor_lines)
    sensor_info_text += "\n* 🚨 [강제 주의사항]: '데이터 없음'이라고 표기된 센서는 통신이 끊긴 상태입니다. 절대 과거 수치로 현재 상태를 유추하지 말고, 해당 센서값은 '알 수 없음'으로 취급하세요.\n"

    format_instruction = """
    [답변 출력 규칙 - 매우 중요]
    1. 불필요한 인사말("안녕하세요", "반갑습니다")과 맺음말("감사합니다")은 **절대 쓰지 마.**
    2. 답변 길이는 **정확히 2개의 문단**으로 구성하고, 전체 분량은 4~5문장 내외로 작성해 줘. 
       - 첫 번째 문단: [핵심 답변] 사용자의 질문(상태 진단, 식물 이름, 단순 질문 등)에 대한 명확하고 직접적인 결론
       - 두 번째 문단: [부연 설명] 결론에 대한 이유, 구체적인 방법, 또는 관련된 유용한 추가 팁
    3. 텍스트 답변이 모두 끝난 후, **맨 마지막에만** 아두이노 제어를 위한 JSON 데이터를 딱 한 번 덧붙여. 
    🚨[경고] JSON 안의 값(value)은 절대 고정된 숫자를 쓰지 마! 반드시 최종 판단된 식물의 특성을 분석해서 **네가 직접 계산한 진짜 수치**로 빈칸을 채워 넣어!

    ```json
    {
        "ui_status": "<현재 상태 요약 (짧은 문자열, 예: 양호, 수분 부족, 인식 불가)>",
        "min_moisture": <해당 식물에 맞는 토양 수분 하한선 (정수형 숫자, 예: 15~50 사이)>,
        "water_duration_ms": <1회 급수에 적절한 펌프 가동 시간 (정수형 숫자, 예: 1000~5000 사이)>
    }
    ```
    """

    system_rules = f"""
    당신은 '지능형 식물 진단 시스템'에서 식물을 키우는 사람을 돕는 '원예 비서'입니다. 군더더기 없이 **사용자가 궁금해하는 핵심 답변과 유용한 조언을 딱 2문단으로 깔끔하게 정리해 주는 전문가**입니다.
    
    [사전 정보]
    - 대상 식물 종: {plant_species} 
    {sensor_info_text}
    
    {history_text}
    현재 사용자 질문: "{user_message}"
    
    [행동 수칙]
    1. **핑계 및 환각(Hallucination) 절대 금지 (가장 중요)**: 
       - 대화 시작 시 인사말 없이 바로 본론으로 들어가.
       - 사진이나 센서값이 없더라도 **"사진이 없어서~", "센서값을 알 수 없지만~" 같은 핑계나 안내 문구를 단 한 글자도 쓰지 마!**
       - 🚨 **[조건부 환각 방지]: 실제 사진이 첨부되지 않은 상황에서는 절대 사진을 보고 있는 것처럼 꾸며내지 마 (예: "사진을 보니 난초로 보이며..." 금지). 이때는 사전 정보({plant_species})와 사용자 텍스트에만 의존해.**
       - **답변은 질문의 의도를 파악하여 반드시 2문단(1문단: 핵심 결론, 2문단: 부연 설명)의 틀을 유지해.**
    2. **적절한 선 지키기**: 묻지 않은 뜬금없는 주제(TMI)로 빠지지 말고 딱 물어본 것에 대한 정답만 제공해.
    3. **하드웨어 제어 데이터 (항상 출력)**: 최종 파악된 식물 종에 맞는 최적의 토양 수분 하한선(`min_moisture`)과 1회 급수 시간(`water_duration_ms`)을 계산해서 JSON에 포함해.
    4. **사진 분석 최우선 (시각적 오버라이드)**: 
       - **사용자가 사진을 첨부했다면, 사전 정보({plant_species})보다 사진의 시각적 증거를 최우선으로 믿고 분석해!** - 만약 {plant_species}가 "알 수 없는 식물"이거나 사진과 다르다면, 네가 직접 사진을 분석해 식물 종을 파악하고 대답해야 해. (단, 식물이 전혀 없는 사진이면 "인식 불가"로 세팅하고 부드럽게 거절할 것)
    
    {format_instruction}
    """

    inputs = []
    
    if image_path and os.path.exists(image_path): 
        try:
            with PIL.Image.open(image_path) as img_file: 
                img = img_file.copy()
                alert_msg = "\n🚨[새로운 식물 사진이 첨부됨! 이 사진을 최우선으로 시각적 분석하세요!]🚨\n"
                inputs = [system_rules + alert_msg, img] 
        except Exception as e:                            
            return json.dumps({"ui_status": "오류", "ui_guide": f"이미지 처리 오류: {str(e)}"})
    else:
        inputs = [system_rules + "\n[주의] 사진 없음. 이전 문맥 및 센서/텍스트 데이터만 보고 자연스럽게 이어가세요."]
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=inputs,
            config={'temperature': 0.3} 
        )
        result_text = response.text                
        
        match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if match:
            json_str = match.group(0) 
            chat_text = result_text.replace(json_str, '').replace('```json', '').replace('```', '').strip()
            parsed_json = json.loads(json_str)
            
            final_data = {
                "ui_status": parsed_json.get("ui_status", "진단 완료"),
                "ui_guide": chat_text if chat_text else "질문에 대한 답변입니다. 🌱", 
                "min_moisture": parsed_json.get("min_moisture", 0),
                "water_duration_ms": parsed_json.get("water_duration_ms", 0)
            }
            return json.dumps(final_data)
            
        else:
            return json.dumps({
                "ui_status": "텍스트 답변",
                "ui_guide": result_text, 
                "ui_water_msg": "데이터 파싱 실패",
                "pump_now": False,
                "min_moisture": 0,
                "water_duration_ms": 0
            })
            
    except Exception as e:
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
    plant_species = "알 수 없는 식물" 
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

        # 파라미터 안전 추출 헬퍼 함수
        def get_param(key):
            val = request.form.get(key)
            if not val and req_json: val = req_json.get(key)
            return val

        user_message = get_param('message') or ""
        plant_species = get_param('plant_species') or "알 수 없는 식물"
        
        # 🚨 [핵심 수정 구간] 팀원이 쏴주는 실제 변수명으로 쏙쏙 뽑아냅니다!
        soil = get_param('soil')
        light = get_param('light')
        temp = get_param('temp')
        # humid라는 이름으로 들어오지만 우리는 물탱크 잔량(water_level)으로 씁니다!
        water_level = get_param('humid') 

        raw_history = get_param('history')                
        if raw_history:                                               
            if isinstance(raw_history, str):
                try: history = json.loads(raw_history)
                except: history = []                                      
            elif isinstance(raw_history, list):                               
                history = raw_history                                                                                                              
                
        print(f"   └─ 타겟 식물: {plant_species}") 
        print(f"   └─ 수분:{soil}% | 조도:{light}lux | 온도:{temp}°C | 물잔량:{water_level}%")
        
        if image_path is None and not user_message:                      
            print("❌ [Error] 빈 요청입니다.")
            return jsonify({'error': '이미지 또는 질문을 보내주세요.'}), 400 
            
        print("🤖 [AI] 식물 상태 분석 시작...")
        
        # 수정된 변수들을 함수로 전달
        result_json_str = get_plant_diagnosis(
            image_path, user_message, history, plant_species, 
            soil, light, temp, water_level
        )                        
        
        try:
            result_data = json.loads(result_json_str)
        except json.JSONDecodeError:                                                                   
            result_data = {                                  
                "ui_status": "데이터 오류",
                "ui_guide": "AI 응답을 해석하는 중 오류가 발생했습니다."
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

if __name__ == '__main__':
    print("🚀 [Start] 스마트 화분 Flask 서버가 실행되었습니다. (Port: 7860)")
    app.run(host='0.0.0.0', port=7860, debug=False)