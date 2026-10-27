'use client';

import React, { useState, useEffect } from 'react';
import { VideoProject, TopicExpansion } from '@/types/video-project';
import {
  getStoredProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
  createNewProject,
  SAMPLE_PROJECT,
} from '@/lib/project-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { StepHeader } from '@/components/layout/StepHeader';
import { Step1Planning } from '@/components/steps/Step1Planning';
import { Step2Script } from '@/components/steps/Step2Script';
import { Step3TTS } from '@/components/steps/Step3TTS';
import { Step4Prompts } from '@/components/steps/Step4Prompts';
import { Step5Renamer } from '@/components/steps/Step5Renamer';

export default function StudioPage() {
  const [projects, setProjects] = useState<VideoProject[]>([SAMPLE_PROJECT]);
  const [activeProjectId, setActiveId] = useState<string>(SAMPLE_PROJECT.id);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    const loaded = getStoredProjects();
    const active = getActiveProjectId();
    setProjects(loaded);
    setActiveId(active);
    setIsLoaded(true);
  }, []);

  // 프로젝트 목록 또는 활성 프로젝트 변경 시 자동 저장
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECT;

  const updateActiveProject = (updates: Partial<VideoProject>) => {
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setProjects(updated);
    saveProjects(updated);
  };

  const handleSelectProject = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
  };

  const handleCreateProject = () => {
    const newProj = createNewProject({
      title: `신규 프로젝트 ${projects.length + 1}`,
    });
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === 0) return;
    setProjects(filtered);
    saveProjects(filtered);
    if (activeProjectId === id) {
      handleSelectProject(filtered[0].id);
    }
  };

  const handleDuplicateProject = (project: VideoProject) => {
    const copy: VideoProject = {
      ...project,
      id: 'proj-' + Date.now(),
      title: `${project.title} (사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [copy, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(copy.id);
  };

  const handleImportProjects = (imported: VideoProject[]) => {
    const merged = [...imported, ...projects];
    setProjects(merged);
    saveProjects(merged);
    if (imported[0]) {
      handleSelectProject(imported[0].id);
    }
  };

  const handleCreateProjectFromTopic = (topic: TopicExpansion) => {
    const newProj = createNewProject({
      title: topic.title,
      sourceContent: `[주제]: ${topic.title}\n[기획 의도]: ${topic.summary}\n[추천 포맷]: ${topic.targetDuration}`,
      keyHighlights: topic.title,
      category: activeProject.category,
      aspectRatio: activeProject.aspectRatio,
    });
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(newProj.id);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#090a10] flex items-center justify-center text-slate-400 text-xs">
        AI Video Pipeline Studio 로딩 중...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#090a10] text-slate-100">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportProjects={handleImportProjects}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Step Header */}
        <StepHeader
          currentStep={activeProject.currentStep || 1}
          onStepChange={(step) => updateActiveProject({ currentStep: step })}
          projectTitle={activeProject.title}
          onUpdateTitle={(title) => updateActiveProject({ title })}
          scenesCount={activeProject.scenes?.length || 0}
          audioDuration={activeProject.actualAudioDurationSeconds}
        />

        {/* Active Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {(activeProject.currentStep === 1 || !activeProject.currentStep) && (
            <Step1Planning
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNextStep={() => updateActiveProject({ currentStep: 2 })}
            />
          )}

          {activeProject.currentStep === 2 && (
            <Step2Script
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNextStep={() => updateActiveProject({ currentStep: 3 })}
              onCreateProjectFromTopic={handleCreateProjectFromTopic}
            />
          )}

          {activeProject.currentStep === 3 && (
            <Step3TTS
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNextStep={() => updateActiveProject({ currentStep: 4 })}
            />
          )}

          {activeProject.currentStep === 4 && (
            <Step4Prompts
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNextStep={() => updateActiveProject({ currentStep: 5 })}
            />
          )}

          {activeProject.currentStep === 5 && (
            <Step5Renamer project={activeProject} />
          )}
        </div>
      </main>
    </div>
  );
}
