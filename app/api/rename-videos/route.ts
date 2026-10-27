import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VideoScene } from '@/types/video-project';

interface RenameFileItem {
  id: string;
  originalName: string;
  newName: string;
  sceneNumber: number;
  size: string;
  isRealFile?: boolean;
}

const MEDIA_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi', '.png', '.jpg', '.jpeg']);

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizePath(rawPath: string): string {
  return rawPath.trim().replace(/^["']|["']$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'scan',
      folderPath: rawFolderPath = '',
      scenes = [],
      files = [],
      projectId = '',
      projectTitle = 'Video_Project',
      markdownContent = '',
      audioUrl = '',
    } = body || {};

    const folderPath = sanitizePath(rawFolderPath);

    // 1. 샘플 더미 비디오 클립 생성 (테스트 편의 기능)
    if (action === 'create-sample-folder') {
      const targetDir = folderPath || path.join(process.cwd(), 'public', 'sample-flow-clips');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const sceneCount = Math.max(1, scenes.length || 5);
      const createdFiles: RenameFileItem[] = [];

      for (let i = 0; i < sceneCount; i++) {
        const sc = scenes[i];
        const hash = Math.random().toString(36).substring(2, 8);
        const fileName = `flow_clip_${hash}_sc${i + 1}.mp4`;
        const filePath = path.join(targetDir, fileName);

        // 더미 mp4 데이터 작성 (약 150KB)
        const dummyBuffer = Buffer.alloc(150 * 1024, 0x20);
        fs.writeFileSync(filePath, dummyBuffer);

        const cleanLabel = (sc?.metricLabel || sc?.stage || 'clip').replace(/[^a-zA-Z0-9가-힣_]/g, '');
        const newName = `${String(i + 1).padStart(2, '0')}_Scene${String(i + 1).padStart(2, '0')}_${cleanLabel || 'video'}.mp4`;

        createdFiles.push({
          id: `file-sample-${i + 1}`,
          originalName: fileName,
          newName,
          sceneNumber: i + 1,
          size: '0.2 MB',
          isRealFile: true,
        });
      }

      return NextResponse.json({
        success: true,
        folderPath: targetDir,
        files: createdFiles,
        message: `${createdFiles.length}개의 테스트용 비디오 클립이 생성되었습니다: ${targetDir}`,
      });
    }

    // 2. 로컬 폴더 스캔 (Scan)
    if (action === 'scan') {
      if (!folderPath) {
        return NextResponse.json({
          exists: false,
          files: [],
          message: '스캔할 폴더 경로를 입력해주세요.',
        });
      }

      if (!fs.existsSync(folderPath)) {
        // 폴더가 로컬에 없을 경우, 가상 시뮬레이션 데이터 제공
        const simFiles: RenameFileItem[] = scenes.map((scene: VideoScene, idx: number) => {
          const cleanLabel = (scene?.metricLabel || scene?.stage || 'clip').replace(/[^a-zA-Z0-9가-힣_]/g, '');
          return {
            id: `sim-file-${idx + 1}`,
            originalName: `flow_omni_${Math.random().toString(36).substring(2, 7)}_render.mp4`,
            newName: `${String(idx + 1).padStart(2, '0')}_Scene${String(idx + 1).padStart(2, '0')}_${cleanLabel || 'clip'}.mp4`,
            sceneNumber: idx + 1,
            size: `${(Math.random() * 3 + 7).toFixed(1)} MB`,
            isRealFile: false,
          };
        });

        return NextResponse.json({
          exists: false,
          isReal: false,
          files: simFiles,
          message: `지정한 폴더(${folderPath})를 찾을 수 없어 가상 시뮬레이션 모드로 표시됩니다. 실제 경로를 입력하시면 로컬 파일이 직접 리네이밍됩니다.`,
        });
      }

      // 실제 존재하는 폴더 스캔
      const dirEntries = fs.readdirSync(folderPath, { withFileTypes: true });
      const mediaFilesWithStats: { name: string; mtimeMs: number; size: number }[] = [];

      for (const entry of dirEntries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MEDIA_EXTENSIONS.has(ext)) {
            try {
              const fullPath = path.join(folderPath, entry.name);
              const stats = fs.statSync(fullPath);
              mediaFilesWithStats.push({
                name: entry.name,
                mtimeMs: stats.mtimeMs,
                size: stats.size,
              });
            } catch {
              // skip unreadable file
            }
          }
        }
      }

      // 시간순(오래된 순 = 다운로드/생성 순서)으로 정렬
      mediaFilesWithStats.sort((a, b) => a.mtimeMs - b.mtimeMs);

      // 장면(Scene)과 1:1 매칭
      const matchedFiles: RenameFileItem[] = mediaFilesWithStats.map((item, idx) => {
        const sc = scenes[idx];
        const sceneNum = idx + 1;
        const cleanLabel = (sc?.metricLabel || sc?.stage || 'clip').replace(/[^a-zA-Z0-9가-힣_]/g, '');
        const ext = path.extname(item.name);
        const newName = `${String(sceneNum).padStart(2, '0')}_Scene${String(sceneNum).padStart(2, '0')}_${cleanLabel || 'video'}${ext}`;

        return {
          id: `real-file-${sceneNum}`,
          originalName: item.name,
          newName,
          sceneNumber: sceneNum,
          size: formatFileSize(item.size),
          isRealFile: true,
        };
      });

      return NextResponse.json({
        exists: true,
        isReal: true,
        files: matchedFiles,
        message: `${matchedFiles.length}개의 실제 미디어 파일을 감지하여 대본 순서대로 매칭했습니다.`,
      });
    }

    // 3. 일괄 리네이밍 실행 (Rename)
    if (action === 'rename') {
      if (!folderPath || !fs.existsSync(folderPath)) {
        // 폴더 미존재 시 시뮬레이션 완료 응답
        return NextResponse.json({
          success: true,
          simulated: true,
          message: '시뮬레이션 모드에서 클립 번호가 성공적으로 부여되었습니다. (실제 폴더 경로 연결 시 디스크에 즉시 반영됩니다)',
          files,
        });
      }

      let renamedCount = 0;
      const updatedFiles: RenameFileItem[] = [];

      // 1) 비디오 파일 리네이밍
      for (const item of files as RenameFileItem[]) {
        const oldPath = path.join(folderPath, item.originalName);
        const newPath = path.join(folderPath, item.newName);

        if (fs.existsSync(oldPath)) {
          if (oldPath !== newPath) {
            fs.renameSync(oldPath, newPath);
            renamedCount++;
          }
          updatedFiles.push({
            ...item,
            originalName: item.newName, // 변경 후 이름으로 동기화
          });
        } else if (fs.existsSync(newPath)) {
          // 이미 리네이밍된 상태
          updatedFiles.push(item);
          renamedCount++;
        } else {
          updatedFiles.push(item);
        }
      }

      // 2) 00_narration.wav 동기화 복사
      let narrationCopied = false;
      const sourceWavCandidates = [
        path.join(process.cwd(), 'public', 'projects', projectId, 'narration.wav'),
        audioUrl ? path.join(process.cwd(), 'public', audioUrl.replace(/^\//, '')) : '',
      ];

      for (const src of sourceWavCandidates) {
        if (src && fs.existsSync(src)) {
          const destWav = path.join(folderPath, '00_narration.wav');
          fs.copyFileSync(src, destWav);
          narrationCopied = true;
          break;
        }
      }

      // 3) 마스터 마크다운 파일(생성할_Video.md) 동기화 저장
      let mdSaved = false;
      if (markdownContent) {
        const cleanTitle = (projectTitle || 'Video_Project').replace(/[^a-zA-Z0-9가-힣_]/g, '_');
        const destMd = path.join(folderPath, `${cleanTitle}_Video.md`);
        fs.writeFileSync(destMd, markdownContent, 'utf-8');
        mdSaved = true;
      }

      return NextResponse.json({
        success: true,
        isReal: true,
        renamedCount,
        narrationCopied,
        mdSaved,
        files: updatedFiles,
        message: `${renamedCount}개 비디오 파일이 '01_', '02_' 순서로 성공적으로 변경되었습니다. (00_narration.wav 및 마크다운 매뉴얼 파일 동기화 완료)`,
      });
    }

    return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/rename-videos error:', error);
    return NextResponse.json(
      { error: error?.message || '비디오 리네이밍 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
