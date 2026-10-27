import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseWavHeader } from '@/lib/audio-analyzer';
import { VideoScene, NarrativeStage } from '@/types/video-project';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;
    const projectId = (formData.get('projectId') as string) || 'project-default';
    const secondsPerScene = Number(formData.get('secondsPerScene')) || 3.5;
    const clientDuration = Number(formData.get('duration')) || 0;
    const rawScenes = formData.get('scenes') as string | null;

    let existingScenes: VideoScene[] = [];
    if (rawScenes) {
      try {
        existingScenes = JSON.parse(rawScenes);
      } catch {
        // ignore
      }
    }

    if (!file) {
      return NextResponse.json({ error: '오디오 파일이 첨부되지 않았습니다.' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public', 'projects', projectId);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.wav';
    const targetFileName = `narration${ext}`;
    const filePath = path.join(publicDir, targetFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // 오디오 길이 산출 (WAV 파싱 시도 또는 클라이언트 HTML5 Audio 측정값 사용)
    let duration = clientDuration;
    if (ext.toLowerCase() === '.wav') {
      const wavMeta = parseWavHeader(buffer);
      if (wavMeta?.durationSeconds) {
        duration = wavMeta.durationSeconds;
      }
    }

    if (!duration || duration <= 0) {
      // 대략적인 바이트 기반 추정 (128kbps mp3 등)
      duration = Number(Math.max(10, buffer.length / 16000).toFixed(1));
    }

    // 장면 자동 분할
    const totalScenesCount = Math.max(1, Math.ceil(duration / secondsPerScene));
    const newScenes: VideoScene[] = [];

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const rem = (s % 60).toFixed(1);
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
    };

    const defaultStages: NarrativeStage[] = ['hook', 'problem', 'misconception', 'solution', 'conclusion'];

    for (let i = 0; i < totalScenesCount; i++) {
      const startSec = Number((i * secondsPerScene).toFixed(1));
      const endSec = Number(Math.min(duration, (i + 1) * secondsPerScene).toFixed(1));
      const existing = existingScenes[i];
      const stage = existing?.stage || (i === 0 ? 'hook' : i === totalScenesCount - 1 ? 'conclusion' : defaultStages[Math.min(i, 4)]);

      newScenes.push({
        id: existing?.id || `sc-upload-${i + 1}`,
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

    return NextResponse.json({
      audioUrl: `/projects/${projectId}/${targetFileName}?t=${Date.now()}`,
      audioFileName: file.name,
      durationSeconds: duration,
      totalScenes: newScenes.length,
      scenes: newScenes,
    });
  } catch (error: any) {
    console.error('API /api/upload-audio error:', error);
    return NextResponse.json(
      { error: error?.message || '오디오 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
