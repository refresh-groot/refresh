from flask import Flask, request, jsonify # 웹 서버 구축
import os                                 # 운영체제/파일 경로 관리
import json                               # 데이터 형식 변환
from google import genai       # 구글 AI 사용을 위한 라이브러리
from dotenv import load_dotenv            # env파일을 위한 라이브러리
import PIL.Image                          # 이미지 읽어오는 라이브러리

# ==============================================================================
# 1. 환경 변수 및 AI 설정
# ==============================================================================
load_dotenv("api.env", override=True) # 방금 수정한 api.env 파일을 강제로 다시 읽음
MY_KEY = os.getenv("GOOGLE_API_KEY") 
client = genai.Client(api_key=MY_KEY)        # api 키 받아오기

# ==============================================================================
# 2. Flask 서버 및 폴더 설정
# ==============================================================================
app = Flask(__name__)                    # Flask 서버 생성

# 사용자로부터 받은 이미지를 잠시 저장할 폴더 설정
UPLOAD_FOLDER = 'temp_uploads'    # 폴더 이름
if not os.path.exists(UPLOAD_FOLDER): # 없다면 
    os.makedirs(UPLOAD_FOLDER)        # 새로 만들기
    print(f"📁 [System] 임시 업로드 폴더 생성됨: {UPLOAD_FOLDER}")

# ==============================================================================
# 3. AI 진단 핵심 로직 (기존 test.py의 내용)
# ==============================================================================
def get_plant_diagnosis(image_path, user_message, history):
    # history (이전 대화내역 뽑아오기)
    history_text = ""
    if history:                                        # 히스토리가 있으면
        history_text = "\n[이전 대화 내역]\n"           # 뽑아보기
        for msg in history:                            # 뽑아온게 사용자껀지 AI 인지 구분
            role_name = "사용자" if msg['role'] == 'user' else "AI"
            content = msg['parts'][0] if isinstance(msg['parts'], list) else msg['parts'] # 내용이 리스트/문자열인 경우 처리
            history_text += f"- {role_name}: {content}\n" # 대화 내용을 한 줄씩 기록에 추가

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
    if not user_message: # 사용자가 문자 없이 사진만 올린 경우
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

    inputs = []
    # 이미지 유무 확인
    if image_path and os.path.exists(image_path): # 이미지가 있으면 시도하라.
        try:
            with PIL.Image.open(image_path) as img_file: # 사진을 열어서 AI에게 보내라
                img = img_file.copy()
                inputs = [system_rules, img] # 명령과 이미지를 리스트에 담는다
        except Exception as e:               # 이미지를 읽을 수 없다면 오류 처리
            return json.dumps({"ui_status": "오류", "ui_guide": "이미지 파일을 읽을 수 없습니다."})
    else:
        # 사진 없음 -> 텍스트 모드 (펌프 작동 금지)
        inputs = [system_rules + "\n[주의] 사진이 없습니다. 텍스트로만 상담하고 pump_now는 false로 설정하세요."]

    # --- AI 실행 (깔끔한 버전) ---
    try:
        # 새 라이브러리 방식으로 요청 보내기 (여기서 모델 이름을 지정합니다)
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=inputs
        )
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

# ==============================================================================
# 4. API 엔드포인트 라우팅 (기존 app.py의 내용)
# ==============================================================================
# 누군가 'http://주소:5000/predict'로 'POST' 요청을 보내면 이 함수를 실행
@app.route('/predict', methods=['POST'])
def predict():                                   
    """
    [API 엔드포인트] /predict
    - Node.js나 프론트엔드에서 이 주소로 데이터를 보냄
    - 입력: 이미지 파일 (image), 사용자 질문 (message), 대화 기록 (history)
    - 출력: AI 진단 결과 (JSON)
    """
    print("\n📸 [Flask] 새로운 진단 요청 도착!")

    image_path = None                   # 변수 초기화 (일단 비어있는 상태로 시작)
    user_message = ""
    history = []

    try:                                # 이미지 데이터 수신                             
        if 'image' in request.files:    # 요청(request) 안에 'image'라는 이름의 파일이 있는지 확인
            file = request.files['image'] 
            if file.filename != '':     # 그게 정상 파일이라면
                temp_path = os.path.join(UPLOAD_FOLDER, file.filename) # 'temp_uploads/파일명.jpg' 경로 생성
                file.save(temp_path)    # 실제로 컴퓨터에 파일 저장 (AI가 읽을 수 있게)
                image_path = temp_path  # 저장된 경로를 변수에 기록
                print(f"   └─ 이미지 수신 완료: {file.filename}")

        # 텍스트, 히스토리 데이터 수신
        # 1. 질문(message) 추출
        if request.form.get('message'):                  # form 데이터 확인
            user_message = request.form['message']
        elif request.json and 'message' in request.json: # json 데이터 확인
            user_message = request.json['message']       

        # 2. 대화 기록(history) 추출 (Node.js에서 보내준다면)
        raw_history = request.form.get('history') or (request.json.get('history') if request.json else None)
        
        if raw_history:                               # 문자열로 왔으면 
            if isinstance(raw_history, str):
                try:
                    history = json.loads(raw_history) # JSON으로 변환
                except:
                    history = []                      # 파싱 실패 시 빈 리스트
            elif isinstance(raw_history, list):       # 이미 리스트로 왔으면 
                history = raw_history                 # 그대로 사용
                
        # 잘 받았는지 로그 출력
        print(f"   └─ 질문 내용: {user_message if user_message else '(질문 없음)'}")
        print(f"   └─ 이전 대화 개수: {len(history)}개")

        # 유효성 검사
        if image_path is None and not user_message:     # 사진도 없고 질문도 없으면
            print("❌ [Error] 빈 요청입니다.")
            return jsonify({'error': '이미지 또는 질문을 보내주세요.'}), 400 

        # AI 분석 실행 (핵심) 
        print("🤖 [AI] 식물 상태 분석 시작...")
        result_json_str = get_plant_diagnosis(image_path, user_message, history) # 결과를 받아오기
        
        # 결과 정리 및 반환
        try:
            result_data = json.loads(result_json_str)  # 결과를 json 으로 변환 시도
        except json.JSONDecodeError:                                         
            result_data = {                            # 혹시라도 JSON 변환에 실패했을 경우를 대비한 안전장치
                "ui_status": "데이터 오류",
                "ui_guide": "AI 응답을 해석하는 중 오류가 발생했습니다.",
                "raw_data": result_json_str
            }                                              
        print(f"✅ [Success] 응답 전송 완료 (상태: {result_data.get('ui_status', 'Unknown')})")
        return jsonify(result_data)                    # 최종 결과를 JSON 형태로 전송

    except Exception as e:                             # 서버 내부에서 예상치 못한 에러가 터졌을 때 
        print(f"❌ [Server Error] {str(e)}")
        return jsonify({'error': str(e)}), 500         
    
    # 뒷정리: 임시로 저장한 이미지는 반드시 삭제
    finally:               
        if image_path and os.path.exists(image_path):    
            os.remove(image_path)                        
            print("🧹 [Clean] 임시 이미지 파일 삭제 완료")

# ==============================================================================
# 5. 서버 실행부
# ==============================================================================
if __name__ == '__main__':
    # host='0.0.0.0': 내 컴퓨터뿐만 아니라 같은 와이파이/네트워크에 있는 다른 기기 접속 허용
    print("🚀 [Start] 스마트 화분 Flask 서버가 실행되었습니다. (Port: 5000)")
    app.run(host='0.0.0.0', port=5000)