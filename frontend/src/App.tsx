import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CaseStudioView } from './components/CaseStudioView';
import { ReviewDrawer } from './components/ReviewDrawer';
import { DossierModal } from './components/DossierModal';
import { NewCaseModal } from './components/NewCaseModal';
import { StoryPage } from './story/StoryPage';
import { StyleguidePage } from './story/StyleguidePage';
import { CommandPalette } from './ui/vendor/CommandPalette';
import type { CommandAction } from './ui/vendor/CommandPalette';
import type { Case, HealthInfo, Finding } from './types';
import { fetchCases, fetchHealth, createDemoCase } from './api';
import {
  Compass,
  FileText,
  Sparkles,
  ShieldAlert,
  Terminal,
  Layers,
  CheckCircle,
} from 'lucide-react';

export function App() {
  const [route, setRoute] = useState<string>(() => window.location.hash || '#/');
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'studio'>('dashboard');

  // Modals & Drawers
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Initial data loading
  const loadInitialData = async () => {
    try {
      const [h, cs] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchCases().catch(() => []),
      ]);
      if (h) setHealth(h);
      if (cs) setCases(cs);

      // Auto-select latest case if available
      if (cs && cs.length > 0 && !currentCaseId) {
        setCurrentCaseId(cs[0].case_id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Launching Instant Demo (Clean vs Tampered)
  const handleLaunchDemo = async (type: 'clean' | 'tampered') => {
    setLoadingDemo(true);
    setDemoBanner(
      type === 'clean'
        ? 'Synthesizing Clean Bundle: Ingesting 4 PDFs, verifying split payroll credits against bank records with Z3...'
        : 'Synthesizing Tampered Bundle: Ingesting modified 95k payslip, executing font forensics & Z3 contradiction isolation...'
    );

    try {
      const res = await createDemoCase(type);
      const updatedCases = await fetchCases();
      setCases(updatedCases);
      setCurrentCaseId(res.case_id);
      window.location.hash = '#/studio';
      setCurrentView('studio');
      setDemoBanner(
        type === 'clean'
          ? '✓ Clean Bundle Analyzed: Restraint demonstrated. All hypotheses SAT, zero false escalation.'
          : '⚠ Tampered Bundle Analyzed: Escalation demonstrated. Z3 solver isolated INR 30k discrepancy!'
      );
      setTimeout(() => setDemoBanner(null), 5000);
    } catch (err) {
      console.error(err);
      setDemoBanner('Failed to execute demo bundle.');
      setTimeout(() => setDemoBanner(null), 4000);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setCurrentCaseId(caseId);
    window.location.hash = '#/studio';
    setCurrentView('studio');
  };

  const handleOpenReview = (finding: Finding) => {
    setSelectedFinding(finding);
    setIsReviewOpen(true);
  };

  const activeCase = cases.find((c) => c.case_id === currentCaseId) || cases[0];

  // Palette Actions
  const paletteActions: CommandAction[] = [
    {
      id: 'scene-0',
      title: 'Scene 01: The Specimen (Hero)',
      category: 'Story Navigation',
      icon: Compass,
      shortcut: '1',
      onSelect: () => {
        window.location.hash = '#/';
        setTimeout(() => {
          document.getElementById('scene-0')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      },
    },
    {
      id: 'scene-1',
      title: 'Scene 02: Four Layers, One Coordinate',
      category: 'Story Navigation',
      icon: Layers,
      shortcut: '2',
      onSelect: () => {
        window.location.hash = '#/';
        setTimeout(() => {
          document.getElementById('scene-1')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      },
    },
    {
      id: 'scene-2',
      title: 'Scene 03: The Trial (Clean vs Tampered)',
      category: 'Story Navigation',
      icon: ShieldAlert,
      shortcut: '3',
      onSelect: () => {
        window.location.hash = '#/';
        setTimeout(() => {
          document.getElementById('scene-2')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      },
    },
    {
      id: 'scene-3',
      title: 'Scene 04: Forensic Investigation Workbench',
      category: 'Story Navigation',
      icon: Terminal,
      shortcut: '4',
      onSelect: () => {
        window.location.hash = '#/';
        setTimeout(() => {
          document.getElementById('scene-3')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      },
    },
    {
      id: 'scene-4',
      title: 'Scene 05: The Seal & Signed Dossier',
      category: 'Story Navigation',
      icon: CheckCircle,
      shortcut: '5',
      onSelect: () => {
        window.location.hash = '#/';
        setTimeout(() => {
          document.getElementById('scene-4')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      },
    },
    {
      id: 'open-studio',
      title: 'Open Full Investigation Studio',
      category: 'Workbench',
      icon: Terminal,
      shortcut: 'S',
      onSelect: () => {
        window.location.hash = '#/studio';
      },
    },
    {
      id: 'clean-demo',
      title: 'Run Clean Bundle Demo (Demonstration of Restraint)',
      category: 'Demo Runner',
      icon: Sparkles,
      shortcut: 'C',
      onSelect: () => handleLaunchDemo('clean'),
    },
    {
      id: 'tampered-demo',
      title: 'Run Tampered Bundle Demo (Demonstration of Escalation)',
      category: 'Demo Runner',
      icon: ShieldAlert,
      shortcut: 'T',
      onSelect: () => handleLaunchDemo('tampered'),
    },
    {
      id: 'export-dossier',
      title: 'Export Court Investigation Dossier (PDF & JSON)',
      category: 'Dossier',
      icon: FileText,
      shortcut: 'D',
      onSelect: () => setIsDossierOpen(true),
    },
    {
      id: 'styleguide',
      title: 'Open Styleguide & Design Tokens',
      category: 'Design System',
      icon: Compass,
      shortcut: 'G',
      onSelect: () => {
        window.location.hash = '#/styleguide';
      },
    },
  ];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Styleguide Route
  if (route === '#/styleguide') {
    return <StyleguidePage />;
  }

  // 2. Full Studio Route
  if (route === '#/studio') {
    return (
      <div className="relative min-h-screen bg-[#07090c] text-[#e8e6df] autopsy-grid overflow-x-hidden">
        <Navbar
          health={health}
          cases={cases}
          currentCaseId={currentCaseId}
          onSelectCase={handleSelectCase}
          onLaunchDemo={handleLaunchDemo}
          onOpenNewCase={() => setIsNewCaseOpen(true)}
          onOpenDossier={() => setIsDossierOpen(true)}
          loadingDemo={loadingDemo}
        />

        {/* Floating Switch Back to Story */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 flex items-center justify-between">
          <a
            href="#/"
            className="text-xs font-mono text-[#8e98a6] hover:text-[#c6f432] transition-colors"
          >
            &larr; Return to The Autopsy Table Story
          </a>

          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="text-xs font-mono text-[#8e98a6] hover:text-[#e8e6df] px-2.5 py-1 rounded bg-[#151b24] border border-[#1f2733] cursor-pointer"
          >
            Command Menu <kbd className="text-[#c6f432]">Ctrl+K</kbd>
          </button>
        </div>

        {demoBanner && (
          <div className="max-w-4xl mx-auto px-4 mt-3">
            <div className="p-3 rounded-xl bg-[#0e1218] border border-[#c6f432]/40 text-center font-mono text-xs text-[#c6f432] shadow-xl">
              {demoBanner}
            </div>
          </div>
        )}

        <main className="pb-16 pt-2">
          {currentView === 'dashboard' || !activeCase ? (
            <DashboardView
              cases={cases}
              health={health}
              onSelectCase={handleSelectCase}
              onLaunchDemo={handleLaunchDemo}
              onOpenNewCase={() => setIsNewCaseOpen(true)}
              loadingDemo={loadingDemo}
            />
          ) : (
            <CaseStudioView
              currentCase={activeCase}
              onOpenReviewDrawer={handleOpenReview}
              onOpenDossier={() => setIsDossierOpen(true)}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          )}
        </main>

        {/* Review Action Drawer */}
        <ReviewDrawer
          finding={selectedFinding}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onReviewSubmitted={async () => {
            const updatedCases = await fetchCases();
            setCases(updatedCases);
          }}
        />

        {/* Dossier Modal */}
        {currentCaseId && (
          <DossierModal
            caseId={currentCaseId}
            isOpen={isDossierOpen}
            onClose={() => setIsDossierOpen(false)}
          />
        )}

        {/* New Case Modal */}
        <NewCaseModal
          isOpen={isNewCaseOpen}
          onClose={() => setIsNewCaseOpen(false)}
          onCaseCreated={async (newId) => {
            const updated = await fetchCases();
            setCases(updated);
            handleSelectCase(newId);
          }}
        />

        {/* Command Palette */}
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          actions={paletteActions}
        />
      </div>
    );
  }

  // 3. Default: The Autopsy Table Scroll Story
  return (
    <>
      <StoryPage
        onOpenStudio={() => {
          window.location.hash = '#/studio';
        }}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* Floating Command Trigger on Story */}
      <button
        type="button"
        onClick={() => setIsPaletteOpen(true)}
        aria-label="Open command palette"
        className="fixed bottom-6 right-6 z-40 bg-[#151b24]/90 hover:bg-[#151b24] border border-[#3a4757] text-[#e8e6df] hover:text-[#c6f432] p-2.5 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <Terminal className="w-4 h-4 text-[#c6f432]" />
        <span className="hidden sm:inline">Commands</span>
        <kbd className="text-[10px] bg-[#07090c] px-1.5 py-0.5 rounded text-[#8e98a6] border border-[#1f2733]">
          Ctrl+K
        </kbd>
      </button>

      {/* Dossier Modal */}
      {currentCaseId && (
        <DossierModal
          caseId={currentCaseId}
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={paletteActions}
      />
    </>
  );
}
export default App;
