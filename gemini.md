# GEMINI.md - AI Video Pipeline Studio (Antigravity Master Instructions)

## 1. Project Overview (프로젝트 개요)
본 프로젝트는 제품, 서비스, IT/테크, 교육, 건축 등 다양한 주제의 원천 자료(텍스트, PDF, URL, 제품 스펙 등)를 입력받아 **1~5분 분량의 쇼츠(9:16) 및 롱폼(16:9) 영상 제작 프로젝트**를 자동화하는 웹 애플리케이션입니다.
최종 결과물로 대본, 음성(TTS), 장면별 Google Flow 3단계 프롬프트가 모두 정리된 `[프로젝트명]_Video.md` 파일과 미디어 에셋을 생성하고 로컬 비디오 파일 자동 넘버링(`01_`, `02_`)을 수행합니다.

## 2. Tech Stack & Environment (기술 스택)
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide Icons
- **Backend / API**: Next.js API Routes (Node.js runtime, `fs`/`path` 로컬 파일 제어 지원)
- **AI SDK**: 최신 Google GenAI SDK 사용 필수
  - JavaScript/TypeScript: `@google/genai` (`>= 2.24.0`)
  - Python: `google-genai` (`>= 2.25.0`)
- **Environment Variable**: `.env.local` 파일의 `GEMINI_API_KEY` 사용

## 3. Gemini API & TTS Implementation Rules (핵심 구현 규칙)
1. **기획 및 대본 생성 모델**: `gemini-3.8-flash` (또는 최신 플래시/프로 텍스트 모델)를 사용하여 원천 자료 분석, 팩트 체크, 연관 주제 3~5개 확장, 5단계 서사 대본을 생성합니다.
2. **TTS 음성 합성 모델**: `gemini-3.8-flash-tts` (고품질 연출용) 또는 `gemini-3.8-flash-lite-tts` (대량/고속 생성용)를 사용합니다.
3. **Gemini 3.8 TTS 스키마 준수 사항**:
   - 입력 텍스트(`text`)는 순수 대본(Verbatim transcript)으로만 취급됩니다. 지시문이 그대로 읽히지 않도록 감정/톤/속도 지시는 반드시 `speech_metadata` (`speaker`, `style`) 구조체 안에 분리하여 작성합니다.
   - 순간적인 호흡이나 효과음만 대본 내 꺾쇠 태그(`<short pause>`, `<breath>`, `<laugh>`, `<sigh>`)로 삽입합니다.
   - Unary 요청의 기본 출력 포맷은 헤더가 포함된 표준 WAV(`audio/wav`)이므로 별도의 PCM 헤더 래핑 없이 즉시 `.wav` 파일로 저장하고 재생 시간(Duration, 초 단위)을 추출합니다.
   - 음성 합성 지원: Single-speaker(단일 나레이터: Kore, Aoede, Achird 등) 및 Multi-speaker(2인 대화형).

## 4. Video Production SOP & `생성할_Video.md` Generation Rules
웹앱에서 생성하는 모든 `[프로젝트명]_Video.md` 파일과 프롬프트 파이프라인은 아래 규격을 엄격히 따릅니다.

### A. 도메인별 5단계 서사 구조 (1~5분 분량)
- **Step 1 (0~3초 오프닝 훅)**: 시청자 이탈을 막는 강렬한 질문, 시각적 반전, 또는 핵심 페인포인트 제시
- **Step 2 (문제 제기/기존 한계)**: 제품/서비스가 해결하려는 문제 상황 또는 현상 제시
- **Step 3 (원인 오해/통념 타파)**: 사람들이 흔히 잘못 알고 있는 상식이나 기존 솔루션의 한계 지적
- **Step 4 (핵심 솔루션/시각적 해결)**: 제품의 핵심 기술, 서비스 작동 원리, 과학적/구조적 해결책을 구체적 수치와 함께 제시
- **Step 5 (결론 및 요약/CTA)**: 핵심 가치 요약 및 기대 효과(또는 행동 유도)

### B. 음성 길이 기반 장면(Scene) 계산 공식
- 생성된 TTS 오디오의 총 재생 시간($T$초)을 기준으로, 장면당 **3~4초(기본값 3.5초)** 단위로 분할하여 총 필요 키프레임/장면 수($N = \lceil T / 3.5 \rceil$)를 오차 없이 계산합니다.
- 1분(60초) 영상 기준 약 15~20장, 3분(180초) 영상 기준 약 45~50장의 장면을 타임코드와 1:1 매칭합니다.

### C. Google Flow 최적합 '3단계 프롬프트' 일괄 추출 규격
사용자가 원클릭으로 복사해 Google Flow에 붙여넣을 수 있도록 아래 3개의 독립된 전체 코드 블록을 생성합니다.
1. **[1차: 순수 배경/베이스 이미지 프롬프트 (Nano Banana 2용)]**
   - 글자, 숫자, 화살표 등 인포그래픽 요소가 전혀 없는 고해상도 3D 그래픽/시네마틱 제품·서비스·배경 이미지 프롬프트
2. **[2차: 3D 인포그래픽 & 스펙 오버레이 프롬프트 (Nano Banana 2용)]**
   - 1차 이미지를 베이스로 핵심 부위에 굵은 3D 화살표, 동적 계측선(Dimension Lines), 핵심 수치(성능, 치수, 연도, 가격 등), 한글 설명 레이블을 입체감 있게 얹는 프롬프트
3. **[3차: 키프레임 연동 모션 비디오 프롬프트 (Omni 1.1 Flash용, 4초/8초/10초)]**
   - 1차(배경)와 2차(인포그래픽) 이미지를 결합하고 카메라 횡이동(Pan), 급속 줌인(Push-in) 클로즈업, 내부 작동/유체/UI 모션을 지시하는 프롬프트
   - 연속성 유지를 위해 이전 영상의 마지막 프레임을 `@image`로 태깅하도록 안내 포함

### D. 파일 자동 정렬 (Auto-Numbering)
- 로컬 다운로드 폴더 내 무작위 이름의 `.mp4` 클립들을 대본/장면 순서와 매칭하여 `01_장면요약.mp4`, `02_장면요약.mp4` 형태로 일괄 리네이밍하는 기능을 제공합니다.
- `00_narration.wav` 및 `생성할_Video.md`도 동일 폴더에 함께 동기화하여 영상 편집 도구(CapCut, Vrew 등)에서 원클릭 타임라인 정렬이 가능하도록 지원합니다.