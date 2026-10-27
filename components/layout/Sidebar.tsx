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
      } catch {
        alert('올바른 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  const getCategoryBadge = (cat: VideoCategory) => {
    const map: Record<VideoCategory, { label: string; color: string }> = {
      product: { label: '제품', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      service: { label: '서비스', color: 'bg-sky-50 text-sky-700 border-sky-200' },
      tech: { label: 'IT·테크', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      knowledge: { label: '지식', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      architecture: { label: '건축', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      general: { label: '범용', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const item = map[cat] || map.general;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${item.color}`}>
        {item.label}
      </span>
    );
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Video Studio
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">반자동 영상 파이프라인</p>
          </div>
        </div>
      </div>

      {/* Mode Status Banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-transparent border-b border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px]">API & 무료/수동 듀얼 모드</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            활성화
          </span>
        </div>
      </div>

      {/* Project Action Bar */}
      <div className="p-3 border-b border-slate-100 flex gap-1.5 bg-slate-50/50">
        <button
          onClick={onCreateProject}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          새 프로젝트
        </button>
        <label className="flex items-center justify-center p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-xs transition-all" title="JSON 프로젝트 백업 불러오기">
          <Upload className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>
        <button
          onClick={handleExportBackup}
          className="flex items-center justify-center p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-all"
          title="전체 프로젝트 JSON 내보내기"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getCategoryBadge(proj.category)}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {proj.aspectRatio} · {proj.targetDurationSeconds}초
                    </span>
                  </div>
                  <h3 className={`text-xs font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-slate-900'}`}>
                    {proj.title || '무제 프로젝트'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
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
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800"
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
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
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
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {/* API Key Status Pill */}
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-medium text-slate-700">Gemini API 키</span>
          </div>
          {hasApiKey ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> 설정됨
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
              <AlertCircle className="w-3 h-3" /> 수동/미설정
            </span>
          )}
        </button>

        <div className="px-1 text-[10px] text-slate-500 flex items-center justify-between font-medium">
          <span>Google Flow 3-Stage Pipeline</span>
          <span>Light Mode</span>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Gemini API 키 설정
              </h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Google AI Studio에서 발급받은 <code className="text-indigo-600 font-semibold bg-indigo-50 px-1 py-0.5 rounded">GEMINI_API_KEY</code>를 입력하시면 Gemini 3.8 Flash 대본 및 TTS 자동 합성이 활성화됩니다.
            </p>
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900">
              💡 <strong>안내:</strong> API 키가 없어도 직접 대본을 작성하거나 무료 TTS(타입캐스트, Vrew, CapCut 등) 오디오 파일을 업로드하여 100% 정상 이용하실 수 있습니다.
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSaveApiKey}
                className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
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
