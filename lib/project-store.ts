import { VideoProject, VideoScene } from '@/types/video-project';
import { generateProjectMarkdown } from './markdown-generator';

const STORAGE_KEY = 'ai_video_pipeline_studio_projects';
const ACTIVE_PROJECT_ID_KEY = 'ai_video_pipeline_active_id';

export const SAMPLE_PROJECT: VideoProject = {
  id: 'sample-project-01',
  title: '초경량 티타늄 스마트 텀블러 쇼츠 60초',
  category: 'product',
  aspectRatio: '9:16',
  targetDurationSeconds: 60,
  sourceContent: `[제품명]: 에어로타이탄(AeroTitan) 스마트 텀블러
[스펙 및 특장점]:
1. 무게: 항공우주 등급 티타늄 소재를 사용하여 단 185g (기존 스테인리스 텀블러 대비 45% 경량화)
2. 보온/보냉: 7중 진공 나노 단열 구조로 24시간 보냉, 18시간 보온 유지
3. 스마트 캡: 뚜껑 상단 터치 OLED 디스플레이로 내부 음료의 실시간 온도 표기 (오차범위 ±0.5°C)
4. 세척 및 안전: 내부 세라믹 특수 코팅으로 커피/차 착색 및 쇠맛 100% 차단
5. 가격 및 혜택: 와디즈 펀딩 특별가 49,000원 (선착순 500명 한정 실리콘 파우치 증정)`,
  keyHighlights: '185g 초경량, 24시간 보냉, ±0.5°C OLED 온도측정, 와디즈 49,000원',
  scriptInputMode: 'gemini-api',
  ttsInputMode: 'gemini-tts',
  ttsVoice: 'Kore',
  actualAudioDurationSeconds: 59.5,
  secondsPerScene: 3.5,
  totalScenes: 17,
  globalVisualStyle: 'Ultra-modern 3D product cinematic rendering, studio softbox lighting, matte obsidian and metallic titanium accents',
  videoClipDuration: 4,
  currentStep: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  topicExpansions: [
    {
      id: 'exp-1',
      title: '텀블러 속 쇠 냄새의 충격적 원인과 세라믹 코팅의 비밀',
      summary: '스테인리스 음료 반응 원리와 세라믹 나노 코팅이 맛을 보존하는 과학적 원리 탐구',
      targetDuration: '90초 쇼츠',
    },
    {
      id: 'exp-2',
      title: '항공우주 티타늄 vs 일반 보온병: 영하 20도 얼음 지속력 비교 실험',
      summary: '극한 환경 테스트와 7중 진공 나노 단열층의 열역학적 성능 시각화',
      targetDuration: '3분 롱폼',
    },
    {
      id: 'exp-3',
      title: '출근길 가방 무게 500g 줄이는 미니멀 봇짐 세팅 노하우',
      summary: '185g 텀블러를 중심으로 직장인 데일리 가방 다이어트 팁 소개',
      targetDuration: '60초 쇼츠',
    },
  ],
  scenes: [
    {
      id: 'sc-1',
      sceneNumber: 1,
      timecode: '00:00 ~ 00:03.5',
      startSeconds: 0,
      endSeconds: 3.5,
      stage: 'hook',
      script: '아직도 무거운 보온병 들고 다니시나요? <short pause> 하루 종일 손목이 아픈 진짜 이유가 있습니다.',
      speechStyle: 'curious and provocative',
      metricLabel: '무게 450g vs 185g',
      basePrompt: 'Cinematic close-up of a tired commuter carrying a heavy bulky stainless steel tumbler in a busy subway station, moody cinematic lighting, 8k resolution, vertical 9:16 format.',
      infographicPrompt: 'Glowing red comparison arrow pointing at the heavy tumbler displaying "450g", pulsing fatigue lines around the hand grip, dynamic 3D dimension text in Korean.',
      motionPrompt: 'Rapid push-in camera zoom to the user hand holding the tumbler, subtle camera shake illustrating heaviness, then quick pan to wrist joint with pulsating red heat signature.',
    },
    {
      id: 'sc-2',
      sceneNumber: 2,
      timecode: '00:03.5 ~ 00:07.0',
      startSeconds: 3.5,
      endSeconds: 7.0,
      stage: 'problem',
      script: '가방에 물만 채워도 1kg에 육박하는 묵직함 때문에 <breath> 결국 집에 두고 나오게 되죠.',
      speechStyle: 'relatable and empathetic',
      metricLabel: '체감 하중 1.2kg↑',
      basePrompt: 'A stylish leather backpack placed on an office desk, sagging heavily under the weight of an oversized metal flask, soft morning sunlight.',
      infographicPrompt: 'Digital scale overlay beneath the bag illuminating red digits "1.2kg", downward dynamic load vector arrows stressing the straps.',
      motionPrompt: 'Slow descending vertical tilt showing the bag handle stretching under heavy tension, dust particles floating in sunlight.',
    },
    {
      id: 'sc-3',
      sceneNumber: 3,
      timecode: '00:07.0 ~ 00:10.5',
      startSeconds: 7.0,
      endSeconds: 10.5,
      stage: 'misconception',
      script: '대부분은 보온력을 높이려면 철판이 두꺼워야만 한다고 생각합니다. 하지만 그건 옛날 방식입니다.',
      speechStyle: 'calm and authoritative',
      metricLabel: '기존 방식의 한계',
      basePrompt: 'Cross-section technical blueprint rendering of an outdated thick steel double-wall flask, cold industrial blue atmosphere.',
      infographicPrompt: 'Thick steel cross section highlighted with red "비효율적 무게" warning badge, comparison dashed dimension lines.',
      motionPrompt: 'Rotational 360 degree pan around the cross-section model, mechanical zoom showing the unnecessary bulk of outdated steel walls.',
    },
    {
      id: 'sc-4',
      sceneNumber: 4,
      timecode: '00:10.5 ~ 00:14.0',
      startSeconds: 10.5,
      endSeconds: 14.0,
      stage: 'solution',
      script: '항공우주 등급 순수 티타늄으로 탄생한 에어로타이탄. <short pause> 무게는 단 185g에 불과합니다!',
      speechStyle: 'energetic and amazed',
      metricLabel: '185g 극초경량',
      basePrompt: 'Sleek matte titanium AeroTitan tumbler floating weightlessly against an elegant dark gradient backdrop, floating feather alongside.',
      infographicPrompt: 'Holographic glowing cyan callout: "185g 순수 티타늄", dynamic weight metric scale dropping from 450g down to 185g with sparkle effects.',
      motionPrompt: 'Dynamic upward floating motion, 3D orbit camera spin around the titanium body, feather gently swaying down past the metallic reflection.',
    },
    {
      id: 'sc-5',
      sceneNumber: 5,
      timecode: '00:14.0 ~ 00:17.5',
      startSeconds: 14.0,
      endSeconds: 17.5,
      stage: 'solution',
      script: '7중 나노 진공 단열층이 열 손실을 완벽히 차단하여 <breath> 24시간 내내 살얼음이 그대로 유지됩니다.',
      speechStyle: 'confident and crisp',
      metricLabel: '24시간 얼음 유지',
      basePrompt: 'Exploded technical 3D diagram showing 7 transparent nanotech insulation layers inside the tumbler, crystalline ice cubes floating inside.',
      infographicPrompt: '7 layer dimension brackets labeled with glowing technical numbers 1 through 7, temperature indicator freezing at 0.0°C with blue thermal flow arrows.',
      motionPrompt: 'Smooth pull-back camera motion as the 7 layers collapse seamlessly back into the tumbler body, frost vapor swirling gracefully around the rim.',
    },
    {
      id: 'sc-6',
      sceneNumber: 6,
      timecode: '00:17.5 ~ 00:21.0',
      startSeconds: 17.5,
      endSeconds: 21.0,
      stage: 'solution',
      script: '캡 상단을 가볍게 터치하면, 정밀 센서가 현재 음료 온도를 0.5도 단위로 즉각 알려줍니다.',
      speechStyle: 'smart and modern',
      metricLabel: '±0.5°C 정밀 센서',
      basePrompt: 'Macro extreme close-up of the smart tumbler cap with an elegant circular OLED touch display and polished chamfered bevel.',
      infographicPrompt: 'Glowing OLED numbers displaying "68.5°C" with a warm amber heat ring, finger touch ripple effect graphic.',
      motionPrompt: 'High speed push-in to the OLED screen as a soft finger taps the surface, instant LED light bloom revealing the exact temperature.',
    },
    {
      id: 'sc-7',
      sceneNumber: 7,
      timecode: '00:21.0 ~ 00:24.5',
      startSeconds: 21.0,
      endSeconds: 24.5,
      stage: 'conclusion',
      script: '손목의 자유와 하루 종일 완벽한 온도를 누려보세요. 지금 와디즈 펀딩에서 한정 특가로 만나보실 수 있습니다!',
      speechStyle: 'warm and encouraging',
      metricLabel: '와디즈 특가 49,000원',
      basePrompt: 'Hero shot of the AeroTitan tumbler standing proudly on a minimalist wooden desk next to a sleek laptop and morning coffee cup, premium lifestyle vibe.',
      infographicPrompt: 'Gold badge displaying "선착순 500명 실리콘 파우치 증정", Wadiz funding URL callout card at lower third.',
      motionPrompt: 'Epic slow push-in hero shot with lens flare, soft ambient motion blur, fading smoothly into logo lockup.',
    },
  ],
};

export function getStoredProjects(): VideoProject[] {
  if (typeof window === 'undefined') return [SAMPLE_PROJECT];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProjects([SAMPLE_PROJECT]);
      return [SAMPLE_PROJECT];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SAMPLE_PROJECT];
  } catch {
    return [SAMPLE_PROJECT];
  }
}

export function saveProjects(projects: VideoProject[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function getActiveProjectId(): string {
  if (typeof window === 'undefined') return SAMPLE_PROJECT.id;
  try {
    const id = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    return id || SAMPLE_PROJECT.id;
  } catch {
    return SAMPLE_PROJECT.id;
  }
}

export function setActiveProjectId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  } catch (err) {
    console.error('Failed to set active project id:', err);
  }
}

export function createNewProject(partial?: Partial<VideoProject>): VideoProject {
  const newProj: VideoProject = {
    id: 'proj-' + Date.now(),
    title: partial?.title || '새 영상 기획 프로젝트',
    category: partial?.category || 'product',
    aspectRatio: partial?.aspectRatio || '9:16',
    targetDurationSeconds: partial?.targetDurationSeconds || 60,
    sourceContent: partial?.sourceContent || '',
    keyHighlights: partial?.keyHighlights || '',
    scriptInputMode: partial?.scriptInputMode || 'gemini-api',
    ttsInputMode: partial?.ttsInputMode || 'gemini-tts',
    ttsVoice: 'Kore',
    secondsPerScene: 3.5,
    totalScenes: 0,
    globalVisualStyle: 'Clean 3D cinematic rendering, studio lighting, modern minimalism',
    videoClipDuration: 4,
    currentStep: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    topicExpansions: [],
    scenes: [],
  };
  return newProj;
}
