'use client';

import React from 'react';
import {
  VideoProject,
  VideoCategory,
} from '@/types/video-project';
import {
  Sparkles,
  Smartphone,
  Tv,
  Clock,
  FileText,
  Upload,
  Zap,
  ArrowRight,
  Package,
  Layers,
  Cpu,
  BookOpen,
  Home,
  Sliders,
  Check,
} from 'lucide-react';

interface Step1PlanningProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
}

const CATEGORIES: { id: VideoCategory; label: string; desc: string; icon: any }[] = [
  { id: 'product', label: '제품 홍보', desc: '실물 제품 스펙, 외형, 기능 시각화', icon: Package },
  { id: 'service', label: '서비스 소개', desc: '앱/SaaS/플랫폼 페인포인트 & 솔루션', icon: Layers },
  { id: 'tech', label: 'IT·테크 리뷰', desc: '벤치마크, 기술 아키텍처, 성능 비교', icon: Cpu },
  { id: 'knowledge', label: '지식·백과·교양', desc: '과학 원리, 역사/시사, 통념 타파', icon: BookOpen },
  { id: 'architecture', label: '건축·공학', desc: '공간 투시도, 시공 공법, 구조 해석', icon: Home },
  { id: 'general', label: '기타 범용', desc: '자유로운 5단계 서사 구조 콘텐츠', icon: Sliders },
];

export function Step1Planning({ project, onUpdateProject, onNextStep }: Step1PlanningProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onUpdateProject({
          sourceContent: text,
          title: project.title === '새 영상 기획 프로젝트' ? file.name.replace(/\.[^/.]+$/, '') : project.title,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Step Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-white shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                STEP 01
              </span>
              <span className="text-xs text-slate-500 font-medium">원천 자료 입력 & 기획 세팅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              어떤 주제의 영상을 기획하시나요?
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              제품 카탈로그, 기술 스펙표, 블로그 글 또는 기획 메모를 입력하세요. 도메인 맞춤형 5단계 서사 구조(3초 훅 ➔ 문제 ➔ 오해 ➔ 반전 솔루션 ➔ 결론)로 자동 설계됩니다.
            </p>
          </div>

          {/* Mode Selector Pill */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center shrink-0">
            <button
              onClick={() => onUpdateProject({ scriptInputMode: 'gemini-api' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                project.scriptInputMode === 'gemini-api'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI 자동 모드
            </button>
            <button
              onClick={() => onUpdateProject({ scriptInputMode: 'manual-input' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                project.scriptInputMode === 'manual-input'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              직접/외부 LLM 모드
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Category & Format */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Selection (Col 2) */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>1. 주제 카테고리 선택</span>
            <span className="text-[11px] text-indigo-600 font-semibold">도메인 특화 서사 적용</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = project.category === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => onUpdateProject({ category: cat.id })}
                  className={`p-3.5 rounded-xl text-left transition-all relative ${
                    isSelected
                      ? 'bg-indigo-50/90 border-2 border-indigo-500 shadow-sm'
                      : 'bg-white hover:border-slate-300 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{cat.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format & Duration (Col 1) */}
        <div className="space-y-4 glass-panel p-5 rounded-2xl bg-white shadow-xs">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>2. 영상 포맷 및 목표 길이</span>
          </label>

          {/* Ratio Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateProject({ aspectRatio: '9:16', targetDurationSeconds: 60 })}
              className={`p-3 rounded-xl border text-center transition-all ${
                project.aspectRatio === '9:16'
                  ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
              <div className="text-xs font-bold">9:16 쇼츠</div>
              <div className="text-[10px] text-slate-500 font-medium">릴스/틱톡 (60초)</div>
            </button>

            <button
              onClick={() => onUpdateProject({ aspectRatio: '16:9', targetDurationSeconds: 180 })}
              className={`p-3 rounded-xl border text-center transition-all ${
                project.aspectRatio === '16:9'
                  ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tv className="w-5 h-5 mx-auto mb-1 text-sky-600" />
              <div className="text-xs font-bold">16:9 롱폼</div>
              <div className="text-[10px] text-slate-500 font-medium">유튜브 가로형</div>
            </button>
          </div>

          {/* Duration Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                목표 재생 시간
              </span>
              <span className="text-indigo-700 font-bold font-mono">
                {Math.floor(project.targetDurationSeconds / 60)}분 {project.targetDurationSeconds % 60}초 ({project.targetDurationSeconds}s)
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={300}
              step={15}
              value={project.targetDurationSeconds}
              onChange={(e) => onUpdateProject({ targetDurationSeconds: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>30초 (초단편)</span>
              <span>1분 (쇼츠)</span>
              <span>3분 (표준)</span>
              <span>5분 (롱폼)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Material Input Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            3. 원천 자료 입력 (텍스트 / 스펙 시트 / 파일)
          </label>
          <label className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>파일 업로드 (.txt, .md)</span>
            <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <textarea
          rows={7}
          value={project.sourceContent}
          onChange={(e) => onUpdateProject({ sourceContent: e.target.value })}
          placeholder="여기에 제품 소개서, 서비스 설명서, 기술 문서, 뉴스 기사, 보도자료 내용을 복사해 붙여넣으세요.
예:
[제품명]: 초경량 티타늄 스마트 텀블러
[스펙]: 무게 185g, 7중 진공 나노 단열 24시간 보냉, 터치 OLED 온도 표시..."
          className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed font-mono transition-colors"
        />

        {/* Key Highlights Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
            <span>영상에 꼭 포함할 핵심 시각 수치 / 강조 포인트 (선택 사항)</span>
            <span className="text-[10px] text-indigo-600 font-medium">화면에 3D 인포그래픽으로 오버레이됩니다</span>
          </label>
          <input
            type="text"
            value={project.keyHighlights || ''}
            onChange={(e) => onUpdateProject({ keyHighlights: e.target.value })}
            placeholder="예: 무게 185g, 24시간 보냉 지속, ±0.5°C 정밀 센서, 와디즈 펀딩 49,000원"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextStep}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs tracking-wide shadow-md active:scale-[0.98]"
        >
          <span>대본 작성 및 팩트체크 단계로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
