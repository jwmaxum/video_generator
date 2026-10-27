'use client';

import React, { useState } from 'react';
import { VideoProject, VideoScene } from '@/types/video-project';
import { generateProjectMarkdown } from '@/lib/markdown-generator';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  List,
  Clock,
  Edit3,
} from 'lucide-react';

interface Step4PromptsProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
}

const VISUAL_STYLES = [
  {
    id: '3d-cinematic',
    name: '3D 시네마틱 렌더링',
    prompt: 'Ultra-modern 3D product cinematic rendering, studio softbox lighting, clean studio background, 8k resolution',
  },
  {
    id: 'photoreal',
    name: '극실사 상업 광고',
    prompt: 'Hyper-realistic commercial photography, macro depth of field, 85mm lens, natural golden hour lighting',
  },
  {
    id: 'vox-motion',
    name: 'Vox 스타일 모션 그래픽',
    prompt: 'Vox-style clean isometric illustration, dynamic paper cut-out layers, vibrant modern color palette',
  },
  {
    id: 'tech-wireframe',
    name: '미래형 테크 와이어프레임',
    prompt: 'Futuristic technical blueprint, glowing holographic wireframe and dynamic cyber particle grid',
  },
];

export function Step4Prompts({ project, onUpdateProject, onNextStep }: Step4PromptsProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'test3' | 'step1' | 'step2' | 'step3'>('test3');
  const [viewMode, setViewMode] = useState<'bulk' | 'scenes'>('bulk');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // 복사 핸들러
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // 1차 베이스 이미지 프롬프트 전체 텍스트
  const getStep1Text = () => {
    let t = `[공통 스타일 기준]: ${project.globalVisualStyle || VISUAL_STYLES[0].prompt}, Aspect Ratio ${project.aspectRatio}, No text, no arrows, no infographic overlays, clean 3D/cinematic rendering.\n\n`;
    project.scenes.forEach((sc) => {
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')}]: ${sc.basePrompt || 'Clean visual matching ' + sc.script}\n`;
    });
    return t;
  };

  // 2차 인포그래픽 오버레이 프롬프트 전체 텍스트
  const getStep2Text = () => {
    let t = `방금 생성된 각 장면의 베이스 이미지를 기준 레이어로 사용하여, 핵심 스펙과 작동 원리를 강조하는 3D 인포그래픽 오버레이 이미지를 생성해 줘.\n- 굵고 선명한 3D 입체 화살표 및 동적 치수선/계측선(Dimension Lines) 추가\n- 주요 부위에 핵심 수치와 한글 설명 레이블을 입체감 있게 배치\n\n`;
    project.scenes.forEach((sc) => {
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Overlay]: 화면 중앙 ${sc.metricLabel || '핵심 지표'} 강조, ${sc.infographicPrompt || '3D 치수선 및 레이블 오버레이'}\n`;
    });
    return t;
  };

  // 3차 모션 비디오 프롬프트 전체 텍스트
  const getStep3Text = () => {
    let t = `1차 베이스 이미지와 2차 인포그래픽 이미지를 기준 키프레임으로 결합하여 ${project.videoClipDuration}초 동영상 클립을 생성해 줘. (비율: ${project.aspectRatio}, 모델: Omni 1.1 Flash, 생성 개수: 1)\n\n`;
    project.scenes.forEach((sc, idx) => {
      const tag = idx === 0 ? '' : '첨부된 이전 장면 마지막 프레임(@image)을 첫 프레임으로 사용하여 연속성 유지. ';
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Video]: ${tag}${sc.motionPrompt || 'Dynamic motion with smooth camera transitions'}\n`;
    });
    return t;
  };

  // 초반 3개 씬 사전 테스트용 프롬프트 (크레딧 절약용)
  const getTest3ScenesText = () => {
    const testScenes = project.scenes.slice(0, 3);
    let t = `=== [초반 3개 장면 스타일 사전 검증용 프롬프트 (크레딧 절약)] ===\n`;
    t += `[공통 스타일]: ${project.globalVisualStyle || VISUAL_STYLES[0].prompt}, Aspect Ratio ${project.aspectRatio}, No text, no infographic.\n\n`;
    testScenes.forEach((sc) => {
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Base (Nano Banana 2)]: ${sc.basePrompt || sc.script}\n`;
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Overlay (Nano Banana 2)]: ${sc.metricLabel} 강조 - ${sc.infographicPrompt}\n`;
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Video (Omni 1.1 Flash)]: ${sc.motionPrompt}\n\n`;
    });
    return t;
  };

  // AI 3단계 프롬프트 자동 생성 호출
  const handleGeneratePrompts = async () => {
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/generate-flow-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: project.scenes,
          category: project.category,
          aspectRatio: project.aspectRatio,
          globalVisualStyle: project.globalVisualStyle || VISUAL_STYLES[0].prompt,
          videoClipDuration: project.videoClipDuration || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '프롬프트 생성 실패');
      }

      if (data.scenes && Array.isArray(data.scenes)) {
        onUpdateProject({ scenes: data.scenes });
      }

      if (data.isAiGenerated) {
        setStatusMessage('✨ Gemini 3.8 Flash가 Google Flow 3단계 영문 마스터 프롬프트를 성공적으로 완성했습니다.');
      } else {
        setStatusMessage(`✅ ${data.warning || 'Google Flow 규격에 맞춘 3단계 마스터 프롬프트가 정밀 합성되었습니다.'}`);
      }
    } catch (err: any) {
      setStatusMessage(`⚠️ 프롬프트 생성 오류: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 단일 씬 프롬프트 업데이트
  const handleUpdateScenePrompt = (sceneId: string, field: 'basePrompt' | 'infographicPrompt' | 'motionPrompt', value: string) => {
    const updated = project.scenes.map((sc) => {
      if (sc.id === sceneId) {
        return { ...sc, [field]: value };
      }
      return sc;
    });
    onUpdateProject({ scenes: updated });
  };

  // 생성할_Video.md 다운로드
  const handleDownloadMarkdown = () => {
    const md = generateProjectMarkdown(project);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_Video.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                STEP 04
              </span>
              <span className="text-xs text-slate-500 font-medium">Google Flow 3단계 프롬프트 & 마스터 MD</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Google Flow 일괄 추출 & 마크다운 내보내기
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              1차(순수 베이스 - Nano Banana 2) ➔ 2차(인포그래픽 오버레이 - Nano Banana 2) ➔ 3차(Omni Flash 동영상 모션) 프롬프트가 모두 준비되었습니다. 원클릭으로 복사하여 Google Flow에 바로 붙여넣으세요.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGeneratePrompts}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? '프롬프트 생성 중...' : '3단계 프롬프트 자동 생성'}</span>
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-600 border border-slate-200 bg-slate-50"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              MD 미리보기
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              생성할_Video.md 다운로드
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-800">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Credit Saving Alert Callout */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-900">💡 Google Flow 크레딧 절약 필수 팁</h4>
          <p className="text-amber-800 leading-relaxed">
            처음부터 {project.scenes.length}개 전체 장면을 돌리지 마시고, 아래 <strong>[초반 3개 씬 테스트 프롬프트]</strong>를 먼저 복사해 Google Flow(Nano Banana 2)에서 비주얼 톤을 확인한 후 마음에 들면 전체 일괄 생성을 진행하세요. (에이전트 확인: 안함 / 생성 개수: 1 설정 필수)
          </p>
        </div>
      </div>

      {/* Controls: Visual Style Preset & Clip Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visual Style Selector */}
        <div className="md:col-span-2 glass-panel p-4 rounded-2xl space-y-2 bg-white border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>글로벌 비주얼 스타일 프리셋</span>
            <span className="text-[11px] text-slate-500 font-normal">프롬프트 공통 기준에 반영</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VISUAL_STYLES.map((st) => {
              const isSelected = project.globalVisualStyle === st.prompt;
              return (
                <button
                  key={st.id}
                  onClick={() => onUpdateProject({ globalVisualStyle: st.prompt })}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-semibold">{st.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{st.prompt}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Clip Duration Setting */}
        <div className="glass-panel p-4 rounded-2xl space-y-2 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                모션 클립 길이 (초)
              </span>
              <span className="text-indigo-700 font-bold font-mono">{project.videoClipDuration || 4}초</span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1">Omni 1.1 Flash 렌더링 단위 길이</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-2">
            {[4, 8, 10].map((dur) => (
              <button
                key={dur}
                onClick={() => onUpdateProject({ videoClipDuration: dur })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  (project.videoClipDuration || 4) === dur
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {dur}초
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Switcher Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">프롬프트 출력 모드</span>
          <span className="text-[11px] text-slate-500">총 {project.scenes.length}개 장면 구성</span>
        </div>
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('bulk')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'bulk' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            일괄 복사 뷰
          </button>
          <button
            onClick={() => setViewMode('scenes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'scenes' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            장면별 카드 뷰
          </button>
        </div>
      </div>

      {/* Mode 1: Bulk Copy Tabs */}
      {viewMode === 'bulk' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {/* Sub Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('test3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'test3'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              ⚡ 초반 3개 씬 테스트 (크레딧 절약)
            </button>
            <button
              onClick={() => setActiveTab('step1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'step1'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              1차: 베이스 이미지 ({project.scenes.length}개)
            </button>
            <button
              onClick={() => setActiveTab('step2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'step2'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              2차: 3D 인포그래픽 오버레이
            </button>
            <button
              onClick={() => setActiveTab('step3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'step3'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              3차: 키프레임 모션 비디오
            </button>
          </div>

          {/* Tab Content & Copy Area */}
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {activeTab === 'test3' && 'Google Flow에 붙여넣어 초반 3개 장면의 스타일을 먼저 검증하세요.'}
                {activeTab === 'step1' && 'Nano Banana 2 모델에 붙여넣어 텍스트 없는 순수 비주얼을 생성하세요.'}
                {activeTab === 'step2' && '1차 생성 이미지를 레이어로 삼아 3D 화살표와 수치를 얹으세요.'}
                {activeTab === 'step3' && 'Omni 1.1 Flash 모델에 입력하여 모션 비디오를 일괄 생성하세요.'}
              </span>

              <button
                onClick={() => {
                  const text =
                    activeTab === 'test3'
                      ? getTest3ScenesText()
                      : activeTab === 'step1'
                      ? getStep1Text()
                      : activeTab === 'step2'
                      ? getStep2Text()
                      : getStep3Text();
                  copyToClipboard(text, activeTab);
                }}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
              >
                {copiedType === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>이 블록 전체 복사</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all shadow-inner">
              {activeTab === 'test3' && getTest3ScenesText()}
              {activeTab === 'step1' && getStep1Text()}
              {activeTab === 'step2' && getStep2Text()}
              {activeTab === 'step3' && getStep3Text()}
            </pre>
          </div>
        </div>
      )}

      {/* Mode 2: Per-Scene Card View */}
      {viewMode === 'scenes' && (
        <div className="space-y-4">
          {project.scenes.map((scene) => (
            <div
              key={scene.id}
              className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    Scene {String(scene.sceneNumber).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                    {scene.timecode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                    {scene.stage.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs font-bold text-indigo-700">
                  지표: {scene.metricLabel || '-'}
                </div>
              </div>

              <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                <span className="text-slate-500 font-semibold mr-1.5">[나레이션]:</span>
                {scene.script}
              </div>

              {/* 3 Prompts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1st Base Image */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-indigo-600" /> 1차 베이스 이미지
                      </span>
                      <button
                        onClick={() => copyToClipboard(scene.basePrompt || '', `sc-${scene.id}-base`)}
                        className="text-[10px] text-slate-500 hover:text-indigo-700 flex items-center gap-0.5 font-medium"
                      >
                        {copiedType === `sc-${scene.id}-base` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedType === `sc-${scene.id}-base` ? '복사됨' : '복사'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={scene.basePrompt || ''}
                      onChange={(e) => handleUpdateScenePrompt(scene.id, 'basePrompt', e.target.value)}
                      placeholder="1차 베이스 이미지 프롬프트..."
                      className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">모델: Nano Banana 2 (순수 3D/오브젝트)</span>
                </div>

                {/* 2nd Infographic Overlay */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-600" /> 2차 3D 인포그래픽
                      </span>
                      <button
                        onClick={() => copyToClipboard(scene.infographicPrompt || '', `sc-${scene.id}-info`)}
                        className="text-[10px] text-slate-500 hover:text-indigo-700 flex items-center gap-0.5 font-medium"
                      >
                        {copiedType === `sc-${scene.id}-info` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedType === `sc-${scene.id}-info` ? '복사됨' : '복사'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={scene.infographicPrompt || ''}
                      onChange={(e) => handleUpdateScenePrompt(scene.id, 'infographicPrompt', e.target.value)}
                      placeholder="2차 인포그래픽 오버레이 프롬프트..."
                      className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">모델: Nano Banana 2 (화살표/수치/계측선)</span>
                </div>

                {/* 3rd Motion Video */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Video className="w-3 h-3 text-indigo-600" /> 3차 키프레임 모션 비디오
                      </span>
                      <button
                        onClick={() => copyToClipboard(scene.motionPrompt || '', `sc-${scene.id}-motion`)}
                        className="text-[10px] text-slate-500 hover:text-indigo-700 flex items-center gap-0.5 font-medium"
                      >
                        {copiedType === `sc-${scene.id}-motion` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedType === `sc-${scene.id}-motion` ? '복사됨' : '복사'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={scene.motionPrompt || ''}
                      onChange={(e) => handleUpdateScenePrompt(scene.id, 'motionPrompt', e.target.value)}
                      placeholder="3차 모션 비디오 프롬프트..."
                      className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">모델: Omni 1.1 Flash (@image 키프레임)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextStep}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs tracking-wide shadow-md active:scale-[0.98]"
        >
          <span>비디오 자동 넘버링 및 최종 편집으로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Markdown Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                생성할_Video.md 마스터 파일 미리보기
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  파일 다운로드 (.md)
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1 font-semibold rounded-lg hover:bg-slate-100"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {generateProjectMarkdown(project)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
