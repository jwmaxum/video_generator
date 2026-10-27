'use client';

import React, { useState } from 'react';
import { VideoProject } from '@/types/video-project';
import { generateProjectMarkdown } from '@/lib/markdown-generator';
import {
  Scissors,
  FolderOpen,
  CheckCircle2,
  FileVideo,
  ListOrdered,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Music,
  FileText,
  FlaskConical,
} from 'lucide-react';

interface Step5RenamerProps {
  project: VideoProject;
}

interface VideoFileItem {
  id: string;
  originalName: string;
  newName: string;
  sceneNumber: number;
  size: string;
  isRealFile?: boolean;
}

export function Step5Renamer({ project }: Step5RenamerProps) {
  const [folderPath, setFolderPath] = useState('C:\\Users\\Microsoft\\Downloads\\Google_Flow_Exports');
  const [isScanning, setIsScanning] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [isRealScan, setIsRealScan] = useState(false);

  // 시뮬레이션 및 로드된 파일 리스트
  const [files, setFiles] = useState<VideoFileItem[]>(() => {
    return project.scenes.map((scene, idx) => ({
      id: `file-${idx + 1}`,
      originalName: `flow_clip_${Math.random().toString(36).substring(2, 8)}_${scene.id}.mp4`,
      newName: `${String(idx + 1).padStart(2, '0')}_Scene${String(idx + 1).padStart(2, '0')}_${(scene.metricLabel || scene.stage).replace(/[^a-zA-Z0-9가-힣_]/g, '')}.mp4`,
      sceneNumber: idx + 1,
      size: `${(Math.random() * 4 + 8).toFixed(1)} MB`,
      isRealFile: false,
    }));
  });

  // 로컬 폴더 스캔
  const handleScanFolder = async () => {
    setIsScanning(true);
    setRenameSuccess(false);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/rename-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          folderPath,
          scenes: project.scenes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files);
        setIsRealScan(!!data.isReal);
        setStatusMessage(data.message || '폴더 스캔이 완료되었습니다.');
      } else {
        setStatusMessage(data.error || '폴더 스캔 중 문제가 발생했습니다.');
      }
    } catch (err: any) {
      setStatusMessage(`스캔 오류: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // 테스트용 샘플 폴더 및 더미 비디오 파일 생성
  const handleCreateSampleFolder = async () => {
    setIsCreatingSample(true);
    setStatusMessage(null);

    try {
      const samplePath = 'C:\\Users\\Microsoft\\Downloads\\Google_Flow_Exports';
      setFolderPath(samplePath);

      const res = await fetch('/api/rename-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-sample-folder',
          folderPath: samplePath,
          scenes: project.scenes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files);
        setIsRealScan(true);
        setStatusMessage(`🧪 테스트용 ${data.files.length}개 비디오 클립이 생성되었습니다 (${samplePath}). 즉시 일괄 번호 부여를 테스트하실 수 있습니다.`);
      } else {
        setStatusMessage(data.error || '샘플 생성 실패');
      }
    } catch (err: any) {
      setStatusMessage(`샘플 생성 오류: ${err.message}`);
    } finally {
      setIsCreatingSample(false);
    }
  };

  // 일괄 리네이밍 및 음성/MD 동기화 실행
  const handleExecuteRenaming = async () => {
    setIsRenaming(true);
    setRenameSuccess(false);
    setStatusMessage(null);

    try {
      const mdContent = generateProjectMarkdown(project);

      const res = await fetch('/api/rename-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          folderPath,
          files,
          projectId: project.id,
          projectTitle: project.title,
          markdownContent: mdContent,
          audioUrl: project.audioUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.files) {
          setFiles(data.files);
        }
        setRenameSuccess(true);
        setStatusMessage(data.message || '일괄 리네이밍 및 파일 동기화가 성공적으로 완료되었습니다.');
      } else {
        setStatusMessage(data.error || '리네이밍 실패');
      }
    } catch (err: any) {
      setStatusMessage(`리네이밍 오류: ${err.message}`);
    } finally {
      setIsRenaming(false);
    }
  };

  // 클립 순서 위/아래 이동
  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;

    // 재정렬 후 대본 순서 기반 번호 재할당
    const renumbered = newFiles.map((f, i) => {
      const sc = project.scenes[i];
      const cleanLabel = (sc?.metricLabel || sc?.stage || 'clip').replace(/[^a-zA-Z0-9가-힣_]/g, '');
      return {
        ...f,
        sceneNumber: i + 1,
        newName: `${String(i + 1).padStart(2, '0')}_Scene${String(i + 1).padStart(2, '0')}_${cleanLabel || 'video'}.mp4`,
      };
    });

    setFiles(renumbered);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                STEP 05
              </span>
              <span className="text-xs text-slate-500 font-medium">다운로드 비디오 자동 정렬 & 최종 편집 연동</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              01_, 02_ 클립 일괄 넘버링 & 편집기 조립
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Google Flow에서 다운로드한 무작위 이름의 `.mp4` 클립들을 대본 순서대로 정렬하여 두 자리 접두사를 붙여 실제 디스크 파일명을 리네이밍합니다. <code>00_narration.wav</code>와 <code>생성할_Video.md</code>도 한 폴더에 자동 동기화되어 CapCut / Vrew에 바로 드래그앤드롭할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCreateSampleFolder}
              disabled={isCreatingSample}
              className="btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-slate-200 bg-slate-50 flex items-center gap-1.5 shadow-xs"
              title="로컬 다운로드 폴더에 테스트용 더미 영상 파일들을 자동 생성합니다"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              <span>{isCreatingSample ? '샘플 생성 중...' : '테스트 샘플 클립 생성'}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs ${
            isRealScan || renameSuccess
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            {isRealScan || renameSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Folder Input Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-3 bg-white border border-slate-200 shadow-sm">
        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            Google Flow 다운로드 파일 보관 폴더 경로
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded font-semibold ${isRealScan ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {isRealScan ? '● 로컬 디스크 연결됨' : '○ 시뮬레이션 모드'}
            </span>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="C:\Users\Downloads\Google_Flow_Exports"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <button
            onClick={handleScanFolder}
            disabled={isScanning}
            className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? '스캔 중...' : '폴더 스캔'}
          </button>
          <button
            onClick={handleExecuteRenaming}
            disabled={isRenaming}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-all"
          >
            <ListOrdered className="w-4 h-4" />
            {isRenaming ? '일괄 리네이밍 중...' : '01_, 02_ 일괄 번호 부여 실행'}
          </button>
        </div>

        {renameSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs text-emerald-900 shadow-xs">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{files.length}개 비디오 클립이 대본 순서대로 안전하게 리네이밍되었습니다!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-800">
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>01_, 02_ 클립 넘버링 완료</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <Music className="w-3.5 h-3.5 text-indigo-600" />
                <span>00_narration.wav 동기화 완료</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>[프로젝트]_Video.md 생성 완료</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Matching Board: Scenes (Left) vs Video Files (Right) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Scissors className="w-4 h-4 text-indigo-600" />
            <span>대본 씬과 비디오 파일 1:1 매칭 보드 ({files.length}개 클립)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            화살표(▲/▼) 버튼으로 파일 매칭 순서를 자유롭게 교체할 수 있습니다
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {project.scenes.map((scene, idx) => {
            const file = files[idx];
            return (
              <div key={scene.id} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center hover:bg-slate-50/60 transition-all">
                {/* Left: Scene Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      Scene {String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 font-semibold">{scene.timecode}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                      {scene.metricLabel || scene.stage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    {scene.script || '(대본 없음)'}
                  </p>
                </div>

                {/* Right: Matched Video Clip */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-700 font-mono truncate">
                        {file ? file.newName : `0${idx + 1}_Scene.mp4`}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                        <span>원본: {file ? file.originalName : '다운로드 대기 중'}</span>
                        <span className="text-slate-400">({file?.size || '9.2 MB'})</span>
                        {file?.isRealFile && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-semibold">실제파일</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveFile(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 text-xs font-bold"
                      title="위로 이동"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveFile(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 text-xs font-bold"
                      title="아래로 이동"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CapCut / Vrew Post-Production Checklist Card */}
      <div className="glass-panel p-5 rounded-2xl space-y-3 bg-white border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          캡컷(CapCut) / 브루(Vrew) 초고속 타임라인 조립 체크리스트
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 font-mono">STEP 1</span>
            <h4 className="text-xs font-bold text-slate-900">이름순 (A-Z) 드래그</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              폴더 내 리네이밍된 클립들을 이름순으로 정렬하여 편집기 비디오 트랙에 한 번에 드래그앤드롭합니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 font-mono">STEP 2</span>
            <h4 className="text-xs font-bold text-slate-900">00_narration.wav 배치</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              오디오 트랙 맨 앞에 나레이션 음성을 배치하면 영상 씬 타임코드와 정확하게 동기화됩니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 font-mono">STEP 3</span>
            <h4 className="text-xs font-bold text-slate-900">클립 기본 음량 조절</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Omni 비디오 클립에 포함된 생성 사운드가 있을 경우 볼륨을 0 또는 낮춤으로 조절합니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 font-mono">STEP 4</span>
            <h4 className="text-xs font-bold text-slate-900">자동 자막 및 최종 출력</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              [자동 캡션] 실행 ➔ 폰트 스타일 적용 ➔ 4K / 1080p로 최종 렌더링 내보내기를 완료합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
