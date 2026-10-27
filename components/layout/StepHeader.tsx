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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-xs">
      {/* Top row: Project Title & Quick Nav */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-base font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all focus:outline-none w-80 truncate"
            placeholder="프로젝트 제목을 입력하세요"
          />
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
              씬 {scenesCount}개
            </span>
            {audioDuration ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
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
            className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            이전
          </button>
          <span className="text-xs text-slate-500 font-mono font-bold px-1">
            {currentStep} / {STEPS.length}
          </span>
          <button
            onClick={() => onStepChange(Math.min(STEPS.length, currentStep + 1))}
            disabled={currentStep === STEPS.length}
            className="btn-primary flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
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
                  ? 'bg-indigo-50/90 border border-indigo-400 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-indigo-900' : isCompleted ? 'text-slate-800' : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate font-medium">{step.desc}</p>
              </div>

              {/* Active Step bottom line */}
              {isActive && (
                <div className="absolute -bottom-[13px] left-2 right-2 h-0.5 bg-indigo-600" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
