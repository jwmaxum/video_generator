'use client';

import React, { useState } from 'react';
import {
  VideoProject,
  VideoCategory,
} from '@/types/video-project';
import {
  Film,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  Download,
  Upload,
  Key,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  projects: VideoProject[];
  activeProject: VideoProject;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: VideoProject) => void;
  onImportProjects: (imported: VideoProject[]) => void;
}

export function Sidebar({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProjects,
}: SidebarProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
      if (savedKey) {
        setHasApiKey(true);
        setApiKeyInput(savedKey);
      }
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('GEMINI_API_KEY', apiKeyInput.trim());
      setHasApiKey(Boolean(apiKeyInput.trim()));
      setShowApiKeyModal(false);
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_video_projects_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportProjects(parsed);
          alert(`${parsed.length}개 프로젝트를 성공적으로 불러왔습니다.`);
        }
      } catch (err) {
        alert('올바른 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  const getCategoryBadge = (cat: VideoCategory) => {
    const map: Record<VideoCategory, { label: string; color: string }> = {
      product: { label: '제품', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      service: { label: '서비스', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
      tech: { label: 'IT·테크', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
      knowledge: { label: '지식', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      architecture: { label: '건축', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      general: { label: '범용', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    };
    const item = map[cat] || map.general;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  return (
    <aside className="w-72 bg-[#0e111a] border-r border-white/10 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Video Studio
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">반자동 영상 파이프라인</p>
          </div>
        </div>
      </div>

      {/* Mode Status Banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent border-b border-white/5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">API & 무료/수동 듀얼 모드</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">활성화</span>
        </div>
      </div>

      {/* Project Action Bar */}
      <div className="p-3 border-b border-white/5 flex gap-1.5">
        <button
          onClick={onCreateProject}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          새 프로젝트
        </button>
        <label className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer transition-all" title="JSON 프로젝트 백업 불러오기">
          <Upload className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>
        <button
          onClick={handleExportBackup}
          className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
          title="전체 프로젝트 JSON 내보내기"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>프로젝트 목록 ({projects.length})</span>
          <FolderOpen className="w-3 h-3 text-slate-400" />
        </div>

        {projects.map((proj) => {
          const isActive = proj.id === activeProject.id;
          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className={`group relative p-2.5 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-lg shadow-indigo-950/50'
                  : 'hover:bg-white/5 text-slate-300 border border-transparent hover:border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getCategoryBadge(proj.category)}
                    <span className="text-[10px] text-slate-400">
                      {proj.aspectRatio} · {proj.targetDurationSeconds}초
                    </span>
                  </div>
                  <h3 className="text-xs font-medium truncate text-slate-100 group-hover:text-white">
                    {proj.title || '무제 프로젝트'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>씬 {proj.scenes?.length || 0}개</span>
                    <span>·</span>
                    <span>{proj.actualAudioDurationSeconds ? `${proj.actualAudioDurationSeconds}s 오디오` : '오디오 미생성'}</span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateProject(proj);
                    }}
                    title="프로젝트 복제"
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${proj.title}' 프로젝트를 삭제하시겠습니까?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="프로젝트 삭제"
                      className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Global Settings */}
      <div className="p-3 border-t border-white/10 bg-[#0a0c13] space-y-2">
        {/* API Key Status Pill */}
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-slate-200">Gemini API 키</span>
          </div>
          {hasApiKey ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> 설정됨
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <AlertCircle className="w-3 h-3" /> 수동/미설정
            </span>
          )}
        </button>

        <div className="px-1 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Google Flow 3-Stage Pipeline</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121624] border border-white/15 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Gemini API 키 설정
              </h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Google AI Studio에서 발급받은 <code className="text-indigo-300">GEMINI_API_KEY</code>를 입력하시면 원클릭 대본 생성 및 Gemini 3.8 Flash TTS 자동 합성이 활성화됩니다.
            </p>
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200">
              💡 <strong>안내:</strong> API 키가 없어도 직접 대본을 작성하거나 무료 TTS(타입캐스트, 브루, 캡컷) 오디오 파일을 업로드하여 100% 정상 이용하실 수 있습니다.
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0c13] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              >
                취소
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/30"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
