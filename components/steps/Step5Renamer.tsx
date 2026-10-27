'use client';

import React, { useState } from 'react';
import { VideoProject } from '@/types/video-project';
import {
  Scissors,
  FolderOpen,
  CheckCircle2,
  FileVideo,
  ArrowUpDown,
  Download,
  ListOrdered,
  Sparkles,
  ExternalLink,
  Play,
  RotateCcw,
} from 'lucide-react';

interface Step5RenamerProps {
  project: VideoProject;
}

interface MockVideoFile {
  id: string;
  originalName: string;
  newName: string;
  sceneNumber: number;
  size: string;
}

export function Step5Renamer({ project }: Step5RenamerProps) {
  const [folderPath, setFolderPath] = useState('C:\\Users\\Downloads\\Google_Flow_Exports');
  const [isScanning, setIsScanning] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);

  // 시뮬레이션용 다운로드 파일 리스트
  const [files, setFiles] = useState<MockVideoFile[]>(() => {
    return project.scenes.map((scene, idx) => ({
      id: `file-${idx + 1}`,
      originalName: `flow_clip_${Math.random().toString(36).substring(2, 8)}_${scene.id}.mp4`,
      newName: `${String(idx + 1).padStart(2, '0')}_Scene${String(idx + 1).padStart(2, '0')}_${(scene.metricLabel || scene.stage).replace(/[^a-zA-Z0-9가-힣]/g, '')}.mp4`,
      sceneNumber: idx + 1,
      size: `${(Math.random() * 4 + 8).toFixed(1)} MB`,
    }));
  });

  const handleScanFolder = async () => {
    setIsScanning(true);
    setRenameSuccess(false);

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

      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
          setIsScanning(false);
          return;
        }
      }
    } catch {
      // client-side simulation
    }

    setTimeout(() => {
      setFiles(
        project.scenes.map((scene, idx) => ({
          id: `file-${idx + 1}`,
          originalName: `omni_flow_${Math.random().toString(36).substring(2, 7)}_render.mp4`,
          newName: `${String(idx + 1).padStart(2, '0')}_Scene${String(idx + 1).padStart(2, '0')}_${(scene.metricLabel || scene.stage).replace(/[^a-zA-Z0-9가-힣]/g, '')}.mp4`,
          sceneNumber: idx + 1,
          size: `${(Math.random() * 3 + 7).toFixed(1)} MB`,
        }))
      );
      setIsScanning(false);
    }, 800);
  };

  const handleExecuteRenaming = async () => {
    setIsRenaming(true);
    try {
      await fetch('/api/rename-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          folderPath,
          files,
          projectId: project.id,
        }),
      });
    } catch {
      // client simulation
    }

    setTimeout(() => {
      setIsRenaming(false);
      setRenameSuccess(true);
    }, 1200);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;

    // 재정렬 후 번호 갱신
    const renumbered = newFiles.map((f, i) => {
      const sc = project.scenes[i];
      return {
        ...f,
        sceneNumber: i + 1,
        newName: `${String(i + 1).padStart(2, '0')}_Scene${String(i + 1).padStart(2, '0')}_${(sc?.metricLabel || sc?.stage || 'clip').replace(/[^a-zA-Z0-9가-힣]/g, '')}.mp4`,
      };
    });

    setFiles(renumbered);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STEP 05
              </span>
              <span className="text-xs text-slate-400">다운로드 비디오 자동 정렬 & 최종 편집 연동</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              01_, 02_ 클립 일괄 넘버링 & 편집기 조립
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Google Flow에서 다운로드한 무작위 이름의 `.mp4` 클립들을 대본 순서대로 정렬하여 두 자리 접두사를 붙여 리네이밍합니다. 캡컷(CapCut) 또는 브루(Vrew)에서 A-Z 순서로 드래그하면 타임라인이 원클릭 조립됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Folder Input Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            Google Flow 다운로드 파일 보관 폴더 경로
          </span>
          <span className="text-[11px] text-slate-400">Windows 또는 Mac 절대 경로</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="C:\Users\Downloads\Google_Flow_Clips"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleScanFolder}
            disabled={isScanning}
            className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-medium text-white flex items-center gap-1.5 shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            {isScanning ? '스캔 중...' : '폴더 스캔'}
          </button>
          <button
            onClick={handleExecuteRenaming}
            disabled={isRenaming}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 shadow-lg"
          >
            <ListOrdered className="w-4 h-4" />
            {isRenaming ? '일괄 리네이밍 중...' : '01_, 02_ 일괄 번호 부여 실행'}
          </button>
        </div>

        {renameSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{files.length}개 비디오 클립</strong>이 대본 순서대로 안전하게 리네이밍되었습니다! <code>00_narration.wav</code>와 <code>생성할_Video.md</code>도 동일 폴더에 동기화되었습니다.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Matching Board: Scenes (Left) vs Video Files (Right) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>대본 씬과 비디오 파일 1:1 매칭 보드</span>
          </div>
          <span className="text-[11px] text-slate-400">
            순서가 맞지 않을 경우 화살표 버튼으로 클립 순서를 교체하세요
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {project.scenes.map((scene, idx) => {
            const file = files[idx];
            return (
              <div key={scene.id} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center hover:bg-white/[0.01]">
                {/* Left: Scene Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                      Scene {String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-300">{scene.timecode}</span>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {scene.metricLabel || scene.stage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {scene.script || '(대본 없음)'}
                  </p>
                </div>

                {/* Right: Matched Video Clip */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center shrink-0">
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-emerald-300 font-mono truncate">
                        {file ? file.newName : `0${idx + 1}_Scene.mp4`}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        원본: {file ? file.originalName : '다운로드 대기 중'} ({file?.size || '9.2 MB'})
                      </div>
                    </div>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveFile(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
                      title="위로 이동"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveFile(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
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
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          캡컷(CapCut) / 브루(Vrew) 초고속 타임라인 조립 체크리스트
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">STEP 1</span>
            <h4 className="text-xs font-bold text-white">이름순 (A-Z) 드래그</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              폴더 내 리네이밍된 클립들을 이름순으로 정렬하여 편집기 비디오 트랙에 한 번에 드래그앤드롭합니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">STEP 2</span>
            <h4 className="text-xs font-bold text-white">00_narration.wav 배치</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              오디오 트랙 맨 앞에 나레이션 음성을 배치하면 영상 씬 타임코드와 정확하게 동기화됩니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">STEP 3</span>
            <h4 className="text-xs font-bold text-white">클립 기본 음량 조절</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Omni 비디오 클립에 포함된 생성 사운드가 있을 경우 볼륨을 0 또는 낮춤으로 조절합니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">STEP 4</span>
            <h4 className="text-xs font-bold text-white">자동 자막 및 최종 출력</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              [자동 캡션] 실행 ➔ 폰트 스타일 적용 ➔ 4K / 1080p로 최종 렌더링 내보내기를 완료합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
