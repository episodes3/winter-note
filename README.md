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
