from flask import Flask, request, jsonify #웹 서버 구축
import os                                 #파일 경로 관리
import json                               #데이터 형식 변환
from test import get_plant_diagnosis      #AI 진단 모듈 가져오기
app = Flask(__name__)                     #Flask 서버 생성

#------------------------------------------------------------------------------------------------------

# 사용자로부터 받은 이미지를 잠시 저장할 폴더 설정
UPLOAD_FOLDER = 'temp_uploads'    #폴더 이름
if not os.path.exists(UPLOAD_FOLDER): #없다면 
    os.makedirs(UPLOAD_FOLDER)        #새로 만들기
    print(f"📁 [System] 임시 업로드 폴더 생성됨: {UPLOAD_FOLDER}")

#------------------------------------------------------------------------------------------------------

# @app.route: 누군가 'http://주소:5000/predict'로 'POST' 요청을 보내면 이 함수를 실행
@app.route('/predict', methods=['POST'])
def predict():                                   # 진단 요청 처리함수 
                                                 # Node.js에서 보낸 [사진, 질문, 대화내역]을 받아서 처리함
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

#-------------------------------------------------------------------------------------------------------

    try:                                # 이미지 데이터 수신                             
        if 'image' in request.files:    # 요청(request) 안에 'image'라는 이름의 파일이 있는지 확인
            file = request.files['image'] #있다면 이미지를 파일에 담기
            if file.filename != '':     # 그게 정상 파일이라면
                temp_path = os.path.join(UPLOAD_FOLDER, file.filename) # 'temp_uploads/파일명.jpg' 경로 생성
                file.save(temp_path)    # 실제로 컴퓨터에 파일 저장 (AI가 읽을 수 있게)
                image_path = temp_path  # 저장된 경로를 변수에 기록
                print(f"   └─ 이미지 수신 완료: {file.filename}")

#-------------------------------------------------------------------------------------------------------
#                 
        #텍스트, 히스토리 데이터 수신
        # 폼 데이터(form-data)나 JSON 데이터 중 어디에 들어있을지 모르니 둘 다 확인
        # 1. 질문(message) 추출
        if request.form.get('message'):                  # form 데이터 확인
            user_message = request.form['message']
        elif request.json and 'message' in request.json: # json 데이터 확인
            user_message = request.json['message']       # 메시지 끌어오기

        # 2. 대화 기록(history) 추출 (Node.js에서 보내준다면)
        # JSON 문자열로 올 수 있으므로 파싱 시도
        raw_history = request.form.get('history') or (request.json.get('history') if request.json else None)
        
        if raw_history:                               # 문자열로 왔으면 
            if isinstance(raw_history, str):
                try:
                    history = json.loads(raw_history) #JSON으로 변환
                except:
                    history = []                      # 파싱 실패 시 빈 리스트
            elif isinstance(raw_history, list):       # 이미 리스트로 왔으면 
                history = raw_history                 # 그대로 사용
        # 잘 받았는지 로그 출력
        print(f"   └─ 질문 내용: {user_message if user_message else '(질문 없음)'}")
        print(f"   └─ 이전 대화 개수: {len(history)}개")

#-------------------------------------------------------------------------------------------------------

        # 유효성 검사
        if image_path is None and not user_message:     # 사진도 없고 질문도 없으면
            print("❌ [Error] 빈 요청입니다.")
            return jsonify({'error': '이미지 또는 질문을 보내주세요.'}), 400 # 에러 400 출력

        # AI 분석 실행 (핵심) 
        # test.py 안에 있는 get_plant_diagnosis 함수 호출!
        print("🤖 [AI] 분석 시작...")
        result_json_str = get_plant_diagnosis(image_path, user_message, history) # 결과를 받아오기
        
        # 결과 정리 및 반환
        # AI는 결과를 '문자열(String)'로 줌 -> 이걸 파이썬 '딕셔너리(Object)'로 변환
        try:
            result_data = json.loads(result_json_str)  # 결과를 json 으로 변환 시도
        except json.JSONDecodeError:                                         
            result_data = {                            # 혹시라도 JSON 변환에 실패했을 경우를 대비한 안전장치
                "ui_status": "데이터 오류",
                "ui_guide": "AI 응답을 해석하는 중 오류가 발생했습니다.",
                "raw_data": result_json_str
            }                                              
        print(f"✅ [Success] 응답 전송 완료 (상태: {result_data.get('ui_status', 'Unknown')})")
        return jsonify(result_data)                    # 최종 결과를 JSON 형태로 Node.js에게 전송

    except Exception as e:                             # 서버 내부에서 예상치 못한 에러가 터졌을 때 
        print(f"❌ [Server Error] {str(e)}")
        return jsonify({'error': str(e)}), 500         # 에러 500 처리
    
#-------------------------------------------------------------------------------------------------------

        # 뒷정리
        # 임시로 저장한 이미지는 반드시 삭제 (서버 용량 확보)
    finally:               
        if image_path and os.path.exists(image_path):    #이미지 경로에 파일이 있다면
            os.remove(image_path)                        #삭제한다
            print("🧹 [Clean] 임시 이미지 파일 삭제 완료")

# 서버 실행부
# 이 파일이 직접 실행될 때만 서버를 켠다
if __name__ == '__main__':
    # host='0.0.0.0': 내 컴퓨터뿐만 아니라 같은 와이파이/네트워크에 있는 다른 기기(Node.js 서버 등)에서도 접속 허용
    print("🚀 [Start] Flask 서버가 실행되었습니다. (Port: 5000)")
    app.run(host='0.0.0.0', port=5000)

#-------------------------------------------------------------------------------------------------------