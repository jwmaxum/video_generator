'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  VideoProject,
  VideoScene,
  TTSInputMode,
} from '@/types/video-project';
import {
  Volume2,
  Upload,
  Sparkles,
  Play,
  Pause,
  Clock,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  FileAudio,
  Download,
  Scissors,
  Link as LinkIcon,
  AlertCircle,
  Users,
  User,
  RotateCcw,
} from 'lucide-react';

interface Step3TTSProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
}

const VOICES = [
  { id: 'Kore', name: 'Kore (여성, 차분하고 신뢰감 있는 톤 - 제품/IT 추천)' },
  { id: 'Aoede', name: 'Aoede (여성, 밝고 활기찬 톤 - 쇼츠/마케팅 추천)' },
  { id: 'Achird', name: 'Achird (남성, 중후하고 전문적인 톤 - 다큐/신뢰 추천)' },
  { id: 'Puck', name: 'Puck (남성, 에너제틱하고 친근한 톤 - 리뷰 추천)' },
  { id: 'Fenrir', name: 'Fenrir (남성, 깊고 웅장한 내레이션 - 시네마틱 추천)' },
  { id: 'Charon', name: 'Charon (남성, 차분한 지식/교양 다큐 톤)' },
];

export function Step3TTS({ project, onUpdateProject, onNextStep }: Step3TTSProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(project.actualAudioDurationSeconds || 60);
  const [speakerMode, setSpeakerMode] = useState<'single' | 'multi'>('single');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (project.actualAudioDurationSeconds) {
      setAudioDuration(project.actualAudioDurationSeconds);
    }
  }, [project.actualAudioDurationSeconds]);

  // 타임코드 포맷 유틸
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
  };

  // 음성 길이 기반 장면 재계산
  const recalculateScenes = (durationSec: number, secPerScene: number) => {
    const totalScenes = Math.max(1, Math.ceil(durationSec / secPerScene));
    const currentScenes = project.scenes.length > 0 ? project.scenes : [];

    const newScenes: VideoScene[] = [];
    for (let i = 0; i < totalScenes; i++) {
      const startSec = Number((i * secPerScene).toFixed(1));
      const endSec = Number(Math.min(durationSec, (i + 1) * secPerScene).toFixed(1));
      const existing = currentScenes[i];

      newScenes.push({
        id: existing?.id || `sc-tts-${i + 1}`,
        sceneNumber: i + 1,
        timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
        startSeconds: startSec,
        endSeconds: endSec,
        stage: existing?.stage || (i === 0 ? 'hook' : i === totalScenes - 1 ? 'conclusion' : 'solution'),
        script: existing?.script || `Scene ${i + 1} 대본`,
        speechStyle: existing?.speechStyle || 'calm and authoritative',
        metricLabel: existing?.metricLabel || `지표 #${i + 1}`,
        basePrompt: existing?.basePrompt || '',
        infographicPrompt: existing?.infographicPrompt || '',
        motionPrompt: existing?.motionPrompt || '',
      });
    }

    onUpdateProject({
      scenes: newScenes,
      totalScenes: newScenes.length,
      actualAudioDurationSeconds: durationSec,
      secondsPerScene: secPerScene,
    });
  };

  // 장면 분할 (Split)
  const handleSplitScene = (index: number) => {
    const target = project.scenes[index];
    if (!target) return;

    const midSeconds = Number(((target.startSeconds + target.endSeconds) / 2).toFixed(1));
    const firstHalf: VideoScene = {
      ...target,
      timecode: `${formatTime(target.startSeconds)} ~ ${formatTime(midSeconds)}`,
      endSeconds: midSeconds,
      script: target.script.slice(0, Math.ceil(target.script.length / 2)).trim(),
    };
    const secondHalf: VideoScene = {
      ...target,
      id: 'sc-split-' + Date.now(),
      timecode: `${formatTime(midSeconds)} ~ ${formatTime(target.endSeconds)}`,
      startSeconds: midSeconds,
      script: target.script.slice(Math.ceil(target.script.length / 2)).trim(),
    };

    const newScenes = [...project.scenes];
    newScenes.splice(index, 1, firstHalf, secondHalf);

    // 재번호 부여
    const renumbered = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateProject({ scenes: renumbered, totalScenes: renumbered.length });
  };

  // 장면 병합 (Merge with next)
  const handleMergeScene = (index: number) => {
    if (index >= project.scenes.length - 1) return;
    const current = project.scenes[index];
    const next = project.scenes[index + 1];

    const merged: VideoScene = {
      ...current,
      timecode: `${formatTime(current.startSeconds)} ~ ${formatTime(next.endSeconds)}`,
      endSeconds: next.endSeconds,
      script: `${current.script} ${next.script}`.trim(),
      metricLabel: current.metricLabel || next.metricLabel,
    };

    const newScenes = [...project.scenes];
    newScenes.splice(index, 2, merged);

    const renumbered = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateProject({ scenes: renumbered, totalScenes: renumbered.length });
  };

  // Gemini 3.8 Flash TTS 생성 API 호출
  const handleGenerateTTS = async () => {
    setIsSynthesizing(true);
    setStatusMessage(null);

    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '';
      const fullTranscript = project.scenes.map((s) => s.script).filter(Boolean).join(' ');

      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          text: fullTranscript,
          scenes: project.scenes,
          voice: project.ttsVoice,
          secondsPerScene: project.secondsPerScene || 3.5,
          apiKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.audioUrl) {
        onUpdateProject({
          audioUrl: data.audioUrl,
          audioFileName: data.audioFileName || 'narration.wav',
          actualAudioDurationSeconds: data.durationSeconds,
          ttsInputMode: 'gemini-tts',
          scenes: data.scenes || project.scenes,
          totalScenes: data.totalScenes || project.scenes.length,
        });
        setAudioDuration(data.durationSeconds);
        if (data.warning) setStatusMessage(data.warning);
        setIsSynthesizing(false);
        return;
      } else if (data.error) {
        setStatusMessage(data.error);
      }
    } catch (err: any) {
      console.warn('TTS API Error:', err);
      setStatusMessage('TTS 생성 연결 오류로 기본 계산표가 적용되었습니다.');
    }

    setIsSynthesizing(false);
  };

  // 외부 / 무료 TTS 오디오 업로드 핸들러
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    // 1. 브라우저 HTML5 Audio 엘리먼트로 실측 길이 즉시 추출
    const localUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(localUrl);

    tempAudio.onloadedmetadata = async () => {
      const measuredSec = Number(tempAudio.duration.toFixed(1));
      setAudioDuration(measuredSec);

      // 2. 서버로 파일 업로드하여 /public/projects/[projectId]/narration.wav 에 저장
      try {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('projectId', project.id);
        formData.append('secondsPerScene', String(project.secondsPerScene || 3.5));
        formData.append('duration', String(measuredSec));
        formData.append('scenes', JSON.stringify(project.scenes));

        const res = await fetch('/api/upload-audio', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.audioUrl) {
          onUpdateProject({
            audioUrl: data.audioUrl,
            audioFileName: file.name,
            actualAudioDurationSeconds: data.durationSeconds || measuredSec,
            ttsInputMode: 'audio-upload',
            scenes: data.scenes || project.scenes,
            totalScenes: data.totalScenes || project.scenes.length,
          });
        } else {
          // 로컬 URL로 폴백 유지
          onUpdateProject({
            audioUrl: localUrl,
            audioFileName: file.name,
            actualAudioDurationSeconds: measuredSec,
            ttsInputMode: 'audio-upload',
          });
          recalculateScenes(measuredSec, project.secondsPerScene || 3.5);
        }
      } catch {
        onUpdateProject({
          audioUrl: localUrl,
          audioFileName: file.name,
          actualAudioDurationSeconds: measuredSec,
          ttsInputMode: 'audio-upload',
        });
        recalculateScenes(measuredSec, project.secondsPerScene || 3.5);
      }

      setIsUploading(false);
    };
  };

  // 오디오 재생 토글
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STEP 03
              </span>
              <span className="text-xs text-slate-400">Gemini 3.8 Flash TTS & 실측 씬 분할 계산기</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              음성 길이 기반 장면(Scene) 계산기
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Gemini 3.8 Flash TTS로 표준 WAV 나레이션을 생성하거나, 무료 TTS(타입캐스트, Vrew, CapCut 등)에서 추출한 오디오를 업로드하면 실측 재생 시간($T$초)에 맞춰 장면이 오차 없이 3.5초 단위로 분할됩니다.
            </p>
          </div>

          {/* Mode Pill */}
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center shrink-0">
            <button
              onClick={() => onUpdateProject({ ttsInputMode: 'gemini-tts' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                project.ttsInputMode === 'gemini-tts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              Gemini 3.8 TTS
            </button>
            <button
              onClick={() => onUpdateProject({ ttsInputMode: 'audio-upload' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                project.ttsInputMode === 'audio-upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              무료 TTS 오디오 업로드
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-200">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Audio Waveform Player Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayAudio}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0"
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white font-mono">
                  {project.audioFileName || '00_narration.wav'}
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {project.ttsInputMode === 'gemini-tts' ? 'Gemini 3.8 Flash TTS' : '외부 오디오 파일'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatTime(currentTime)} / {formatTime(audioDuration)} ({audioDuration.toFixed(1)}초)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {project.audioUrl && (
              <a
                href={project.audioUrl}
                download="00_narration.wav"
                className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>00_narration.wav 다운로드</span>
              </a>
            )}
          </div>
        </div>

        {/* Audio Progress / Fake Waveform visualization */}
        <div className="pt-2">
          <div className="flex items-center gap-1 h-8 px-2 rounded-xl bg-black/40 border border-white/5 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const progress = currentTime / (audioDuration || 60);
              const isPast = i / 48 <= progress;
              const heightPct = 25 + ((Math.sin(i * 0.8) + 1) * 35);

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPast
                      ? 'bg-gradient-to-t from-indigo-500 to-indigo-300 shadow-sm'
                      : 'bg-white/10'
                  }`}
                  style={{
                    height: `${isPlaying ? Math.max(20, heightPct * (0.8 + Math.random() * 0.4)) : heightPct}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Hidden native audio element */}
          {project.audioUrl && (
            <audio
              ref={audioRef}
              src={project.audioUrl}
              onTimeUpdate={() => {
                if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
              }}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      </div>

      {/* Grid: Source Options (Gemini TTS vs Upload) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A: Gemini 3.8 Flash TTS */}
        <div
          className={`p-5 rounded-2xl transition-all border ${
            project.ttsInputMode === 'gemini-tts'
              ? 'bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
              : 'glass-panel opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Gemini 3.8 Flash TTS</h3>
                <p className="text-[10px] text-slate-400">speech_metadata 분리 & 표준 WAV Unary</p>
              </div>
            </div>

            {/* Single vs Multi Speaker Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-[10px]">
              <button
                onClick={() => setSpeakerMode('single')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  speakerMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                <User className="w-3 h-3" /> 단일
              </button>
              <button
                onClick={() => setSpeakerMode('multi')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  speakerMode === 'multi' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                <Users className="w-3 h-3" /> 2인 Q&A
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {speakerMode === 'single' ? '메인 나레이터 성우' : '호스트 성우 (Q&A)'}
              </label>
              <select
                value={project.ttsVoice}
                onChange={(e) => onUpdateProject({ ttsVoice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0c13] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateTTS}
              disabled={isSynthesizing}
              className="w-full btn-primary py-2.5 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              {isSynthesizing ? 'Gemini 3.8 TTS 음성 합성 중...' : 'Gemini 3.8 TTS 음성 생성 실행'}
            </button>
          </div>
        </div>

        {/* Option B: Upload External / Free Audio */}
        <div
          className={`p-5 rounded-2xl transition-all border ${
            project.ttsInputMode === 'audio-upload'
              ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/50'
              : 'glass-panel opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-300 flex items-center justify-center">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">무료/외부 TTS 오디오 업로드</h3>
                <p className="text-[10px] text-slate-400">타입캐스트, Vrew, CapCut, Clova 무음 제거본</p>
              </div>
            </div>
            {project.ttsInputMode === 'audio-upload' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                활성화
              </span>
            )}
          </div>

          <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-black/20 hover:bg-black/40">
            <Upload className="w-6 h-6 text-amber-400 mb-1.5" />
            <span className="text-xs font-semibold text-white">
              {isUploading ? '오디오 분석 및 업로드 중...' : '오디오 파일 드래그앤드롭 (.mp3, .wav)'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              재생 시간($T$초)을 정밀 산출하여 장면을 자동 재계산합니다
            </span>
            <input type="file" accept=".mp3,.wav,.m4a" onChange={handleAudioFileUpload} className="hidden" />
          </label>

          {project.audioFileName && project.ttsInputMode === 'audio-upload' && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{project.audioFileName} ({audioDuration.toFixed(1)}초 감지됨)</span>
            </div>
          )}
        </div>
      </div>

      {/* Scene Calculator Settings Card */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">장면(Scene) 분할 파라미터 세팅</span>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400 mr-1.5">실측 음성 길이:</span>
              <span className="text-white font-mono font-bold">{audioDuration.toFixed(1)}초</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs">
              <span className="text-indigo-300 mr-1.5">총 산출 장면:</span>
              <span className="text-indigo-200 font-mono font-bold">{project.scenes.length}개 장면</span>
            </div>
          </div>
        </div>

        {/* Seconds Per Scene Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              장면당 기준 시간: <strong className="text-indigo-300 font-mono">{project.secondsPerScene || 3.5}초</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              공식: N = ⌈{audioDuration.toFixed(1)} / {project.secondsPerScene || 3.5}⌉ = {Math.ceil(audioDuration / (project.secondsPerScene || 3.5))}장면
            </span>
          </div>
          <input
            type="range"
            min={2.5}
            max={5.0}
            step={0.5}
            value={project.secondsPerScene || 3.5}
            onChange={(e) => {
              const val = Number(e.target.value);
              recalculateScenes(audioDuration, val);
            }}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>2.5초 (초고속 전개/쇼츠)</span>
            <span>3.5초 (표준 추천값)</span>
            <span>5.0초 (차분한 해설/롱폼)</span>
          </div>
        </div>
      </div>

      {/* Scene Timeline Mapping View with Merge & Split */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>타임코드 및 씬 분할 타임라인 ({project.scenes.length}개 장면)</span>
          </div>
          <button
            onClick={() => recalculateScenes(audioDuration, project.secondsPerScene || 3.5)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
            기본 3.5초 단위로 재정렬
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {project.scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                    Scene {String(scene.sceneNumber).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {scene.timecode}
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                  {scene.script || '(대사 없음)'}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                <span className="text-indigo-400 font-medium truncate max-w-[120px]">
                  {scene.metricLabel || '-'}
                </span>

                {/* Merge and Split Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSplitScene(idx)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-300"
                    title="이 장면을 2개로 분할"
                  >
                    <Scissors className="w-3 h-3" />
                  </button>
                  {idx < project.scenes.length - 1 && (
                    <button
                      onClick={() => handleMergeScene(idx)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300"
                      title="다음 장면과 병합"
                    >
                      <LinkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextStep}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs tracking-wide shadow-lg active:scale-[0.98]"
        >
          <span>Google Flow 3단계 프롬프트 생성으로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
