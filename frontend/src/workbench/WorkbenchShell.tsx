import React, { useState } from 'react';
import type { Case, CaseStatus, Finding, DocumentItem } from '../types';
import { StatusPill } from './StatusPill';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  Upload,
} from 'lucide-react';

interface WorkbenchShellProps {
  currentCase: Case;
  selectedDoc: DocumentItem | null | undefined;
  statusInfo: CaseStatus | null;
  primaryFinding: Finding | null;
  analyzing?: boolean;
  onAnalyze?: () => void;
  onDirectUpload?: (files: File[]) => void;
  onOpenReviewer?: () => void;
  onOpenDossier?: () => void;
  onBackToCases?: () => void;
  leftDock: React.ReactNode;
  centerStage: React.ReactNode;
  rightDock: React.ReactNode;
  bottomDock?: React.ReactNode;
}

export const WorkbenchShell: React.FC<WorkbenchShellProps> = ({
  currentCase,
  selectedDoc,
  statusInfo,
  primaryFinding,
  analyzing = false,
  onAnalyze,
  onDirectUpload,
  onOpenReviewer,
  onOpenDossier,
  onBackToCases,
  leftDock,
  centerStage,
  rightDock,
  bottomDock,
}) => {
  // Collapsible Dock States
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Active Mobile Tab (under 1024px)
  const [mobileTab, setMobileTab] = useState<'shelf' | 'stage' | 'inspector'>('stage');

  // Pipeline Pills Status
  const getStageState = (stageName: string): 'pending' | 'running' | 'done' | 'error' => {
    if (analyzing) return 'running';
    const st = statusInfo?.stages?.[stageName];
    if (st === 'complete') return 'done';
    if (st === 'running') return 'running';
    if (st === 'error') return 'error';
    return 'done';
  };

  const stages = [
    { key: 'ingestion', label: 'INGEST' },
    { key: 'extraction', label: 'EXTRACT' },
    { key: 'hypothesis', label: 'SOLVE' },
    { key: 'dossier', label: 'FINDINGS' },
  ];

  return (
    <div className="w-full min-h-screen bg-ground text-text flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. Top HUD (44px) */}
      <header className="h-11 w-full bg-panel border-b border-line px-4 flex items-center justify-between z-30 font-mono text-xs">
        {/* Left: Brand mark & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCases}
            className="text-dim hover:text-cyan flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan" />
            <span className="hidden sm:inline">Cases</span>
          </button>
          <span className="text-dim">/</span>
          <span className="font-bold text-text truncate max-w-[140px] sm:max-w-none">
            {currentCase.case_id}
          </span>
          {selectedDoc && (
            <>
              <span className="text-dim hidden md:inline">/</span>
              <span className="text-cyan truncate max-w-[120px] hidden md:inline">
                {selectedDoc.source_name}
              </span>
            </>
          )}
        </div>

        {/* Center: Pipeline Pills */}
        <div className="hidden lg:flex items-center gap-1.5 bg-ground px-2 py-1 rounded-panel border border-line text-[10px]">
          {stages.map((s) => {
            const st = getStageState(s.key);
            return (
              <div
                key={s.key}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  st === 'running'
                    ? 'bg-cyan/20 text-cyan animate-pulse border border-cyan/40'
                    : 'bg-panel-2 text-dim border border-line'
                }`}
              >
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Status Pill & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Direct Upload & Auto-Download Report */}
          {onDirectUpload && (
            <label className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#5ce1e6]/15 hover:bg-[#5ce1e6]/25 border border-[#5ce1e6] text-[#5ce1e6] hover:text-white font-mono text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(92,225,230,0.3)] active:scale-95 animate-pulse">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">UPLOAD & DOWNLOAD REPORT</span>
              <span className="sm:hidden">UPLOAD</span>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onDirectUpload(Array.from(e.target.files));
                  }
                }}
                className="hidden"
              />
            </label>
          )}

          <StatusPill status={primaryFinding?.status || currentCase.status} size="sm" />

          {/* Quick Re-run Pipeline */}
          {onAnalyze && (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              title="Re-run Forensic Pipeline"
              className="p-1.5 rounded border border-line text-dim hover:text-cyan bg-panel-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-cyan' : ''}`} />
            </button>
          )}

          {/* Reviewer Action */}
          {onOpenReviewer && (
            <button
              type="button"
              onClick={onOpenReviewer}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(92,225,230,0.2)]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Review</span>
            </button>
          )}

          {/* Dossier Action */}
          {onOpenDossier && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="text-xs text-muted hover:text-text px-2 py-1 rounded border border-line bg-panel-2 cursor-pointer transition-colors hidden sm:block"
            >
              Dossier
            </button>
          )}
        </div>
      </header>

      {/* Mobile Tab Switcher (Under 1024px) */}
      <div className="lg:hidden flex items-center justify-around border-b border-line bg-panel text-xs font-mono py-1.5 px-2 z-20">
        <button
          type="button"
          onClick={() => setMobileTab('shelf')}
          className={`px-3 py-1 rounded ${mobileTab === 'shelf' ? 'bg-cyan text-ground font-bold' : 'text-dim'}`}
        >
          Shelf
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('stage')}
          className={`px-3 py-1 rounded ${mobileTab === 'stage' ? 'bg-cyan text-ground font-bold' : 'text-dim'}`}
        >
          Stage
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('inspector')}
          className={`px-3 py-1 rounded ${mobileTab === 'inspector' ? 'bg-cyan text-ground font-bold' : 'text-dim'}`}
        >
          Inspector
        </button>
      </div>

      {/* 2. Main 3-Column Docked Layout */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch overflow-hidden">
        {/* Left Dock (280px / 3 cols) */}
        <div
          className={`${
            mobileTab === 'shelf' ? 'block' : 'hidden lg:block'
          } ${
            leftCollapsed ? 'lg:col-span-1 p-2' : 'lg:col-span-3 p-4'
          } relative border-r border-line bg-panel/50 overflow-y-auto max-h-[calc(100vh-44px)] transition-all`}
        >
          <button
            type="button"
            title={leftCollapsed ? 'Expand Shelf' : 'Collapse Shelf'}
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="hidden lg:flex absolute top-2 right-2 p-1 rounded bg-panel-2 border border-line text-dim hover:text-cyan z-20 cursor-pointer"
          >
            {leftCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          {!leftCollapsed && leftDock}
        </div>

        {/* Center Stage (5-6 cols) */}
        <div
          className={`${
            mobileTab === 'stage' ? 'block' : 'hidden lg:block'
          } ${
            leftCollapsed && rightCollapsed
              ? 'lg:col-span-10'
              : leftCollapsed || rightCollapsed
              ? 'lg:col-span-7'
              : 'lg:col-span-5'
          } p-4 overflow-y-auto max-h-[calc(100vh-44px)] transition-all flex flex-col`}
        >
          {centerStage}
        </div>

        {/* Right Dock (380px / 4 cols) */}
        <div
          className={`${
            mobileTab === 'inspector' ? 'block' : 'hidden lg:block'
          } ${
            rightCollapsed ? 'lg:col-span-1 p-2' : 'lg:col-span-4 p-4'
          } relative border-l border-line bg-panel/50 overflow-y-auto max-h-[calc(100vh-44px)] transition-all`}
        >
          <button
            type="button"
            title={rightCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="hidden lg:flex absolute top-2 left-2 p-1 rounded bg-panel-2 border border-line text-dim hover:text-cyan z-20 cursor-pointer"
          >
            {rightCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {!rightCollapsed && rightDock}
        </div>
      </div>

      {/* 3. Bottom Audit Dock */}
      {bottomDock && (
        <div className="w-full border-t border-line bg-panel z-20">
          {bottomDock}
        </div>
      )}
    </div>
  );
};
