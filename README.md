# WINTER NOTE

개인 업무용 GitHub Pages + Supabase 메모 대시보드입니다.

## 업로드
이 폴더 안의 `index.html`, `style.css`, `app.js` 세 파일을 GitHub의 `winter-note` 저장소 루트에 업로드하세요.

## Supabase 연결
사이트 첫 접속 시 다음 두 값을 입력합니다.
- Project URL
- Publishable key 또는 anon public key

Supabase Dashboard의 **Connect** 또는 **Project Settings → API**에서 확인할 수 있습니다.

## 로그인
Supabase Authentication → Users에서 본인 계정을 만든 뒤 그 이메일/비밀번호로 로그인합니다.

## 데이터
- `notes`: 채널별 메모
- `schedules`: 홈 주간 일정
- 오늘 할 일은 현재 브라우저의 localStorage에 저장됩니다.


## v2
- 아이디어 보관함 추가
- 카테고리: 패션 / 뷰티 / 브이로그 / 예능 / 기타
- 아이디어 / 사용 / 보류 상태 이동
- 제안자 및 댓글 기능 제외

## v3
- 글자색 / 형광펜 도구 제거
- Cmd/Ctrl + B: 볼드
- Cmd/Ctrl + + / -: 선택한 글자 크기 단계 조절

## v5
- 체크 버튼이 새 항목을 따로 만드는 대신 현재 문장/선택한 문장을 체크리스트로 변환
- 여러 줄 선택 후 체크 버튼을 누르면 각 줄을 체크리스트로 변환
- 체크리스트에서 Enter를 누르면 다음 체크 항목 자동 생성
- 빈 체크 항목에서 Enter를 누르면 체크리스트 종료
- 체크박스 클릭 시 체크/취소선, 다시 클릭 시 원복
