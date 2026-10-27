import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { VideoScene, VideoCategory, AspectRatio } from '@/types/video-project';

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const {
      scenes = [],
      category = 'product',
      aspectRatio = '9:16',
      globalVisualStyle = 'Clean 3D cinematic rendering, studio softbox lighting, modern minimalism, 8k resolution',
      videoClipDuration = 4,
      apiKey: clientApiKey,
    } = body || {};

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: '프롬프트를 생성할 장면(Scene) 목록이 비어 있습니다.' },
        { status: 400 }
      );
    }

    // 카테고리별 비주얼 프롬프트 지침
    const categoryPromptGuides: Record<VideoCategory, { baseFocus: string; overlayFocus: string; motionFocus: string }> = {
      product: {
        baseFocus: '제품의 미려한 외형 곡선, 재질감(메탈, 세라믹, 가죽 등), 스튜디오 소프트박스 하이라이트',
        overlayFocus: '3D 입체 화살표, 부품 분해도 치수선, 주요 스펙 수치(무게, 배터리, 온도 등) 볼드 폰트 오버레이',
        motionFocus: '제품을 향한 역동적인 Push-in 줌인, 360도 턴테이블 회전, 내부 메커니즘 동작 애니메이션',
      },
      service: {
        baseFocus: '세련된 스마트폰/태블릿/노트북 화면, 모던한 오피스/일상 배경, 따뜻한 자연광',
        overlayFocus: '앱 UI 주요 버튼 하이라이트 원, 프로세스 흐름 점선 화살표, 개선율(%) 수치 배지',
        motionFocus: '화면 터치 리플 모션, UI 카드 슬라이드 전환, 유저 인터랙션 모션 그래픽',
      },
      tech: {
        baseFocus: '미래지향적 칩셋, 서버 랙, 네온 사이버 그리드, 정밀 하드웨어 매크로 샷',
        overlayFocus: '발광 홀로그램 계측선, 전송 속도/벤치마크 수치, 데이터 플로우 화살표',
        motionFocus: '초고속 데이터 파티클 흐름, 칩셋 내부 관통 Push-in, 카메라 횡이동 패닝',
      },
      knowledge: {
        baseFocus: '역사/과학적 오브젝트, 천체/자연 풍경, 미니멀하고 감각적인 아트워크',
        overlayFocus: '비교 막대/원형 3D 그래프, 핵심 연도 및 통계 수치 레이블, 인과관계 다이어그램',
        motionFocus: '시공간 축척 줌아웃, 데이터 그래프가 솟아오르는 모션, 카메라 패닝',
      },
      architecture: {
        baseFocus: '건축물 조감도, 실내 인테리어 투시도, 자연 채광 및 그림자, 콘크리트/목재 질감',
        overlayFocus: '건축 도면 치수선(mm/m), 하중 분산 화살표, 공간 명칭 및 자재 레이블',
        motionFocus: '문이나 창을 통과하는 드론 플라이스루, 햇빛 이동 타임랩스, 1인칭 시점 워크스루',
      },
      general: {
        baseFocus: '감각적이고 몰입감 넘치는 3D/시네마틱 배경 및 주요 오브젝트',
        overlayFocus: '핵심 메시지 강조 3D 화살표 및 수치 배지',
        motionFocus: '역동적인 카메라 이동 및 스무스한 트랜지션',
      },
    };

    const guide = categoryPromptGuides[category as VideoCategory] || categoryPromptGuides.general;

    // 만약 API Key가 유효할 경우 Gemini 3.8 Flash를 호출하여 각 장면별 3단계 영문 프롬프트 정밀 생성
    if (apiKey && apiKey.length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `당신은 Google Flow(Nano Banana 2 및 Omni 1.1 Flash) 전용 프롬프트 엔지니어링 최고 전문가입니다.
주어진 영상 장면 리스트(대본, 서사단계, 핵심수치)를 분석하여 각 장면마다 최적화된 3단계 영어 프롬프트를 생성하세요.

[Google Flow 3단계 프롬프트 생성 원칙]:
1. [1차: Base Image - Nano Banana 2 모델용]:
   - 텍스트, 글자, 숫자, 화살표, 그래픽 오버레이가 '절대' 없는 순수 3D 그래픽 또는 극실사 시네마틱 배경/오브젝트 프롬프트.
   - 비율: ${aspectRatio}, 공통 스타일: "${globalVisualStyle}".
   - 도메인 특화 강조: ${guide.baseFocus}

2. [2차: Infographic Overlay - Nano Banana 2 모델용]:
   - 1차 베이스 이미지를 레이어로 삼아, 해당 장면의 핵심 수치(metricLabel)와 한글 설명 레이블, 굵은 3D 입체 화살표, 동적 계측선(Dimension Lines)을 입체감 있게 얹는 프롬프트.
   - 도메인 특화 강조: ${guide.overlayFocus}

3. [3차: Motion Video - Omni 1.1 Flash 모델용]:
   - 1차(베이스)와 2차(인포그래픽) 이미지를 기준 키프레임으로 결합하여 ${videoClipDuration}초 비디오를 생성하는 모션 프롬프트.
   - 카메라 워크(Rapid push-in zoom, 360 orbit pan, tilt, tracking), 유체/작동 애니메이션 구체적 묘사.
   - Scene 01을 제외한 연속성 장면에는 반드시 '첨부된 이전 영상 마지막 프레임(@image)을 첫 프레임으로 사용하여 연속성 유지' 지침 반영.
   - 도메인 특화 강조: ${guide.motionFocus}`;

        const userPrompt = `[장면 목록]:
${JSON.stringify(
  scenes.map((s: VideoScene) => ({
    sceneNumber: s.sceneNumber,
    stage: s.stage,
    script: s.script,
    metricLabel: s.metricLabel,
  })),
  null,
  2
)}`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  basePrompt: {
                    type: Type.STRING,
                    description: '1차 베이스 이미지 프롬프트 (Nano Banana 2용 영어, No text)',
                  },
                  infographicPrompt: {
                    type: Type.STRING,
                    description: '2차 3D 인포그래픽 오버레이 프롬프트 (Nano Banana 2용 영어)',
                  },
                  motionPrompt: {
                    type: Type.STRING,
                    description: '3차 키프레임 모션 비디오 프롬프트 (Omni 1.1 Flash용 영어)',
                  },
                },
                required: ['sceneNumber', 'basePrompt', 'infographicPrompt', 'motionPrompt'],
              },
            },
          },
          required: ['prompts'],
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: responseSchema,
            temperature: 0.7,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.prompts && parsed.prompts.length > 0) {
            const promptMap = new Map<number, any>();
            parsed.prompts.forEach((p: any) => promptMap.set(p.sceneNumber, p));

            const updatedScenes: VideoScene[] = scenes.map((sc: VideoScene, idx: number) => {
              const gen = promptMap.get(sc.sceneNumber) || promptMap.get(idx + 1);
              return {
                ...sc,
                basePrompt: gen?.basePrompt || sc.basePrompt,
                infographicPrompt: gen?.infographicPrompt || sc.infographicPrompt,
                motionPrompt: gen?.motionPrompt || sc.motionPrompt,
              };
            });

            return NextResponse.json({
              scenes: updatedScenes,
              isAiGenerated: true,
            });
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini generate-flow-prompts error, falling back to rule engine:', geminiErr?.message || geminiErr);
      }
    }

    // 룰 기반 고품질 프롬프트 최적화 생성 (API 키가 없거나 폴백 시)
    const updatedScenes: VideoScene[] = scenes.map((sc: VideoScene, idx: number) => {
      const metric = sc.metricLabel || `Key Feature #${idx + 1}`;
      const isFirst = idx === 0;

      const basePrompt = `Clean 3D cinematic rendering representing ${sc.stage} of the scene: "${sc.script.slice(0, 35)}". ${globalVisualStyle}, Aspect Ratio ${aspectRatio}, studio softbox lighting, high-end commercial aesthetic, ultra-clean background, no text, no arrows, no watermarks, 8k resolution.`;

      const infographicPrompt = `3D infographic overlay on top of the base image. Prominently highlight "${metric}" with bold glowing 3D directional arrows and dynamic measurement dimension lines. Floating holographic spec callout card with Korean text, clean architectural typography.`;

      const motionTag = isFirst
        ? ''
        : 'Using the last frame of the previous clip (@image) as the starting frame to maintain visual continuity. ';

      const motionPrompt = `${motionTag}Dynamic camera motion: rapid push-in closeup zoom focusing on the core mechanism of "${metric}", accompanied by a smooth 45-degree rotational pan. Subtle floating particle effects, professional 60fps cinematic motion blur, duration ${videoClipDuration} seconds.`;

      return {
        ...sc,
        basePrompt: sc.basePrompt || basePrompt,
        infographicPrompt: sc.infographicPrompt || infographicPrompt,
        motionPrompt: sc.motionPrompt || motionPrompt,
      };
    });

    return NextResponse.json({
      scenes: updatedScenes,
      isAiGenerated: false,
      warning: apiKey
        ? 'Gemini API 호출 제한으로 도메인 특화 규칙 기반 프롬프트가 정밀 합성되었습니다.'
        : 'API 키 없이도 Google Flow에 최적화된 3단계 마스터 프롬프트가 성공적으로 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('API /api/generate-flow-prompts error:', error);
    return NextResponse.json(
      { error: error?.message || '프롬프트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
