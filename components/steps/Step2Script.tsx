'use client';

import React, { useState } from 'react';
import {
  VideoProject,
  VideoScene,
  NarrativeStage,
  TopicExpansion,
} from '@/types/video-project';
import {
  Sparkles,
  Zap,
  Plus,
  Trash2,
  ArrowRight,
  HelpCircle,
  Tag,
  Mic,
  Copy,
  ChevronDown,
  Layers,
  CheckCircle,
  FileCode,
} from 'lucide-react';

interface Step2ScriptProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
  onCreateProjectFromTopic: (topic: TopicExpansion) => void;
}

const STAGES: { id: NarrativeStage; label: string; color: string }[] = [
  { id: 'hook', label: '3초 훅', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { id: 'problem', label: '문제 발생', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'misconception', label: '원인 오해/한계', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { id: 'solution', label: '반전/기술 해결', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'conclusion', label: '결론 & CTA', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
];

const SPEECH_STYLES = [
  'curious and provocative',
  'calm and authoritative',
  'energetic and amazed',
  'relatable and empathetic',
  'warm and encouraging',
  'serious and urgent',
];

export function Step2Script({
  project,
  onUpdateProject,
  onNextStep,
  onCreateProjectFromTopic,
}: Step2ScriptProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // 씬 내용 수정
  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...project.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    onUpdateProject({ scenes: newScenes });
  };

  // 씬 추가
  const addScene = (stage: NarrativeStage = 'solution') => {
    const sceneNum = project.scenes.length + 1;
    const newScene: VideoScene = {
      id: 'sc-' + Date.now(),
      sceneNumber: sceneNum,
      timecode: '00:00 ~ 00:03.5',
      startSeconds: (sceneNum - 1) * 3.5,
      endSeconds: sceneNum * 3.5,
      stage,
      script: '',
      speechStyle: 'calm and authoritative',
      metricLabel: '',
      basePrompt: '',
      infographicPrompt: '',
      motionPrompt: '',
    };
    onUpdateProject({ scenes: [...project.scenes, newScene], totalScenes: sceneNum });
  };

  // 씬 삭제
  const deleteScene = (index: number) => {
    const filtered = project.scenes.filter((_, i) => i !== index);
    const renumbered = filtered.map((sc, i) => ({
      ...sc,
      sceneNumber: i + 1,
      startSeconds: i * project.secondsPerScene,
      endSeconds: (i + 1) * project.secondsPerScene,
    }));
    onUpdateProject({ scenes: renumbered, totalScenes: renumbered.length });
  };

  // 인라인 태그 삽입
  const insertTag = (index: number, tag: string) => {
    const current = project.scenes[index].script;
    updateScene(index, { script: current + ' ' + tag + ' ' });
  };

  // AI 자동 생성 트리거 (API 호출 또는 mock fall-back)
  const handleAIGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '';
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent: project.sourceContent || project.title,
          category: project.category,
          aspectRatio: project.aspectRatio,
          targetDurationSeconds: project.targetDurationSeconds,
          keyHighlights: project.keyHighlights,
          apiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scenes && data.scenes.length > 0) {
          onUpdateProject({
            scenes: data.scenes,
            topicExpansions: data.topicExpansions || [],
            totalScenes: data.scenes.length,
          });
          setIsGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API call fallback to local rule-based generation:', err);
    }

    // 로컬 폴백 생성 (API 키가 없거나 응답 전일 때)
    setTimeout(() => {
      const targetSec = project.targetDurationSeconds || 60;
      const count = Math.max(5, Math.ceil(targetSec / 3.5));
      const generated: VideoScene[] = [];
      const stages: NarrativeStage[] = ['hook', 'problem', 'misconception', 'solution', 'conclusion'];

      for (let i = 0; i < count; i++) {
        const stage = i === 0 ? 'hook' : i === 1 ? 'problem' : i === 2 ? 'misconception' : i === count - 1 ? 'conclusion' : 'solution';
        generated.push({
          id: `sc-gen-${i + 1}`,
          sceneNumber: i + 1,
          timecode: `00:${String(Math.floor(i * 3.5)).padStart(2, '0')} ~ 00:${String(Math.floor((i + 1) * 3.5)).padStart(2, '0')}`,
          startSeconds: i * 3.5,
          endSeconds: (i + 1) * 3.5,
          stage,
          script: i === 0
            ? `${project.keyHighlights || project.title}에 대해 알고 계셨나요? <short pause> 지금 놀라운 비밀이 밝혀집니다.`
            : `장면 ${i + 1}: ${stage === 'solution' ? '혁신적인 기술과 구체적인 성능 수치가 해결합니다.' : '상세 설명 및 실측 데이터를 제시합니다.'}`,
          speechStyle: i === 0 ? 'curious and provocative' : 'calm and authoritative',
          metricLabel: i === 0 ? '핵심 포인트 1위' : `수치 지표 #${i + 1}`,
          basePrompt: `Cinematic 3D render representing scene ${i + 1} of ${project.title}, photorealistic studio lighting`,
          infographicPrompt: `3D dynamic dimension lines and metric badge pointing to the key mechanism`,
          motionPrompt: `Camera push-in with dynamic motion blur, smooth 60fps`,
        });
      }

      onUpdateProject({
        scenes: generated,
        totalScenes: generated.length,
        topicExpansions: [
          { id: 'exp-1', title: `${project.title}의 숨겨진 기술 원리 심층 분석`, summary: '핵심 메커니즘과 일반 제품 비교', targetDuration: '2분' },
          { id: 'exp-2', title: `${project.title} 3대 오해와 진실`, summary: '소비자들이 가장 많이 실수하는 사용법', targetDuration: '90초' },
          { id: 'exp-3', title: `${project.title} 가성비 실측 벤치마크`, summary: '수치로 입증하는 도입 효과', targetDuration: '3분' },
        ],
      });
      setIsGenerating(false);
    }, 1200);
  };

  // 외부 대본 직접 붙여넣기 (텍스트/JSON 파서)
  const handleImportText = () => {
    if (!importText.trim()) return;

    try {
      // JSON 파싱 시도
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        onUpdateProject({ scenes: parsed, totalScenes: parsed.length });
        setShowImportModal(false);
        return;
      }
    } catch {
      // 줄단위 텍스트 파싱
      const lines = importText.split('\n').filter((l) => l.trim().length > 0);
      const parsedScenes: VideoScene[] = lines.map((line, idx) => {
        const stageIdx = Math.min(idx, 4);
        const stageList: NarrativeStage[] = ['hook', 'problem', 'misconception', 'solution', 'conclusion'];
        const stage = idx === 0 ? 'hook' : idx === lines.length - 1 ? 'conclusion' : stageList[stageIdx] || 'solution';
        return {
          id: `sc-imp-${idx + 1}`,
          sceneNumber: idx + 1,
          timecode: `00:${String(Math.floor(idx * 3.5)).padStart(2, '0')} ~ 00:${String(Math.floor((idx + 1) * 3.5)).padStart(2, '0')}`,
          startSeconds: idx * 3.5,
          endSeconds: (idx + 1) * 3.5,
          stage,
          script: line.trim(),
          speechStyle: 'calm and authoritative',
          metricLabel: `포인트 ${idx + 1}`,
          basePrompt: `Clean cinematic visual matching scene ${idx + 1}`,
          infographicPrompt: `3D graphic overlay and arrows highlighting key spec`,
          motionPrompt: `Push in camera movement with dynamic pan`,
        };
      });

      onUpdateProject({ scenes: parsedScenes, totalScenes: parsedScenes.length });
      setShowImportModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Step Banner & Action Bar */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STEP 02
              </span>
              <span className="text-xs text-slate-400">대본 작성 & 팩트체크 & 주제 확장</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              5단계 서사 구조 대본 에디터
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Gemini 3.8 Flash로 자동 생성하거나, 외부 LLM(ChatGPT, Claude)에서 뽑은 대본을 직접 붙여넣어 편집할 수 있습니다.
            </p>
          </div>

          {/* Action Buttons: AI vs Manual Import */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              대본 직접 붙여넣기
            </button>
            <button
              onClick={handleAIGenerateScript}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              {isGenerating ? 'Gemini 대본 생성 중...' : 'Gemini AI 대본 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* Narrative Stages Guide Badge Row */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs text-slate-400 font-medium mr-1">5단계 서사 구조:</span>
        {STAGES.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-1 text-[11px]">
            <span className={`px-2 py-0.5 rounded-md border font-medium ${s.color}`}>
              {idx + 1}. {s.label}
            </span>
            {idx < STAGES.length - 1 && <span className="text-slate-600">➔</span>}
          </div>
        ))}
      </div>

      {/* Interactive Scene Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>장면별 나레이션 대본 ({project.scenes.length}개 장면)</span>
          </div>
          <button
            onClick={() => addScene('solution')}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-indigo-300 border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            장면 추가
          </button>
        </div>

        {project.scenes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-400">아직 작성된 대본 장면이 없습니다.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleAIGenerateScript}
                className="btn-primary px-4 py-2 rounded-xl text-xs text-white font-medium"
              >
                Gemini AI로 대본 자동 생성
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs text-slate-300 font-medium"
              >
                직접 텍스트 붙여넣기
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {project.scenes.map((scene, idx) => {
              const currentStage = STAGES.find((s) => s.id === scene.stage) || STAGES[3];
              return (
                <div key={scene.id} className="p-4 space-y-2.5 hover:bg-white/[0.01] transition-colors">
                  {/* Top line: Scene Number, Stage Select, Timecode, Metric Label */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </span>
                      <select
                        value={scene.stage}
                        onChange={(e) => updateScene(idx, { stage: e.target.value as NarrativeStage })}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border bg-[#0a0c13] focus:outline-none ${currentStage.color}`}
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] font-mono text-slate-400">{scene.timecode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Metric / Spec Label Tag */}
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <input
                          type="text"
                          value={scene.metricLabel}
                          onChange={(e) => updateScene(idx, { metricLabel: e.target.value })}
                          placeholder="시각 수치 (예: 무게 1.2kg)"
                          className="bg-transparent text-[11px] text-indigo-200 placeholder-slate-500 focus:outline-none w-32"
                        />
                      </div>

                      {/* Delete scene */}
                      <button
                        onClick={() => deleteScene(idx)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5"
                        title="장면 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Verbatim Script Input */}
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={scene.script}
                      onChange={(e) => updateScene(idx, { script: e.target.value })}
                      placeholder="나레이터가 읽을 순수 대사를 입력하세요..."
                      className="w-full p-2.5 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Bottom: Speech Style & Quick Inline Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      <span>TTS 스타일:</span>
                      <select
                        value={scene.speechStyle}
                        onChange={(e) => updateScene(idx, { speechStyle: e.target.value })}
                        className="bg-[#0a0c13] border border-white/10 rounded px-2 py-0.5 text-slate-300 focus:outline-none"
                      >
                        {SPEECH_STYLES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Inline sound tags */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px]">호흡 태그 삽입:</span>
                      <button
                        onClick={() => insertTag(idx, '<short pause>')}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 font-mono"
                      >
                        + &lt;short pause&gt;
                      </button>
                      <button
                        onClick={() => insertTag(idx, '<breath>')}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 font-mono"
                      >
                        + &lt;breath&gt;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topic Expansion Section */}
      {project.topicExpansions && project.topicExpansions.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            연관 후속 시리즈 확장 기획안 (3~5선)
          </h3>
          <p className="text-[11px] text-slate-400">
            원천 자료 1건에서 추출된 후속 영상 아이디어입니다. 클릭 시 해당 주제로 새 프로젝트를 바로 시작할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {project.topicExpansions.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-indigo-400 font-medium mb-1">
                    <span>{exp.targetDuration}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">{exp.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{exp.summary}</p>
                </div>
                <button
                  onClick={() => onCreateProjectFromTopic(exp)}
                  className="mt-3 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium transition-all"
                >
                  <Plus className="w-3 h-3" />
                  이 주제로 새 프로젝트 시작
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextStep}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs tracking-wide shadow-lg active:scale-[0.98]"
        >
          <span>음성(TTS) 및 장면 분할 계산으로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#121624] border border-white/15 rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                대본 직접 붙여넣기 (텍스트 또는 JSON)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white text-xs">
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-300">
              외부 LLM(ChatGPT, Claude 등)에서 작성한 대본을 줄바꿈(Enter) 단위로 붙여넣으시거나, 기 정의된 JSON 배열을 그대로 붙여넣으세요.
            </p>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="예시 1 (줄 단위 대본):
아직도 무거운 보온병 들고 다니시나요? 손목이 아픈 진짜 이유가 있습니다.
가방에 물만 채워도 1.2kg에 육박하는 묵직함 때문에 결국 두고 나오게 되죠.
하지만 항공우주 티타늄으로 단 185g에 24시간 보냉을 완성했습니다.
..."
              className="w-full p-3 rounded-xl bg-[#090b12] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              >
                취소
              </button>
              <button
                onClick={handleImportText}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/30"
              >
                대본 장면으로 변환 반영
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
