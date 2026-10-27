import { VideoProject } from '@/types/video-project';

export function generateProjectMarkdown(project: VideoProject): string {
  const actualDuration = project.actualAudioDurationSeconds
    ? project.actualAudioDurationSeconds.toFixed(1)
    : `${project.targetDurationSeconds}.0 (예상치)`;

  const categoryNames: Record<string, string> = {
    product: '제품 홍보',
    service: '서비스 소개',
    tech: 'IT·테크 리뷰',
    knowledge: '지식·교양',
    architecture: '건축·공학',
    general: '기타 범용',
  };

  const stageNames: Record<string, string> = {
    hook: '3초 오프닝 훅',
    problem: '문제 발생 / 페인포인트',
    misconception: '원인 오해 / 기존 한계',
    solution: '반전 / 핵심 솔루션',
    conclusion: '결론 및 CTA',
  };

  let md = `# 🎬 프로젝트 마스터 매뉴얼: ${project.title || '무제 프로젝트'}\n\n`;

  // 1. 메타데이터
  md += `## 1. 프로젝트 메타데이터 및 Google Flow 사전 세팅\n`;
  md += `- **카테고리**: ${categoryNames[project.category] || project.category}\n`;
  md += `- **목표 영상 길이**: ${project.targetDurationSeconds}초 (실제 TTS/오디오 길이: **${actualDuration}초**)\n`;
  md += `- **화면 비율**: ${project.aspectRatio} (${project.aspectRatio === '9:16' ? '쇼츠' : '롱폼'})\n`;
  md += `- **총 산출 장면(Scene) 수**: **총 ${project.scenes.length}개 장면** (장면당 ${project.secondsPerScene}초 기준)\n`;
  md += `- **Google Flow 필수 환경 세팅**:\n`;
  md += `  - 에이전트 설정(Agent): \`생성 전 확인 -> 안함\` (오류 발생 시 점검)\n`;
  md += `  - 생성 개수: \`1\` (크레딧 2배 소모 방지)\n`;
  md += `  - 이미지 모델: \`Nano Banana 2\`\n`;
  md += `  - 비디오 모델: \`Omni 1.1 Flash\` (${project.videoClipDuration}초, 720p/1080p)\n`;
  md += `  - 💡 **크레딧 절약 팁**: 처음부터 전체 장면을 다 돌리지 말고, 공통 기준과 **초반 3개 장면만 먼저 입력해 스타일을 확인**한 뒤 전체 일괄 생성을 진행하세요.\n\n`;
  md += `---\n\n`;

  // 2. 대본 매핑표
  md += `## 2. 팩트 체크 완료 대본 & 장면별 타임코드 매핑표\n`;
  md += `| 장면 번호 | 타임코드 | 서사 단계 | 나레이션 대본 (Verbatim) | TTS 연출 스타일 (\`style\`) | 핵심 시각 수치/레이블 |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  project.scenes.forEach((scene) => {
    const stageStr = stageNames[scene.stage] || scene.stage;
    const cleanScript = scene.script.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md += `| **Scene ${String(scene.sceneNumber).padStart(2, '0')}** | ${scene.timecode} | ${stageStr} | ${cleanScript} | ${scene.speechStyle || 'Standard'} | \`${scene.metricLabel || '-'}\` |\n`;
  });

  md += `\n---\n\n`;

  // 3. Google Flow 3단계 마스터 프롬프트
  md += `## 3. Google Flow 일괄 입력용 3단계 마스터 프롬프트\n\n`;

  // Step 1
  md += `### Step 1. [1차] 순수 베이스 이미지 일괄 생성 프롬프트 (Nano Banana 2)\n`;
  md += `> 아래 코드 블록 전체를 복사하여 Google Flow에 붙여넣으세요. (글자/화살표 없는 순수 비주얼)\n`;
  md += `\`\`\`text\n`;
  md += `[공통 스타일 기준]: ${project.globalVisualStyle || 'Clean 3D cinematic rendering'}, Aspect Ratio ${project.aspectRatio}, No text, no arrows, no infographic overlays, clean 3D/cinematic rendering.\n\n`;
  project.scenes.forEach((scene) => {
    md += `[Scene ${String(scene.sceneNumber).padStart(2, '0')}]: ${scene.basePrompt || 'Clean 3D visual representing ' + scene.script.slice(0, 30)}\n`;
  });
  md += `\`\`\`\n\n---\n\n`;

  // Step 2
  md += `### Step 2. [2차] 3D 인포그래픽 & 핵심 스펙 오버레이 프롬프트 (Nano Banana 2)\n`;
  md += `> 1차 생성된 이미지들을 기준 레이어로 사용하여 아래 프롬프트를 입력해 수치와 화살표를 얹으세요.\n`;
  md += `\`\`\`text\n`;
  md += `방금 생성된 각 장면의 베이스 이미지를 기준 레이어로 사용하여, 핵심 스펙과 작동 원리를 강조하는 3D 인포그래픽 오버레이 이미지를 생성해 줘.\n`;
  md += `- 굵고 선명한 3D 입체 화살표 및 동적 치수선/계측선(Dimension Lines) 추가\n`;
  md += `- 주요 부위에 핵심 수치와 한글 설명 레이블을 입체감 있게 배치\n\n`;
  project.scenes.forEach((scene) => {
    md += `[Scene ${String(scene.sceneNumber).padStart(2, '0')} Overlay]: 화면 중앙 ${scene.metricLabel || '핵심 요소'} 강조, ${scene.infographicPrompt || '입체적 화살표 및 세부 레이블'}\n`;
  });
  md += `\`\`\`\n\n---\n\n`;

  // Step 3
  md += `### Step 3. [3차] 키프레임 연동 동영상 모션 프롬프트 (Omni 1.1 Flash)\n`;
  md += `> 1차 이미지(시작 프레임)와 2차 인포그래픽 이미지(강조 프레임), 또는 이전 영상의 마지막 프레임(@image)을 태깅하여 실행하세요.\n`;
  md += `\`\`\`text\n`;
  md += `1차 베이스 이미지와 2차 인포그래픽 이미지를 기준 키프레임으로 결합하여 ${project.videoClipDuration}초 동영상 클립을 생성해 줘. (비율: ${project.aspectRatio}, 모델: Omni 1.1 Flash, 생성 개수: 1)\n\n`;
  project.scenes.forEach((scene, idx) => {
    const isFirst = idx === 0;
    const tag = isFirst
      ? ''
      : '첨부된 이전 장면 마지막 프레임(@image)을 첫 프레임으로 사용하여 연속성 유지. ';
    md += `[Scene ${String(scene.sceneNumber).padStart(2, '0')} Video]: ${tag}${scene.motionPrompt || 'Dynamic motion with smooth camera transitions'}\n`;
  });
  md += `\`\`\`\n\n---\n\n`;

  // 4. 확장 주제
  md += `## 4. 연관 시리즈 확장 주제 (Topic Expansion 3~5선)\n`;
  if (project.topicExpansions && project.topicExpansions.length > 0) {
    project.topicExpansions.forEach((exp) => {
      md += `- **${exp.title}** (${exp.targetDuration}): ${exp.summary}\n`;
    });
  } else {
    md += `- 추후 확장 주제가 생성되면 이곳에 기재됩니다.\n`;
  }

  return md;
}
