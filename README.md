# 사자성어 백엔드 서버

프로젝트 개요: 사자성어 학습 웹게임의 백엔드(API) 서버입니다. 사용자 인증, 사자성어 조회, 즐겨찾기, 퀴즈·결과 처리, 오답 노트, 랭킹·통계, 오늘의 문제, 진행률 표시 기능을 제공합니다.

---

## 목차
1. [기술 스택](#기술-스택)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [실행 방법](#실행-방법)
5. [API Endpoints](#api-endpoints)
   - [Authentication API](#authentication-api)
   - [Idioms API](#idioms-api)
   - [Favorites API](#favorites-api)
   - [Quiz & Results API](#quiz--results-api)
   - [Daily Quiz API](#daily-quiz-api)
   - [Viewed & Progress API](#viewed--progress-api)
6. [DB Schema 적용](#db-schema-적용)
7. [Seeder (초기 데이터 적재)](#seeder-초기-데이터-적재)
8. [세션 & 쿠키](#세션--쿠키)
9. [참고](#참고)

---

## 기술 스택
- Node.js (v16+)
- Express
- MySQL
- bcrypt (비밀번호 해싱)
- express-session (세션 관리)
- dotenv (환경 변수 로딩)

---

## 환경 설정
1. 저장소 클론
   ```bash
   git clone https://github.com/saja-mju/backend.git
   cd backend
   ```
2. 의존성 설치
   ```bash
   npm install
   ```
3. 환경 변수 파일 생성 (`.env`)
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_db_password
   DB_NAME=idiom_game
   SESSION_SECRET=your_session_secret
   ```

---

## 데이터베이스 설정
1. MySQL에서 데이터베이스 생성
   ```sql
   CREATE DATABASE idiom_game CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```
2. 테이블 스키마 적용
   ```bash
   mysql -u root -p idiom_game < db/schema.sql
   ```

---

## 실행 방법
```bash
npm start
# 또는
node app.js
```
서버가 `http://localhost:3000` 에서 실행됩니다.

---

## API Endpoints

### Authentication API
> Base URL: `http://localhost:3000`  
> 요청 시 세션 쿠키 교환을 위해 `credentials: 'include'` 설정 필요

| 기능        | 메서드 | 경로                   | 설명                                 |
|-------------|--------|------------------------|--------------------------------------|
| 회원가입    | POST   | /users/register        | `{ username, password }`            |
| 로그인      | POST   | /users/login           | `{ username, password }`            |
| 로그아웃    | POST   | /users/logout          |                                    |
| 상태 조회   | GET    | /users/status          | `{ loggedIn: bool, user: string }` |

### Idioms API
| 기능           | 메서드 | 경로         | 설명                      |
|----------------|--------|--------------|---------------------------|
| 랜덤 10개 조회 | GET    | /idioms      | 사자성어 10개 반환        |
| 단일 조회      | GET    | /idioms/:id  | 특정 ID 사자성어 반환     |

### Favorites API (사용 안 함)
| 기능          | 메서드 | 경로                 | 설명                                  |
|---------------|--------|----------------------|---------------------------------------|
| 즐겨찾기 추가 | POST   | /favorites           | `{ username, idiomId }`              |
| 즐겨찾기 조회 | GET    | /favorites/:username | 사용자의 즐겨찾기 목록 반환          |

### Quiz & Results API
> Base URL: `http://localhost:3000/results`
> 모든 경로 앞에 `/results` 프리픽스가 붙습니다.

| 기능                  | 메서드 | 경로                                   | 설명                                                      |
|-----------------------|--------|----------------------------------------|-----------------------------------------------------------|
| 점수 저장             | POST   | `/results/score`                       | `{ username, score }`                                      |
| 오답 저장             | POST   | `/results/wrong`                       | `{ username, wrongIds, mode? }`                            |
| 오답 조회             | GET    | `/results/wrong/:username?mode=...`    | 사용자의 오답 문제 목록 반환                              |
| 전체 랭킹 조회        | GET    | `/results/ranking?mode=basic|synonym|hanja` | 상위 10명 랭킹 반환                                        |
| 모드별 랭킹 조회      | GET    | `/results/ranking-mode?mode=...`       | 모드별 상위 10명 랭킹 반환                                |
| 통계 조회             | GET    | `/results/stats/:username`             | 학습 횟수, 정답수, 오답수, 정확도, 진행률 반환            |
| 기본 퀴즈 출제       | GET    | `/results/basic-quiz/:username`         | 랜덤 사자성어 문제 한 건 반환          |
| 기본 퀴즈 정답 제출   | POST   | `/results/submit-basic`                | `{ username, idiomId, isCorrect }`                        |
| 유의어 퀴즈 출제      | GET    | `/results/synonym-quiz/:username`      | 유의어 퀴즈 문제 데이터 반환                               |
| 유의어 퀴즈 제출      | POST   | `/results/synonym-quiz/submit`         | `{ username, idiomId, selectedWords[] }`                  |
| 한자 조합 퀴즈 출제   | GET    | `/results/hanja-quiz/:username`        | 한자 조합 퀴즈 문제 데이터 반환                           |
| 한자 조합 퀴즈 제출   | POST   | `/results/hanja-quiz`                  | `{ username, idiomId, selected[] }`                       |
| 오늘의 문제 조회      | GET    | `/results/daily/:username`             | 당일 문제 반환                                            |
| 오늘의 문제 제출      | POST   | `/results/daily/submit`                | `{ username, idiomId }` 제출                               |
| 풀이 기록 조회        | GET    | `/results/daily-history/:username`     | 풀이 날짜 배열 반환                                        |
| 진행률 조회           | GET    | `/results/progress/:username`          | `{ solved, total, progressText }` 반환                    |

### Daily Quiz API
| 기능           | 메서드 | 경로                          | 설명                             |
|----------------|--------|-------------------------------|----------------------------------|
| 오늘의 문제 조회 | GET    | /daily/:username             | 당일 문제 반환                   |
| 오늘의 문제 제출 | POST   | /daily/submit                | `{ username, idiomId }` 제출     |
| 풀이 기록 조회   | GET    | /daily/history/:username     | 풀이 날짜 배열 반환              |

### Viewed API (안 쓸 수도 있음)
| 기능             | 메서드 | 경로                   | 설명                        |
|------------------|--------|------------------------|-----------------------------|
| 뷰 기록 저장     | POST   | /viewed/view           | `{ username, idiom_id }`    |
| 본 문제 목록 조회| GET    | /viewed/:username      | 사용자가 본 카드 ID 배열 반환 |

---

## DB Schema 적용
- 스키마 파일: `db/schema.sql` (10개 테이블 정의 포함 but 8개만 사용할 예정)

```bash
mysql -u root -p idiom_game < db/schema.sql
```

---

## Seeder (초기 데이터 적재)
`idioms_final_with_difficulty.json` 데이터를 `idioms` 테이블에 적재:

```bash
node scripts/seed-idioms.js
```

---

## 세션 & 쿠키 
- `express-session` 기반 세션 사용
- 클라이언트: `connect.sid` 쿠키로 세션 ID 전달
- **예시**:
  ```js
  fetch('/users/status', { credentials: 'include' });
  ```

---

## 참고
- Controllers: `controllers/`
- Routes: `routes/`
- 스크립트: `scripts/seed-idioms.js`
- 환경 변수: `.env`
- 커밋 컨벤션: Conventional Commits
