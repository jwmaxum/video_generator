import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { NarrativeStage, VideoScene, TopicExpansion } from '@/types/video-project';

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const {
      sourceContent,
      category = 'product',
      aspectRatio = '9:16',
      targetDurationSeconds = 60,
      keyHighlights = '',
      apiKey: clientApiKey,
    } = body || {};

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!sourceContent && !keyHighlights) {
      return NextResponse.json(
        { error: '원천 자료 내용 또는 핵심 강조 포인트를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 장면 개수 및 글자 수 계산
    const secondsPerScene = 3.5;
    const targetSceneCount = Math.max(5, Math.ceil(targetDurationSeconds / secondsPerScene));

    // 카테고리별 전문 가이드라인
    const categoryGuides: Record<string, string> = {
      product: '실물 제품의 외형 디테일, 크기/무게/소재 스펙, 3D 분해도 및 인포그래픽 계측선 강조',
      service: '사용자의 일상 페인포인트 ➔ 앱/SaaS의 UI 흐름 및 프로세스 혁신, 도입 효과 % 수치 강조',
      tech: '기술 아키텍처, 벤치마크 점수, 처리 속도(초/배속), 하드웨어 내부 작동 원리 시각화',
      knowledge: '과학적 원리, 역사적 사실, 통념을 깨는 충격적 데이터 그래프 및 비교 인포그래픽',
      architecture: '공간 투시도, 구조 하중선, 자재 물성, 치수선(mm/m), 시공 전후 비교 시각화',
      general: '보편적 공감 페인포인트 ➔ 논리적 해결책 ➔ 핵심 가치 전달',
    };
    const domainGuide = categoryGuides[category] || categoryGuides.general;

    // 만약 API Key가 없거나 5글자 미만이면 로컬 룰 기반 대본 즉시 생성 (무료/오프라인 환경 보장)
    if (!apiKey || apiKey.length < 5) {
      const fallbackResult = generateFallbackScript({
        sourceContent,
        category,
        aspectRatio,
        targetDurationSeconds,
        targetSceneCount,
        secondsPerScene,
        keyHighlights,
      });

      return NextResponse.json({
        ...fallbackResult,
        warning: 'Gemini API 키가 아직 설정되지 않아 도메인 규칙 기반 대본이 생성되었습니다. (좌측 사이드바에서 언제든 API 키를 설정하여 최신 AI 모델로 생성할 수 있습니다)',
      });
    }

    // Google GenAI SDK 초기화
    const ai = new GoogleGenAI({ apiKey });

    // 프롬프트 구성
    const systemPrompt = `당신은 1~5분 분량의 고품질 유튜브 쇼츠(9:16) 및 롱폼(16:9) 영상을 기획하는 전문 비디오 디렉터 겸 프롬프트 엔지니어입니다.
주어진 원천 자료를 철저히 팩트체크하여 왜곡 없이 분석하고, 정확히 총 ${targetSceneCount}개의 장면으로 구성된 '5단계 서사 구조' 대본과 3단계 Google Flow 프롬프트, 그리고 3~5개의 연관 후속 확장 주제를 생성하세요.

[5단계 서사 구조 필수 배정 규칙]:
1. 3초 오프닝 훅 (hook): 초반 3초 내 시청자 이탈을 막는 강렬한 질문, 충격적 비교 수치, 또는 시각적 반전 (Scene 01)
2. 문제 발생 (problem): 소비자가 일상에서 겪는 페인포인트나 기존 방식의 불편함 제시 (Scene 02 ~ 03)
3. 원인 오해 / 기존 한계 (misconception): 사람들이 흔히 잘못 알고 있는 상식이나 기존 솔루션의 구조적 결함 (Scene 04 ~ ...)
4. 반전 / 핵심 기술 해결 (solution): 제품/기술의 핵심 작동 원리와 특장점을 구체적 수치(치수, 무게, %, 속도 등)와 함께 입체적 시각화
5. 결론 및 가치 요약 (conclusion): 최종 도입 효과 요약 및 행동 유도 CTA (마지막 1~2개 Scene)

[도메인 특화 지침]:
${domainGuide}

[한국어 발화 길이 기준]:
장면당 재생 시간은 약 ${secondsPerScene}초입니다. 각 장면의 대본은 자연스러운 발화 속도 기준 약 15~25자 내외로 간결하고 리듬감 있게 작성하세요.
호흡 조절이 필요한 위치에는 <short pause> 또는 <breath> 태그를 자연스럽게 삽입하세요.

[팩트체크 및 수치 추출]:
원천 자료에 명시된 스펙(숫자, 단위, 명칭)은 절대 누락하거나 왜곡하지 마세요. 각 문장마다 화면에 3D 인포그래픽으로 띄울 핵심 시각 수치/키워드(metricLabel, 예: "무게 185g", "속도 3배↑", "±0.5°C")를 명확히 작성하세요.`;

    const userPrompt = `[원천 자료 내용]:
${sourceContent}

[핵심 강조 포인트]:
${keyHighlights || '원천 자료의 가장 독보적인 수치와 특장점'}

[목표 포맷]:
화면 비율: ${aspectRatio} (${aspectRatio === '9:16' ? '세로형 쇼츠' : '가로형 롱폼'})
목표 재생 시간: ${targetDurationSeconds}초
총 장면 수: 정확히 ${targetSceneCount}개

위 정보를 바탕으로 규격에 맞는 정확한 JSON을 출력하세요.`;

    // Structured Outputs Schema 정의
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: '영상 기획 요약 (1~2문장)',
        },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              stage: {
                type: Type.STRING,
                description: 'hook | problem | misconception | solution | conclusion',
              },
              script: {
                type: Type.STRING,
                description: '한국어 순수 나레이션 대본 (호흡 태그 <short pause>, <breath> 포함 가능)',
              },
              speechStyle: {
                type: Type.STRING,
                description: 'TTS 감정 및 연기 톤 (예: curious and energetic, calm and authoritative)',
              },
              metricLabel: {
                type: Type.STRING,
                description: '화면에 3D 그래픽으로 띄울 핵심 수치/키워드 (예: 무게 185g, 24시간 보냉)',
              },
              basePrompt: {
                type: Type.STRING,
                description: '1차 베이스 이미지 영어 프롬프트 (글자/화살표 없는 3D/시네마틱 배경)',
              },
              infographicPrompt: {
                type: Type.STRING,
                description: '2차 3D 인포그래픽 오버레이 영어 프롬프트 (굵은 화살표, 계측선, 수치 배치 지시)',
              },
              motionPrompt: {
                type: Type.STRING,
                description: '3차 키프레임 모션 비디오 영어 프롬프트 (카메라 Pan, Push-in, 유체/작동 애니메이션)',
              },
            },
            required: [
              'sceneNumber',
              'stage',
              'script',
              'speechStyle',
              'metricLabel',
              'basePrompt',
              'infographicPrompt',
              'motionPrompt',
            ],
          },
        },
        topicExpansions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              targetDuration: { type: Type.STRING },
            },
            required: ['id', 'title', 'summary', 'targetDuration'],
          },
        },
      },
      required: ['scenes', 'topicExpansions'],
    };

    // 최신 플래시 모델 호출 (gemini-3.8-flash 우선, fallback gemini-3.8-flash-lite)
    let responseText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.8-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: responseSchema,
            temperature: 0.7,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} failed, trying fallback:`, modelErr?.message || modelErr);
      }
    }

    if (!responseText) {
      throw new Error('모든 Gemini 모델로부터 유효한 응답을 받지 못했습니다.');
    }

    const parsedData = JSON.parse(responseText);

    // 타임코드 및 씬 번호 보정
    const formattedScenes: VideoScene[] = (parsedData.scenes || []).map(
      (sc: any, idx: number) => {
        const startSec = Number((idx * secondsPerScene).toFixed(1));
        const endSec = Number(
          Math.min(targetDurationSeconds, (idx + 1) * secondsPerScene).toFixed(1)
        );

        const formatTime = (s: number) => {
          const m = Math.floor(s / 60);
          const rem = (s % 60).toFixed(1);
          return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
        };

        return {
          id: `sc-${idx + 1}`,
          sceneNumber: idx + 1,
          timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
          startSeconds: startSec,
          endSeconds: endSec,
          stage: (sc.stage as NarrativeStage) || (idx === 0 ? 'hook' : 'solution'),
          script: sc.script || '',
          speechStyle: sc.speechStyle || 'calm and authoritative',
          metricLabel: sc.metricLabel || `지표 #${idx + 1}`,
          basePrompt: sc.basePrompt || '',
          infographicPrompt: sc.infographicPrompt || '',
          motionPrompt: sc.motionPrompt || '',
        };
      }
    );

    return NextResponse.json({
      summary: parsedData.summary || '5단계 서사 대본이 성공적으로 생성되었습니다.',
      scenes: formattedScenes,
      topicExpansions: parsedData.topicExpansions || [],
      totalScenes: formattedScenes.length,
    });
  } catch (error: any) {
    console.warn('API /api/generate-script caught error, using fallback:', error?.message || error);
    try {
      const fallbackResult = generateFallbackScript({
        sourceContent: body?.sourceContent || '',
        category: body?.category || 'product',
        aspectRatio: body?.aspectRatio || '9:16',
        targetDurationSeconds: body?.targetDurationSeconds || 60,
        targetSceneCount: Math.max(5, Math.ceil((body?.targetDurationSeconds || 60) / 3.5)),
        secondsPerScene: 3.5,
        keyHighlights: body?.keyHighlights || '',
      });

      return NextResponse.json({
        ...fallbackResult,
        warning: `AI 호출 안내: ${error?.message || 'API 연결 불가'}. 규칙 기반 백업 엔진으로 5단계 서사 대본이 안전하게 생성되었습니다.`,
      });
    } catch {
      return NextResponse.json(
        { error: error?.message || '대본 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
}

// 룰 기반 정밀 폴백 생성기 (API 키가 없거나 네트워크 장애 시 완전한 5단계 서사 구조 보장)
function generateFallbackScript(params: {
  sourceContent: string;
  category: string;
  aspectRatio: string;
  targetDurationSeconds: number;
  targetSceneCount: number;
  secondsPerScene: number;
  keyHighlights: string;
}) {
  const {
    sourceContent,
    aspectRatio,
    targetDurationSeconds,
    targetSceneCount,
    secondsPerScene,
    keyHighlights,
  } = params;

  // 원천 자료에서 핵심 키워드/수치 라인 파싱
  const lines = sourceContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const highlights = keyHighlights
    ? keyHighlights.split(',').map((h) => h.trim())
    : ['핵심 특장점', '독보적 성능', '도입 효과 3배↑'];

  const scenes: VideoScene[] = [];

  for (let i = 0; i < targetSceneCount; i++) {
    const startSec = Number((i * secondsPerScene).toFixed(1));
    const endSec = Number(
      Math.min(targetDurationSeconds, (i + 1) * secondsPerScene).toFixed(1)
    );

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const rem = (s % 60).toFixed(1);
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
    };

    let stage: NarrativeStage = 'solution';
    let script = '';
    let speechStyle = 'calm and authoritative';
    let metric = highlights[i % highlights.length] || `특장점 #${i + 1}`;

    if (i === 0) {
      stage = 'hook';
      script = `아직도 비효율적인 방식에 낭비하고 계신가요? <short pause> 지금 이 수치에 주목하세요.`;
      speechStyle = 'curious and provocative';
      metric = highlights[0] || '충격적 비교 수치';
    } else if (i === 1) {
      stage = 'problem';
      script = `${lines[0] || '기존 솔루션'} 때문에 겪어야 했던 불편함과 반복되는 한계, 더는 방치할 수 없습니다.`;
      speechStyle = 'relatable and empathetic';
      metric = '기존 방식의 한계';
    } else if (i === 2) {
      stage = 'misconception';
      script = `많은 분들이 어쩔 수 없다고 오해하지만, <breath> 사실 근본적인 원인은 다른 곳에 있습니다.`;
      speechStyle = 'analytical and crisp';
      metric = '원인 오해 타파';
    } else if (i === targetSceneCount - 1) {
      stage = 'conclusion';
      script = `지금 바로 압도적인 효율을 경험해보세요. <short pause> 프로필 링크에서 자세한 혜택을 확인하실 수 있습니다!`;
      speechStyle = 'warm and encouraging';
      metric = '도입 효과 & CTA';
    } else {
      stage = 'solution';
      const contentLine = lines[i] || lines[i % lines.length] || '혁신적인 기술 메커니즘';
      script = `${contentLine}을 통해 한계를 완벽히 극복했습니다. <short pause> 수치로 직접 확인해보세요.`;
      speechStyle = 'energetic and amazed';
      metric = highlights[i % highlights.length] || `실측 성능 ${i * 15}%↑`;
    }

    scenes.push({
      id: `sc-fallback-${i + 1}`,
      sceneNumber: i + 1,
      timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
      startSeconds: startSec,
      endSeconds: endSec,
      stage,
      script,
      speechStyle,
      metricLabel: metric,
      basePrompt: `Cinematic 3D render representing scene ${i + 1}, ${aspectRatio} format, high-end studio lighting, clean background, 8k resolution.`,
      infographicPrompt: `Bold 3D arrows and dimension lines pointing to the central element highlighting "${metric}", dynamic typography overlay.`,
      motionPrompt: `Camera push-in with dynamic rotational pan, showcasing the mechanism with smooth cinematic motion blur.`,
    });
  }

  const topicExpansions: TopicExpansion[] = [
    {
      id: 'exp-1',
      title: '소비자들이 가장 많이 실수하는 3대 오해와 진실',
      summary: '기존 방식의 오류를 과학적으로 반박하고 올바른 대안을 제시하는 후속편',
      targetDuration: '60초 쇼츠',
    },
    {
      id: 'exp-2',
      title: '경쟁 솔루션 vs 혁신 기술: 극한 벤치마크 실측 비교',
      summary: '수치와 실험 데이터로 증명하는 압도적 가성비와 성능 분석',
      targetDuration: '3분 롱폼',
    },
    {
      id: 'exp-3',
      title: '도입 즉시 비용 50% 절감하는 실전 세팅 가이드',
      summary: '실제 사용자를 위한 단계별 실무 적용 가이드 및 FAQ',
      targetDuration: '90초 쇼츠',
    },
  ];

  return {
    summary: '원천 자료를 기반으로 5단계 서사 구조와 핵심 수치가 반영된 대본이 도출되었습니다.',
    scenes,
    topicExpansions,
    totalScenes: scenes.length,
  };
}
