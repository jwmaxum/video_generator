'use client';

import React, { useState } from 'react';
import { VideoProject } from '@/types/video-project';
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
} from 'lucide-react';

interface Step4PromptsProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onNextStep: () => void;
}

const VISUAL_STYLES = [
  { id: '3d-cinematic', name: '3D 시네마틱 렌더링', prompt: 'Ultra-modern 3D product cinematic rendering, studio softbox lighting, clean studio background, 8k resolution' },
  { id: 'photoreal', name: '극실사 상업 광고', prompt: 'Hyper-realistic commercial photography, macro depth of field, 85mm lens, natural golden hour lighting' },
  { id: 'vox-motion', name: 'Vox 스타일 모션 그래픽', prompt: 'Vox-style clean isometric illustration, dynamic paper cut-out layers, vibrant modern color palette' },
  { id: 'tech-wireframe', name: '미래형 테크 와이어프레임', prompt: 'Futuristic technical blueprint, glowing holographic wireframe and dynamic cyber particle grid' },
];

export function Step4Prompts({ project, onUpdateProject, onNextStep }: Step4PromptsProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'step1' | 'step2' | 'step3' | 'test3'>('test3');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Base]: ${sc.basePrompt || sc.script}\n`;
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Overlay]: ${sc.metricLabel} 강조 - ${sc.infographicPrompt}\n`;
      t += `[Scene ${String(sc.sceneNumber).padStart(2, '0')} Video]: ${sc.motionPrompt}\n\n`;
    });
    return t;
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
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STEP 04
              </span>
              <span className="text-xs text-slate-400">Google Flow 3단계 프롬프트 & 마스터 MD</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Google Flow 일괄 추출 & 마크다운 내보내기
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              1차(순수 베이스) ➔ 2차(인포그래픽 오버레이) ➔ 3차(Omni Flash 동영상 모션) 프롬프트가 모두 준비되었습니다. 원클릭으로 복사하여 Google Flow에 바로 붙여넣으세요.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              MD 미리보기
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg"
            >
              <Download className="w-4 h-4" />
              생성할_Video.md 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* Credit Saving Alert Callout */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300">💡 Google Flow 크레딧 절약 필수 팁</h4>
          <p className="text-slate-300 leading-relaxed">
            처음부터 {project.scenes.length}개 전체 장면을 돌리지 마시고, 아래 <strong>[초반 3개 씬 테스트 프롬프트]</strong>를 먼저 복사해 Google Flow(Nano Banana 2)에서 비주얼 톤을 확인한 후 마음에 들면 전체 일괄 생성을 진행하세요. (에이전트 확인: 안함 / 생성 개수: 1 설정 필수)
          </p>
        </div>
      </div>

      {/* Visual Style Selector */}
      <div className="glass-panel p-4 rounded-2xl space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>글로벌 비주얼 스타일 프리셋</span>
          <span className="text-[11px] text-slate-400">프롬프트 공통 기준에 반영됩니다</span>
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
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">{st.name}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{st.prompt}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Blocks Tabbed Card */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {/* Sub Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.02] p-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('test3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'test3' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            초반 3개 씬 테스트 (크레딧 절약)
          </button>
          <button
            onClick={() => setActiveTab('step1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'step1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            1차: 베이스 이미지 ({project.scenes.length}개)
          </button>
          <button
            onClick={() => setActiveTab('step2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'step2' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2차: 3D 인포그래픽 오버레이
          </button>
          <button
            onClick={() => setActiveTab('step3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'step3' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            3차: 키프레임 모션 비디오
          </button>
        </div>

        {/* Tab Content & Copy Area */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
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
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white"
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

          <pre className="p-4 rounded-xl bg-[#08090e] border border-white/10 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all">
            {activeTab === 'test3' && getTest3ScenesText()}
            {activeTab === 'step1' && getStep1Text()}
            {activeTab === 'step2' && getStep2Text()}
            {activeTab === 'step3' && getStep3Text()}
          </pre>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNextStep}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs tracking-wide shadow-lg active:scale-[0.98]"
        >
          <span>비디오 자동 넘버링 및 최종 편집으로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Markdown Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#121624] border border-white/15 rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                생성할_Video.md 마스터 파일 미리보기
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  파일 다운로드
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white text-xs px-2">
                  닫기
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[#08090e] border border-white/10">
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {generateProjectMarkdown(project)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
