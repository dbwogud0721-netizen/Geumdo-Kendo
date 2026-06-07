# 금도검도관 — 설정 가이드 (단순 방식)

브라우저가 Firebase에 직접 글을 저장하는 단순 구조. 서비스계정/private key 불필요.

---

## 1. Firestore 보안 규칙 (제일 중요 — 이거 해야 글 등록됨)
Firebase 콘솔 → Firestore Database → **규칙** 탭 → 아래로 교체 → **게시**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow create: if true;
      allow delete: if true;
    }
  }
}
```

## 2. Vercel 환경변수
대부분 이미 들어있음. 없는 것만 추가:

| 키 | 용도 | 비고 |
|----|------|------|
| `NEXT_PUBLIC_FIREBASE_*` (6개) | Firebase 연결 | 이미 설정됨 |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 관리자 비번 | **추가 필요** (원하는 비번) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 갤러리 업로드 | 갤러리 쓸 때만 |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | 갤러리 업로드 | 갤러리 쓸 때만 |

## 3. Cloudinary (갤러리 사진 — 선택)
1. https://cloudinary.com 무료 가입
2. Dashboard → `Cloud name` 복사
3. Settings → Upload → Upload presets → Add → **Unsigned** → 저장 → preset 이름 복사
4. 위 2개 env에 입력

## 4. 재배포
Vercel → Deployments → Redeploy (env 변경 시 필요).

---

## 동작 요약
- 공지/게시판/동영상: 누구나 닉네임 + 비밀번호로 글 작성. IP 기록·표시(마스킹). 비밀글 지원.
- 삭제: 작성 시 정한 비밀번호 또는 관리자 마스터 비번.
- 관리자: `/admin` 주소 직접 입력 → 마스터 비번 → 모든 글 삭제 + 갤러리 관리.

## 검증
글 등록 성공하면 끝. 실패 시 화면 빨간 메시지 확인:
- `Missing or insufficient permissions` → 1번 Firestore 규칙 안 함
- 그 외 → 메시지 그대로 알려주기
