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
  Tag,
  Mic,
  Copy,
  Layers,
  FileCode,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Step2ScriptProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
  onCreateProjectFromTopic: (topic: TopicExpansion) => void;
}

const STAGES: { id: NarrativeStage; label: string; desc: string; color: string }[] = [
  { id: 'hook', label: '1. 3초 오프닝 훅', desc: '이탈 방지 강렬한 질문/수치', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'problem', label: '2. 문제 발생', desc: '고객 페인포인트/기존 한계', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'misconception', label: '3. 원인 오해/통념', desc: '잘못된 상식/구조적 결함', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'solution', label: '4. 반전/기술 해결', desc: '핵심 원리 & 구체적 스펙 수치', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'conclusion', label: '5. 결론 & CTA', desc: '도입 효과 요약 & 행동 유도', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  // 씬 업데이트
  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...project.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    onUpdateProject({ scenes: newScenes });
  };

  // 씬 추가
  const addScene = (stage: NarrativeStage = 'solution') => {
    const sceneNum = project.scenes.length + 1;
    const sec = project.secondsPerScene || 3.5;
    const startSec = (sceneNum - 1) * sec;
    const endSec = sceneNum * sec;

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const rem = (s % 60).toFixed(1);
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
    };

    const newScene: VideoScene = {
      id: 'sc-' + Date.now(),
      sceneNumber: sceneNum,
      timecode: `${formatTime(startSec)} ~ ${formatTime(endSec)}`,
      startSeconds: startSec,
      endSeconds: endSec,
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
    const sec = project.secondsPerScene || 3.5;

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const rem = (s % 60).toFixed(1);
      return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
    };

    const renumbered = filtered.map((sc, i) => ({
      ...sc,
      sceneNumber: i + 1,
      startSeconds: i * sec,
      endSeconds: (i + 1) * sec,
      timecode: `${formatTime(i * sec)} ~ ${formatTime((i + 1) * sec)}`,
    }));
    onUpdateProject({ scenes: renumbered, totalScenes: renumbered.length });
  };

  // 인라인 태그 삽입
  const insertTag = (index: number, tag: string) => {
    const current = project.scenes[index].script;
    updateScene(index, { script: current ? `${current} ${tag} ` : `${tag} ` });
  };

  // 전체 순수 대본 복사 (무료 외부 TTS용)
  const handleCopyFullScript = () => {
    const fullText = project.scenes.map((s) => s.script).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // AI 자동 생성 호출
  const handleAIGenerateScript = async () => {
    setIsGenerating(true);
    setApiNotice(null);

    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '';
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

      const data = await res.json();
      if (res.ok && data.scenes && data.scenes.length > 0) {
        onUpdateProject({
          scenes: data.scenes,
          topicExpansions: data.topicExpansions || [],
          totalScenes: data.scenes.length,
        });
        if (data.warning) {
          setApiNotice(data.warning);
        }
        setIsGenerating(false);
        return;
      } else if (data.error) {
        setApiNotice(`안내: ${data.error}`);
      }
    } catch (err: any) {
      console.warn('AI generate-script call error:', err);
      setApiNotice('네트워크 연결 확인이 필요합니다.');
    }

    setIsGenerating(false);
  };

  // 외부 대본 직접 붙여넣기 (JSON 또는 줄단위 텍스트)
  const handleImportText = () => {
    if (!importText.trim()) return;

    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        onUpdateProject({ scenes: parsed, totalScenes: parsed.length });
        setShowImportModal(false);
        return;
      }
    } catch {
      const lines = importText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const sec = project.secondsPerScene || 3.5;

      const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const rem = (s % 60).toFixed(1);
        return `${String(m).padStart(2, '0')}:${String(rem).padStart(4, '0')}`;
      };

      const parsedScenes: VideoScene[] = lines.map((line, idx) => {
        const stageIdx = Math.min(idx, 4);
        const stageList: NarrativeStage[] = ['hook', 'problem', 'misconception', 'solution', 'conclusion'];
        const stage = idx === 0 ? 'hook' : idx === lines.length - 1 ? 'conclusion' : stageList[stageIdx] || 'solution';

        return {
          id: `sc-imp-${idx + 1}`,
          sceneNumber: idx + 1,
          timecode: `${formatTime(idx * sec)} ~ ${formatTime((idx + 1) * sec)}`,
          startSeconds: idx * sec,
          endSeconds: (idx + 1) * sec,
          stage,
          script: line,
          speechStyle: idx === 0 ? 'curious and provocative' : 'calm and authoritative',
          metricLabel: `핵심 포인트 #${idx + 1}`,
          basePrompt: `Cinematic 3D render representing scene ${idx + 1}, modern clean aesthetic`,
          infographicPrompt: `3D graphic arrows and spec callout badge`,
          motionPrompt: `Push-in camera movement with dynamic pan`,
        };
      });

      onUpdateProject({ scenes: parsedScenes, totalScenes: parsedScenes.length });
      setShowImportModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner & Action Bar */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                STEP 02
              </span>
              <span className="text-xs text-slate-500 font-medium">5단계 서사 대본 & 팩트체크 엔진</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              5단계 서사 구조 대본 에디터
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Gemini 3.8 Flash의 Structured Outputs으로 정밀 팩트체크된 대본을 생성하거나, 외부 LLM(ChatGPT, Claude 등)의 대본을 직접 붙여넣어 편집할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyFullScript}
              disabled={project.scenes.length === 0}
              className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
              title="무료 외부 TTS(타입캐스트, Vrew 등)에 붙여넣을 전체 순수 대본 복사"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              {copiedScript ? '복사 완료!' : '전체 대본 복사'}
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700"
            >
              <FileCode className="w-4 h-4 text-amber-500" />
              대본 직접 붙여넣기
            </button>
            <button
              onClick={handleAIGenerateScript}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              {isGenerating ? 'Gemini 분석 & 대본 생성 중...' : 'Gemini AI 대본 자동 생성'}
            </button>
          </div>
        </div>

        {apiNotice && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-900 font-medium">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{apiNotice}</span>
          </div>
        )}
      </div>

      {/* 5-Stage Narrative Structure Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STAGES.map((s) => (
          <div key={s.id} className={`p-2.5 rounded-xl border text-left shadow-2xs ${s.color}`}>
            <div className="text-[11px] font-bold">{s.label}</div>
            <div className="text-[10px] opacity-80 mt-0.5 truncate font-medium">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Interactive Scene Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>장면별 대본 & 팩트체크 시각 수치 ({project.scenes.length}개 장면)</span>
          </div>
          <button
            onClick={() => addScene('solution')}
            className="btn-secondary flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            장면 추가
          </button>
        </div>

        {project.scenes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-500">작성된 대본이 없습니다. 버튼을 눌러 생성하거나 직접 붙여넣으세요.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleAIGenerateScript}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Gemini AI로 대본 생성
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                직접 텍스트 붙여넣기
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.scenes.map((scene, idx) => {
              const currentStage = STAGES.find((s) => s.id === scene.stage) || STAGES[3];
              const isExpanded = expandedSceneId === scene.id;

              return (
                <div key={scene.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                  {/* Top line: Scene Number, Stage Select, Timecode, Metric Label */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </span>
                      <select
                        value={scene.stage}
                        onChange={(e) => updateScene(idx, { stage: e.target.value as NarrativeStage })}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border focus:outline-none ${currentStage.color}`}
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] font-mono font-medium text-slate-500">{scene.timecode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Metric / Spec Label Tag */}
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs" title="화면에 3D 인포그래픽으로 띄울 핵심 수치">
                        <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <input
                          type="text"
                          value={scene.metricLabel}
                          onChange={(e) => updateScene(idx, { metricLabel: e.target.value })}
                          placeholder="시각 수치 (예: 무게 185g)"
                          className="bg-transparent text-xs text-indigo-900 placeholder-slate-400 focus:outline-none w-36 font-semibold"
                        />
                      </div>

                      {/* Prompt details collapse toggle */}
                      <button
                        onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[11px] flex items-center gap-1 border border-slate-200"
                        title="Google Flow 프롬프트 세부사항 보기"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-medium">프롬프트</span>
                      </button>

                      {/* Delete scene */}
                      <button
                        onClick={() => deleteScene(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
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
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed font-sans transition-colors"
                    />
                  </div>

                  {/* Bottom: Speech Style & Quick Inline Sound Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Mic className="w-3 h-3 text-indigo-600" />
                      <span>TTS 스타일:</span>
                      <select
                        value={scene.speechStyle}
                        onChange={(e) => updateScene(idx, { speechStyle: e.target.value })}
                        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-800 focus:outline-none font-medium"
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
                      <span className="text-slate-400 text-[10px] font-medium">호흡 태그 삽입:</span>
                      <button
                        onClick={() => insertTag(idx, '<short pause>')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-[10px] text-slate-700 font-mono font-medium hover:text-indigo-700 hover:border-indigo-200"
                      >
                        + &lt;short pause&gt;
                      </button>
                      <button
                        onClick={() => insertTag(idx, '<breath>')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-[10px] text-slate-700 font-mono font-medium hover:text-indigo-700 hover:border-indigo-200"
                      >
                        + &lt;breath&gt;
                      </button>
                    </div>
                  </div>

                  {/* Expanded Prompt Editor (Optional detail) */}
                  {isExpanded && (
                    <div className="p-3 mt-2 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] animate-fadeIn">
                      <div>
                        <span className="text-slate-700 font-bold block mb-0.5">1차 베이스 이미지 프롬프트 (Nano Banana 2):</span>
                        <input
                          type="text"
                          value={scene.basePrompt}
                          onChange={(e) => updateScene(idx, { basePrompt: e.target.value })}
                          placeholder="글자/화살표 없는 3D/시네마틱 배경 프롬프트..."
                          className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[10px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-700 font-bold block mb-0.5">2차 3D 인포그래픽 오버레이 프롬프트 (Nano Banana 2):</span>
                        <input
                          type="text"
                          value={scene.infographicPrompt}
                          onChange={(e) => updateScene(idx, { infographicPrompt: e.target.value })}
                          placeholder="굵은 화살표, 계측선, 수치 배치 지시..."
                          className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[10px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-700 font-bold block mb-0.5">3차 키프레임 모션 비디오 프롬프트 (Omni 1.1 Flash):</span>
                        <input
                          type="text"
                          value={scene.motionPrompt}
                          onChange={(e) => updateScene(idx, { motionPrompt: e.target.value })}
                          placeholder="카메라 Pan, Push-in, 작동 모션..."
                          className="w-full px-2 py-1.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[10px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topic Expansion Section */}
      {project.topicExpansions && project.topicExpansions.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl space-y-3 bg-white border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            연관 후속 시리즈 확장 기획안 (3~5선)
          </h3>
          <p className="text-[11px] text-slate-600 font-medium">
            원천 자료 1건에서 추출된 후속 영상 아이디어입니다. 클릭 시 해당 주제로 새 프로젝트를 바로 시작할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {project.topicExpansions.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold mb-1">
                    <span>{exp.targetDuration}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5 leading-snug">{exp.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{exp.summary}</p>
                </div>
                <button
                  onClick={() => onCreateProjectFromTopic(exp)}
                  className="mt-3 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-all"
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
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs tracking-wide shadow-md active:scale-[0.98]"
        >
          <span>음성(TTS) 및 장면 분할 계산으로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-500" />
                대본 직접 붙여넣기 (텍스트 또는 JSON)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-medium">
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
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
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono leading-relaxed transition-colors"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleImportText}
                className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
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
