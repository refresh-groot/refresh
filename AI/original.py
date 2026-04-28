from flask import Flask, request, jsonify
import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

# ==============================================================================
# 1. 환경 변수 및 AI 설정
# ==============================================================================
load_dotenv("api.env", override=True)
MY_KEY = os.getenv("OPENAI_API_KEY")     
client = OpenAI(api_key=MY_KEY)          

# ==============================================================================
# 2. Flask 서버 및 폴더 설정
# ==============================================================================
app = Flask(__name__)

UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"📁 [System] 임시 업로드 폴더 생성됨: {UPLOAD_FOLDER}")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# ==============================================================================
# 3. AI 진단 핵심 로직 (시각적 분석 강제 프롬프트 적용)
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
        pass 

    # ✨ [수정 1] ui_water_msg에 구체적인 작성 가이드라인(포맷)을 강제 주입
    # ✨ [수정 1] ui_guide의 분량을 늘리고, 내용을 통합하도록 지시
    format_instruction = """
    반드시 다음 JSON 형식으로만 답해 (마크다운 없이).
    {
        "ui_status": "상태 요약 (예: 건강함, 잎 마름, 물 부족 등)",
        "ui_guide": "사용자에게 보내는 최종 답변 (친절하고 따뜻하게, 4~5문장으로 상세히 작성)", 
        "ui_water_msg": "물주기 요약 (OO일에 한 번, OOml)",
        "pump_now": true 또는 false,
        "min_moisture": 30, 
        "water_duration_ms": 2000, 
        "care_tip": "식물 맞춤형 관리 팁 (1문장)",
        "confidence": 0.0
    }
    """

    # ✨ [수정 2] 행동 수칙에서 '상세 답변'과 '예외 처리'를 더 강력하게 결합
    system_rules = f"""
    당신은 '스마트 화분 AI'로 식물을 키우는 사람을 위한 다정한 '원예 비서'입니다.
    
    [사전 정보]
    - 사이드바 입력 식물 종: {plant_species} 
    
    {history_text}
    현재 사용자 질문: "{user_message}"
    
    [행동 수칙 - 상용화 & 감성 모드]
    1. **다정하고 풍성한 대화 (ui_guide)**: 
       - 기계적인 요약이나 매번 똑같은 패턴의 문장은 피하고, 매 대화마다 조금씩 다른 어휘와 뉘앙스를 사용해.
       - 사진 속 식물의 상태에 따라 감정을 담아 공감해 (예: 아파 보이면 걱정해주고, 건강하면 기뻐해 주기).
       - 너무 짧게 끝나지 않도록 **4~5문장 정도의 충분한 분량**으로 작성하고, 대화 중간에 이모지(🌱, 💧, 🪴, 😥 등)를 자연스럽게 섞어 써.
    2. **자연스러운 물주기 처방 통합**:
       - 'OO일에 한 번씩 OOml를 주세요'라는 구체적인 처방을 반드시 **`ui_guide` 본문의 대화 흐름 속에 부드럽게 녹여내어 포함**시켜.
    3. **사진 분석 최우선**:
       - 새로운 사진이 들어왔다면 과거 대화보다 방금 들어온 사진의 시각적 증거를 관찰해서 가장 먼저 언급해.
    4. **[매우 중요] 식물이 아닌 사진 예외 처리 (철벽 방어)**:
       - 사람, 동물, 책상 등 식물이 전혀 없는 사진이 들어오면 무조건 `ui_status`를 "인식 불가"로 세팅해.
       - 억지로 꾸며내지 말고, `ui_guide`에 "앗, 이건 식물 사진이 아닌 것 같아요! 예쁜 화분 사진을 다시 올려주시면 열심히 살펴볼게요 🥺" 처럼 부드럽게 거절해.
       - 기기(펌프) 오작동을 막기 위해 반드시 `pump_now`: false, `min_moisture`: 0, `water_duration_ms`: 0 으로 강제 세팅해.
    5. **하드웨어 제어 데이터 (숨겨진 데이터)**: 
       - 정상적인 식물일 경우, `min_moisture`와 `water_duration_ms`는 아두이노가 읽을 수 있도록 정확히 계산해.
    
    {format_instruction}
    """

    messages = [
        {"role": "system", "content": system_rules}
    ]
    user_content = [{"type": "text", "text": user_message}]

    # ✨ [핵심 수정 2] 질문 텍스트 앞단에 아예 대문짝만하게 [새 사진 업로드됨] 딱지를 붙여버림!
    if image_path and os.path.exists(image_path): 
        try:
            base64_image = encode_image(image_path)
            mime_type = "image/png" if image_path.lower().endswith('.png') else "image/jpeg"
            
            # AI가 절대 사진을 무시하지 못하도록 사용자 질문 앞에 태그 강제 주입
            user_content[0]["text"] = "🚨[새로운 식물 사진이 방금 첨부되었습니다! 과거 대화보다 이 사진을 최우선으로 시각적 분석하세요!]🚨\n" + user_content[0]["text"]
            
            user_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            })
        except Exception as e:                            
            return json.dumps({"ui_status": "오류", "ui_guide": f"이미지 처리 오류: {str(e)}"})
    else:
        user_content[0]["text"] += "\n[주의] 현재 사용자가 추가 사진을 올리지 않았습니다. 이전 대화 문맥과 텍스트만 보고 자연스럽게 이어가세요."
        
    messages.append({"role": "user", "content": user_content})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.2 
        )
        
        result_text = response.choices[0].message.content
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
    return "✅ 스마트 화분 AI 서버가 정상적으로 켜져 있습니다! (GPT-4o-mini 연결됨)"

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

        if request.form.get('message'):                                  
            user_message = request.form.get('message')
        elif req_json and 'message' in req_json: 
            user_message = req_json.get('message')               
            
        if request.form.get('plant_species'):
            plant_species = request.form.get('plant_species')
        elif req_json and 'plant_species' in req_json:
            plant_species = req_json.get('plant_species')

        raw_history = request.form.get('history') or (req_json.get('history') if req_json else None)                
        
        if raw_history:                                               
            if isinstance(raw_history, str):
                try:
                    history = json.loads(raw_history)
                except:
                    history = []                                      
            elif isinstance(raw_history, list):                               
                history = raw_history                                                                
                
        print(f"   └─ 타겟 식물: {plant_species}") 
        print(f"   └─ 질문 내용: {user_message if user_message else '(질문 없음)'}")
        print(f"   └─ 이전 대화 개수: {len(history)}개")
        
        if image_path is None and not user_message:                      
            print("❌ [Error] 빈 요청입니다.")
            return jsonify({'error': '이미지 또는 질문을 보내주세요.'}), 400 
            
        print("🤖 [AI] 식물 상태 분석 시작...")
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

if __name__ == '__main__':
    print("🚀 [Start] 스마트 화분 Flask 서버가 실행되었습니다. (GPT-4o-mini, Port: 7860)")
    app.run(host='0.0.0.0', port=7860, debug=False)