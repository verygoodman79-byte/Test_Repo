# Script Review Agent (대본 검토 에이전트)

대본(PDF/TXT/DOCX)을 업로드하면 자동으로 분석하여 오류를 검토하는 웹 애플리케이션입니다.

## 주요 기능

### 1. 대본 업로드 및 파싱
- PDF, TXT, DOCX(Word) 형식 지원
- 자동 텍스트 추출

### 2. 자동 대본 검토
- **구조 오류**: 씬 순서, 전환 지시어 누락, 불완전한 씬, 형식 위반, 페이싱 문제
- **문법 오류 및 대안**: 구두점, 문체, 중복 표현, 어색한 표현 + 수정 제안
- **오타 검토**: 한국어/영어 오타, 반복 단어, 맞춤법 오류
- **인물 일관성 오류**: 인물 행동 불일치, 동기 부재, 연속성 오류, 대사 불일치, 설명 충돌 + 근거 제시

### 3. 대시보드
- 종합 점수(0-100) 시각화
- 카테고리별 오류 필터링 (심각도별)
- 씬별 분석 (등장인물, 대사/지문 비율)
- 통계 (단어 수, 씬 길이, 인물 대사 분포)

### 4. PDF 리포트 다운로드
- 전체 검토 결과를 PDF로 내보내기

### 5. 사용자 관리
- 회원가입 / 로그인
- 사용자별 대본 관리

### 6. 사이드 메뉴
- 사용자별 대본 리스트
- 대본 등록(업로드) / 삭제
- 분석 상태 표시

### 7. 부가 기능
- 씬별 상세 분석 (장소, 등장인물, 대사/지문 비율, 단어 수)
- 등장인물 대사 분포 통계
- 예상 읽기 시간
- 가장 긴/짧은 씬 분석
- 씬 내 이슈 감지

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Auth**: NextAuth.js (Credentials Provider)
- **File Parsing**: pdf-parse, mammoth (DOCX)
- **PDF Export**: jsPDF
- **Storage**: JSON file-based (서버사이드)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

브라우저에서 http://localhost:3000 으로 접속하세요.

## 프로젝트 구조

```
src/
  app/
    api/
      auth/         # 인증 API (NextAuth, 회원가입)
      upload/        # 파일 업로드 API
      scripts/       # 대본 CRUD API
      analyze/       # 대본 분석 API
    dashboard/       # 대시보드 페이지
    login/           # 로그인 페이지
    register/        # 회원가입 페이지
  components/        # UI 컴포넌트
  lib/
    analyzer.ts      # 대본 분석 엔진
    auth.ts          # 인증 설정
    db.ts            # JSON 파일 기반 DB
    fileParser.ts    # 파일 파싱 (PDF/TXT/DOCX)
    pdfExport.ts     # PDF 리포트 생성
  types/             # TypeScript 타입 정의
```
