export type VideoCategory =
  | 'product'      // 제품 홍보
  | 'service'      // 서비스 소개
  | 'tech'         // IT·테크 리뷰
  | 'knowledge'    // 지식·백과·교양
  | 'architecture' // 건축·공학
  | 'general';     // 기타 범용

export type AspectRatio = '9:16' | '16:9';

export type NarrativeStage =
  | 'hook'         // 0~3초 오프닝 훅 (페인포인트 / 강렬한 질문)
  | 'problem'      // 문제 제기 / 기존 한계
  | 'misconception'// 원인 오해 / 통념 타파
  | 'solution'     // 반전 / 과학적·시각적 핵심 기술 해결
  | 'conclusion';  // 결론 / 가치 요약 및 CTA

export type ScriptInputMode = 'gemini-api' | 'manual-input';
export type TTSInputMode = 'gemini-tts' | 'audio-upload';

export interface VideoScene {
  id: string;
  sceneNumber: number; // 1, 2, 3...
  timecode: string;    // 예: "00:00 ~ 00:03.5"
  startSeconds: number;
  endSeconds: number;
  stage: NarrativeStage;
  script: string;      // 순수 나레이션 대본 (Verbatim)
  speechStyle: string; // 예: "curious and energetic", "calm and authoritative"
  metricLabel: string; // 예: "무게 1.2kg", "처리속도 3배↑", "7cm 흔들림"
  basePrompt: string;  // 1차 순수 배경/제품 이미지 (Nano Banana 2)
  infographicPrompt: string; // 2차 3D 인포그래픽 오버레이 (Nano Banana 2)
  motionPrompt: string;      // 3차 동영상 모션 프롬프트 (Omni 1.1 Flash)
}

export interface TopicExpansion {
  id: string;
  title: string;
  summary: string;
  targetDuration: string;
}

export interface VideoProject {
  id: string;
  title: string;
  category: VideoCategory;
  aspectRatio: AspectRatio;
  targetDurationSeconds: number; // 목표 시간 (60 ~ 300초)
  sourceContent: string;
  keyHighlights?: string;

  // 생성 모드 플래그 (API 자동화 vs 수동/외부 LLM 하이브리드)
  scriptInputMode: ScriptInputMode;
  ttsInputMode: TTSInputMode;

  // Tab 2: 대본 및 확장 주제
  scenes: VideoScene[];
  topicExpansions: TopicExpansion[];

  // Tab 3: TTS 오디오 및 정밀 분석
  ttsVoice: string; // "Kore", "Aoede", "Achird", "Puck", "Fenrir", "Charon"
  audioUrl?: string;
  audioFileName?: string;
  actualAudioDurationSeconds?: number;
  secondsPerScene: number; // 기본값 3.5초 (3.0 ~ 5.0초 조절 가능)
  totalScenes: number;

  // Tab 4: 글로벌 비주얼 메타데이터
  globalVisualStyle: string;
  videoClipDuration: number; // 4, 8, 10초
  generatedMarkdown?: string;

  // 상태 관리
  currentStep: number; // 1 ~ 5
  updatedAt: string;
  createdAt: string;
}
