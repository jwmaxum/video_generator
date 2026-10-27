'use client';

import React from 'react';
import {
  FileText,
  AlignLeft,
  Volume2,
  Sparkles,
  Scissors,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface StepHeaderProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  scenesCount: number;
  audioDuration?: number;
}

const STEPS = [
  { id: 1, title: '기획 & 원천 자료', desc: '도메인/포맷/스펙 설정', icon: FileText },
  { id: 2, title: '5단계 서사 대본', desc: 'AI 대본 or 직접/외부 입력', icon: AlignLeft },
  { id: 3, title: 'TTS & 씬 분할', desc: 'Gemini TTS or 오디오 업로드', icon: Volume2 },
  { id: 4, title: 'Google Flow 프롬프트', desc: '3단계 프롬프트 & MD 추출', icon: Sparkles },
  { id: 5, title: '비디오 자동 정렬', desc: '01_, 02_ 넘버링 & 편집', icon: Scissors },
];

export function StepHeader({
  currentStep,
  onStepChange,
  projectTitle,
  onUpdateTitle,
  scenesCount,
  audioDuration,
}: StepHeaderProps) {
  return (
    <header className="bg-[#0e111a]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 px-6 py-3">
      {/* Top row: Project Title & Quick Nav */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-base font-semibold text-white bg-transparent hover:bg-white/5 focus:bg-black/30 px-2 py-1 rounded-lg border border-transparent focus:border-indigo-500/50 transition-colors focus:outline-none w-80 truncate"
            placeholder="프로젝트 제목을 입력하세요"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              씬 {scenesCount}개
            </span>
            {audioDuration ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                실측 {audioDuration.toFixed(1)}초
              </span>
            ) : null}
          </div>
        </div>

        {/* Step Prev/Next buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            이전
          </button>
          <span className="text-xs text-slate-400 font-mono px-1">
            {currentStep} / {STEPS.length}
          </span>
          <button
            onClick={() => onStepChange(Math.min(STEPS.length, currentStep + 1))}
            disabled={currentStep === STEPS.length}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all"
          >
            다음 단계
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Wizard Nav Tabs */}
      <nav className="grid grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`relative flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-indigo-600/15 border border-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
              </div>

              {/* Active Step bottom glow line */}
              {isActive && (
                <div className="absolute -bottom-[13px] left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
