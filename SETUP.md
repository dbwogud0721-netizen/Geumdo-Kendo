# 금도검도관 — 배포 설정 가이드

코드는 모두 준비됨. 아래 환경변수만 넣고 재배포하면 공지/게시판 + 갤러리가 작동한다.
필요한 변수 전체 목록은 [.env.example](.env.example) 참고.

---

## A. 공지 / 게시판 (Firestore, 서버 경유)

### 1. 서비스 계정 키 발급
Firebase 콘솔 → ⚙️ **프로젝트 설정** → **서비스 계정** 탭 → **새 비공개 키 생성** → JSON 다운로드.
JSON 안의 `project_id`, `client_email`, `private_key` 사용.

### 2. Firestore 데이터베이스 확인
콘솔 → **Firestore Database**. 없으면 "데이터베이스 만들기"(프로덕션 모드).

### 3. Vercel 환경변수 (Settings → Environment Variables)
`NEXT_PUBLIC_` 붙이지 말 것 — 서버 전용.

| 키 | 값 |
|----|----|
| `FIREBASE_PROJECT_ID` | JSON의 project_id |
| `FIREBASE_CLIENT_EMAIL` | JSON의 client_email |
| `FIREBASE_PRIVATE_KEY` | JSON의 private_key 통째로 (BEGIN~END 포함) |
| `ADMIN_PASSWORD` | 관리자 마스터 비밀번호 |

### 4. Firestore 보안 규칙 (deny-all — 서버 admin SDK는 무시하고 접근)
콘솔 → Firestore → 규칙:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

---

## B. 갤러리 사진 (Cloudinary, 카드 불필요)

### 1. 가입
https://cloudinary.com 무료 가입.

### 2. Cloud name
Dashboard 상단 `Cloud name` 복사.

### 3. Unsigned 업로드 프리셋
Settings(⚙️) → **Upload** → Upload presets → **Add upload preset**
→ Signing Mode = **Unsigned** → 저장 → preset 이름 복사.

### 4. Vercel 환경변수
| 키 | 값 |
|----|----|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | unsigned preset 이름 |

> 삭제 시 갤러리 목록에서만 제거됨. 원본은 Cloudinary에 남음(무료 25GB).

---

## C. 재배포
Vercel → Deployments → **Redeploy** (환경변수는 새 배포부터 적용).

---

## D. 검증 (F12 → Network)
- 공지 작성 → `/api/board` **200** = 성공. `500`이면 Response의 `error` 확인:
  - `Firebase Admin 환경변수 미설정` → A-3 env 누락/재배포 안 함
  - `Failed to parse private key` → `FIREBASE_PRIVATE_KEY` 형식 문제
- 갤러리 업로드 → 이미지 뜨면 성공. 실패 시 메시지에 Cloudinary 안내 표시.

---

## 로컬 테스트 (선택)
`.env.example` → `.env.local` 복사 후 값 채우고:
```
npm install
npm run dev
```
http://localhost:3000
