import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { parseWavHeader, createSyntheticWavBuffer } from '@/lib/audio-analyzer';
import { NarrativeStage, VideoScene } from '@/types/video-project';

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const {
      projectId = 'project-default',
      text = '',
      scenes = [],
      voice = 'Kore',
      speechStyle = 'calm and authoritative',
      secondsPerScene = 3.5,
      apiKey: clientApiKey,
    } = body || {};

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();

    // 전체 나레이션 텍스트 조합 (대본 텍스트가 전달되지 않았을 경우 scenes 배열에서 추출)
    let transcript = text;
    if (!transcript && Array.isArray(scenes) && scenes.length > 0) {
      transcript = scenes.map((s: VideoScene) => s.script).filter(Boolean).join(' ');
    }

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: '나레이션 대본이 비어 있습니다. 대본을 먼저 작성해주세요.' },
        { status: 400 }
      );
    }

    // 프로젝트별 WAV 저장 폴더 준비 (/public/projects/[projectId]/)
    const publicDir = path.join(process.cwd(), 'public', 'projects', projectId);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const wavFilePath = path.join(publicDir, 'narration.wav');
    const relativeAudioUrl = `/projects/${projectId}/narration.wav?t=${Date.now()}`;

    // 1. Gemini API 키가 제공되었을 때: Gemini 3.8 Flash TTS 호출 시도
    if (apiKey && apiKey.length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        // Gemini 3.8 Flash TTS 호출
        const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
        let audioBase64: string | null = null;

        for (const model of ttsModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voice,
                    },
                  },
                },
              },
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: transcript,
                    },
                  ],
                },
              ],
            });

            // 오디오 데이터 파싱
            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType?.includes('audio')) {
                  audioBase64 = part.inlineData.data || null;
                  break;
                }
              }
            }

            if (audioBase64) break;
          } catch (modelErr: any) {
            console.warn(`TTS Model ${model} failed, trying fallback:`, modelErr?.message || modelErr);
          }
        }

        // 오디오 base64 수신 성공 시 저장 및 길이 측정
        if (audioBase64) {
          const audioBuffer = Buffer.from(audioBase64, 'base64');
          fs.writeFileSync(wavFilePath, audioBuffer);

          const wavMeta = parseWavHeader(audioBuffer);
          const duration = wavMeta?.durationSeconds || Math.max(15, Math.ceil(transcript.length / 4));
          const calculatedScenes = calculateScenesFromDuration(duration, secondsPerScene, scenes);

          return NextResponse.json({
            audioUrl: relativeAudioUrl,
            audioFileName: 'narration.wav',
            durationSeconds: duration,
            totalScenes: calculatedScenes.length,
            scenes: calculatedScenes,
            isAiGenerated: true,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini TTS API error, falling back to local synthesizer:', geminiErr?.message || geminiErr);
      }
    }

    // 2. 폴백 / 수동 모드: 한국어 발화 기준(초당 약 3.8~4.2글자)으로 실측 예상 시간 산출 및 표준 WAV 합성
    const cleanChars = transcript.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length;
    // 호흡 태그당 0.5초 가산
    const pauseCount = (transcript.match(/<short pause>/g) || []).length;
    const breathCount = (transcript.match(/<breath>/g) || []).length;
    const pauseSeconds = (pauseCount + breathCount) * 0.5;

    // 실측 발화 시간 계산
    const calculatedDuration = Number(
      Math.max(10, (cleanChars / 4.0) + pauseSeconds).toFixed(1)
    );

    // 유효한 표준 PCM WAV 오디오 버퍼 생성 및 저장
    const synthWavBuffer = createSyntheticWavBuffer(calculatedDuration);
    fs.writeFileSync(wavFilePath, synthWavBuffer);

    // 장면 재분할 계산
    const calculatedScenes = calculateScenesFromDuration(calculatedDuration, secondsPerScene, scenes);

    return NextResponse.json({
      audioUrl: relativeAudioUrl,
      audioFileName: 'narration.wav',
      durationSeconds: calculatedDuration,
      totalScenes: calculatedScenes.length,
      scenes: calculatedScenes,
      isAiGenerated: false,
      warning: apiKey
        ? 'Gemini TTS API 연결 제한으로 인해 대본 발화 속도에 맞춘 표준 WAV 오디오 및 장면 계산표가 생성되었습니다.'
        : 'Gemini API 키가 없어 한국어 발화 기준 정밀 계산표 및 표준 테스트 오디오가 생성되었습니다. (무료 외부 TTS 파일 업로드도 지원됩니다)',
    });
  } catch (error: any) {
    console.error('API /api/generate-tts error:', error);
    return NextResponse.json(
      { error: error?.message || 'TTS 음성 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 음성 총 재생시간(T초)을 기반으로 장면(Scene 01 ~ Scene N) 자동 분할 및 타임코드 1:1 매핑
function calculateScenesFromDuration(
  totalDurationSeconds: number,
  secPerScene: number,
  existingScenes: VideoScene[] = []
): VideoScene[] {
  const totalScenesCount = Math.max(1, Math.ceil(totalDurationSeconds / secPerScene));
  const newScenes: VideoScene[] = [];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
  };

  const defaultStages: NarrativeStage[] = ['hook', 'problem', 'misconception', 'solution', 'conclusion'];

  for (let i = 0; i < totalScenesCount; i++) {
    const startSec = Number((i * secPerScene).toFixed(1));
    const endSec = Number(Math.min(totalDurationSeconds, (i + 1) * secPerScene).toFixed(1));

    const existing = existingScenes[i];
    const stage = existing?.stage || (i === 0 ? 'hook' : i === totalScenesCount - 1 ? 'conclusion' : defaultStages[Math.min(i, 4)]);

    newScenes.push({
      id: existing?.id || `sc-tts-${i + 1}`,
      sceneNumber: i + 1,
      timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
      startSeconds: startSec,
      endSeconds: endSec,
      stage,
      script: existing?.script || `Scene ${i + 1} 대본`,
      speechStyle: existing?.speechStyle || 'calm and authoritative',
      metricLabel: existing?.metricLabel || `지표 #${i + 1}`,
      basePrompt: existing?.basePrompt || '',
      infographicPrompt: existing?.infographicPrompt || '',
      motionPrompt: existing?.motionPrompt || '',
    });
  }

  return newScenes;
}
