# 🎬 프로젝트 마스터 매뉴얼: {{PROJECT_TITLE}}

## 1. 프로젝트 메타데이터 및 Google Flow 사전 세팅
- **카테고리**: {{CATEGORY}} (제품 / 서비스 / IT·테크 / 지식·교양 / 건축·공학)
- **목표 영상 길이**: {{TARGET_DURATION}} (실제 TTS 오디오 길이: **{{ACTUAL_AUDIO_SECONDS}}초**)
- **화면 비율**: {{ASPECT_RATIO}} (9:16 쇼츠 / 16:9 롱폼)
- **총 산출 장면(Scene) 수**: **총 {{TOTAL_SCENES}}개 장면** (장면당 {{SECONDS_PER_SCENE}}초 기준)
- **Google Flow 필수 환경 세팅**:
  - 에이전트 설정(Agent): `생성 전 확인 -> 안함` (오류 발생 시 점검)
  - 생성 개수: `1` (크레딧 2배 소모 방지)
  - 이미지 모델: `Nano Banana 2`
  - 비디오 모델: `Omni 1.1 Flash` ({{VIDEO_CLIP_DURATION}}초, 720p/1080p)
  - 💡 **크레딧 절약 팁**: 처음부터 전체 장면을 다 돌리지 말고, 공통 기준과 **초반 3개 장면만 먼저 입력해 스타일을 확인**한 뒤 전체 일괄 생성을 진행하세요.

---

## 2. 팩트 체크 완료 대본 & 장면별 타임코드 매핑표
| 장면 번호 | 타임코드 | 서사 단계 | 나레이션 대본 (Verbatim) | TTS 연출 스타일 (`style`) | 핵심 시각 수치/레이블 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scene 01** | 00:00~00:04 | 3초 오프닝 훅 | {{SCRIPT_01}} | {{STYLE_01}} | `{{METRIC_01}}` |
| **Scene 02** | 00:04~00:08 | 문제 발생 | {{SCRIPT_02}} | {{STYLE_02}} | `{{METRIC_02}}` |
| **Scene 03** | 00:08~00:11 | 원인 오해 / 한계 | {{SCRIPT_03}} | {{STYLE_03}} | `{{METRIC_03}}` |
| **Scene 04** | 00:11~00:15 | 핵심 솔루션 | {{SCRIPT_04}} | {{STYLE_04}} | `{{METRIC_04}}` |
| **Scene 05** | 00:15~00:19 | 결론 및 CTA | {{SCRIPT_05}} | {{STYLE_05}} | `{{METRIC_05}}` |
... (전체 장면 자동 나열)

---

## 3. Google Flow 일괄 입력용 3단계 마스터 프롬프트

### Step 1. [1차] 순수 베이스 이미지 일괄 생성 프롬프트 (Nano Banana 2)
> 아래 코드 블록 전체를 복사하여 Google Flow에 붙여넣으세요. (글자/화살표 없는 순수 비주얼)
```text
[공통 스타일 기준]: {{GLOBAL_VISUAL_STYLE}}, Aspect Ratio {{ASPECT_RATIO}}, No text, no arrows, no infographic overlays, clean 3D/cinematic rendering.

[Scene 01]: {{SCENE_01_BASE_PROMPT}}
[Scene 02]: {{SCENE_02_BASE_PROMPT}}
[Scene 03]: {{SCENE_03_BASE_PROMPT}}
...
```

---

### Step 2. [2차] 3D 인포그래픽 & 핵심 스펙 오버레이 프롬프트 (Nano Banana 2)
> 1차 생성된 이미지들을 기준 레이어로 사용하여 아래 프롬프트를 입력해 수치와 화살표를 얹으세요.
```text
방금 생성된 각 장면의 베이스 이미지를 기준 레이어로 사용하여, 핵심 스펙과 작동 원리를 강조하는 3D 인포그래픽 오버레이 이미지를 생성해 줘.
- 굵고 선명한 3D 입체 화살표 및 동적 치수선/계측선(Dimension Lines) 추가
- 주요 부위에 핵심 수치와 한글 설명 레이블을 입체감 있게 배치

[Scene 01 Overlay]: 화면 중앙 {{METRIC_01}} 강조, {{SCENE_01_INFOGRAPHIC_DETAIL}}
[Scene 02 Overlay]: {{METRIC_02}} 수치 표시 및 화살표 지시, {{SCENE_02_INFOGRAPHIC_DETAIL}}
[Scene 03 Overlay]: {{METRIC_03}} 계측선 및 세부 레이블 표시, {{SCENE_03_INFOGRAPHIC_DETAIL}}
...
```

---

### Step 3. [3차] 키프레임 연동 동영상 모션 프롬프트 (Omni 1.1 Flash)
> 1차 이미지(시작 프레임)와 2차 인포그래픽 이미지(강조 프레임), 또는 이전 영상의 마지막 프레임(@image)을 태깅하여 실행하세요.
```text
1차 베이스 이미지와 2차 인포그래픽 이미지를 기준 키프레임으로 결합하여 {{VIDEO_CLIP_DURATION}}초 동영상 클립을 생성해 줘. (비율: {{ASPECT_RATIO}}, 모델: Omni 1.1 Flash, 생성 개수: 1)

[Scene 01 Video]: {{SCENE_01_MOTION_PROMPT}} (Camera: Rapid push-in & dynamic pan)
[Scene 02 Video]: 첨부된 이전 장면 마지막 프레임(@image)을 첫 프레임으로 사용하여 연속성 유지. {{SCENE_02_MOTION_PROMPT}}
[Scene 03 Video]: {{SCENE_03_MOTION_PROMPT}} (Camera: 360 rotation & slow zoom out)
...
```

---

## 4. 연관 시리즈 확장 주제 (Topic Expansion 3~5선)
- **{{EXPANSION_TOPIC_1}}**: {{EXPANSION_SUMMARY_1}}
- **{{EXPANSION_TOPIC_2}}**: {{EXPANSION_SUMMARY_2}}
- **{{EXPANSION_TOPIC_3}}**: {{EXPANSION_SUMMARY_3}}
- **{{EXPANSION_TOPIC_4}}**: {{EXPANSION_SUMMARY_4}}
- **{{EXPANSION_TOPIC_5}}**: {{EXPANSION_SUMMARY_5}}