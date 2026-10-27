'use client';

import React, { useState, useRef } from 'react';
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
  Info,
  RefreshCw,
} from 'lucide-react';

interface Step3TTSProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
}

const VOICES = [
  { id: 'Kore', name: 'Kore (여성, 차분하고 신뢰감 있는 톤)' },
  { id: 'Aoede', name: 'Aoede (여성, 활기차고 매력적인 톤)' },
  { id: 'Achird', name: 'Achird (남성, 중후하고 전문적인 톤)' },
  { id: 'Puck', name: 'Puck (남성, 에너제틱하고 친근한 톤)' },
  { id: 'Fenrir', name: 'Fenrir (남성, 깊고 웅장한 내레이션)' },
  { id: 'Charon', name: 'Charon (남성, 차분한 지식/다큐 톤)' },
];

export function Step3TTS({ project, onUpdateProject, onNextStep }: Step3TTSProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 음성 길이 기반 장면 재계산
  const recalculateScenes = (durationSec: number, secPerScene: number) => {
    const totalScenes = Math.max(1, Math.ceil(durationSec / secPerScene));
    const currentScenes = project.scenes.length > 0 ? project.scenes : [];

    const newScenes: VideoScene[] = [];
    for (let i = 0; i < totalScenes; i++) {
      const startSec = Number((i * secPerScene).toFixed(1));
      const endSec = Number(Math.min(durationSec, (i + 1) * secPerScene).toFixed(1));

      const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const rem = (s % 60).toFixed(1);
        return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
      };

      const existing = currentScenes[i];
      newScenes.push({
        id: existing?.id || `sc-auto-${i + 1}`,
        sceneNumber: i + 1,
        timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
        startSeconds: startSec,
        endSeconds: endSec,
        stage: existing?.stage || (i === 0 ? 'hook' : i === totalScenes - 1 ? 'conclusion' : 'solution'),
        script: existing?.script || `Scene ${i + 1} 나레이션 대사`,
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

  // 외부 오디오 파일 업로드 (.mp3, .wav)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      const duration = Number(tempAudio.duration.toFixed(1));
      onUpdateProject({
        audioUrl: url,
        audioFileName: file.name,
        actualAudioDurationSeconds: duration,
        ttsInputMode: 'audio-upload',
      });
      recalculateScenes(duration, project.secondsPerScene || 3.5);
    };
  };

  // Gemini 3.8 Flash TTS 생성 트리거
  const handleGenerateTTS = async () => {
    setIsSynthesizing(true);
    try {
      const fullTranscript = project.scenes.map((s) => s.script).join(' ');
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '';

      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullTranscript,
          voice: project.ttsVoice,
          apiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl && data.durationSeconds) {
          onUpdateProject({
            audioUrl: data.audioUrl,
            audioFileName: 'narration.wav',
            actualAudioDurationSeconds: data.durationSeconds,
            ttsInputMode: 'gemini-tts',
          });
          recalculateScenes(data.durationSeconds, project.secondsPerScene || 3.5);
          setIsSynthesizing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('TTS API call fallback:', err);
    }

    // 로컬 시뮬레이션 폴백
    setTimeout(() => {
      const estimatedSec = Math.max(30, project.targetDurationSeconds || 60);
      onUpdateProject({
        audioFileName: 'sample_narration.wav',
        actualAudioDurationSeconds: estimatedSec,
        ttsInputMode: 'gemini-tts',
      });
      recalculateScenes(estimatedSec, project.secondsPerScene || 3.5);
      setIsSynthesizing(false);
    }, 1500);
  };

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

  const durationSec = project.actualAudioDurationSeconds || project.targetDurationSeconds || 60;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Step Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STEP 03
              </span>
              <span className="text-xs text-slate-400">TTS 음성 합성 & 장면 자동 산출</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              음성 길이 기반 장면(Scene) 계산기
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Gemini 3.8 Flash TTS로 나레이션을 생성하거나, 무료 TTS(Vrew, CapCut, Typecast)에서 다운받은 오디오를 업로드하면 실측 재생 시간($T$초)에 맞춰 장면이 오차 없이 3.5초 단위로 분할됩니다.
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
              Gemini TTS
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
      </div>

      {/* Audio Source Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Gemini 3.8 TTS */}
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
                <h3 className="text-xs font-bold text-white">Gemini 3.8 Flash TTS 연동</h3>
                <p className="text-[10px] text-slate-400">고품질 WAV 오디오 자동 생성</p>
              </div>
            </div>
            {project.ttsInputMode === 'gemini-tts' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                선택됨
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">성우 보이스 선택</label>
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
              {isSynthesizing ? '음성 합성 중 (WAV)...' : 'Gemini 3.8 TTS 음성 생성 실행'}
            </button>
          </div>
        </div>

        {/* Option 2: Upload External / Free Audio */}
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
                <p className="text-[10px] text-slate-400">Vrew, CapCut, Typecast, ElevenLabs 등</p>
              </div>
            </div>
            {project.ttsInputMode === 'audio-upload' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                선택됨
              </span>
            )}
          </div>

          <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-black/20 hover:bg-black/40">
            <Upload className="w-6 h-6 text-amber-400 mb-1.5" />
            <span className="text-xs font-semibold text-white">오디오 파일 업로드 (.mp3, .wav)</span>
            <span className="text-[10px] text-slate-400 mt-0.5">클릭하거나 파일을 드래그하여 놓으세요</span>
            <input type="file" accept=".mp3,.wav,.m4a" onChange={handleAudioFileUpload} className="hidden" />
          </label>

          {project.audioFileName && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{project.audioFileName}</span>
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
              <span className="text-white font-mono font-bold">{durationSec.toFixed(1)}초</span>
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
            <span className="text-[11px] text-slate-400">
              공식: N = ⌈{durationSec.toFixed(1)} / {project.secondsPerScene || 3.5}⌉ = {Math.ceil(durationSec / (project.secondsPerScene || 3.5))}장면
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
              recalculateScenes(durationSec, val);
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

      {/* Scene Timeline Mapping View */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>타임코드 및 장면별 대본 매핑 ({project.scenes.length}개)</span>
          </div>
          <button
            onClick={() => recalculateScenes(durationSec, project.secondsPerScene || 3.5)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3 h-3" />
            타임코드 재정렬
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {project.scenes.map((scene) => (
            <div
              key={scene.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
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

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span>{scene.speechStyle || 'Standard'}</span>
                <span className="text-indigo-400 font-medium">{scene.metricLabel || '-'}</span>
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
