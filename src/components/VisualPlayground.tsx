import React, { useState, useCallback } from 'react';
import { DiagramData } from '../types';
import Playground from './Playground';
import SettingsSidebar from './SettingsSidebar';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { loadProject, saveProject, useAutoSave, archiveProject, listArchivedProjects, ArchivedProject } from '../services/projectStore';
import ProjectResumeModal from './ProjectResumeModal';
import TemplateChooser from './TemplateChooser';

import { useNavigate } from 'react-router-dom';

interface VisualPlaygroundProps {
    // onNavigate prop is deprecated in favor of react-router-dom
}

const PROJECT_KEY = 'visual-playground';

const DEFAULT_DIAGRAM: DiagramData = {
    title: 'New Diagram',
    architectureType: 'Visual Playground',
    nodes: [],
    links: [],
    containers: []
};

const VisualPlayground: React.FC<VisualPlaygroundProps> = () => {
    const navigate = useNavigate();

    // Check if a saved project exists (before deciding to show modal)
    const [savedProjectSnapshot] = useState(() => loadProject(PROJECT_KEY));
    const hasSavedProject = !!(savedProjectSnapshot?.diagramData && savedProjectSnapshot.diagramData.nodes.length > 0);

    // Modal state: show resume/new choice if a saved project exists
    const [showResumeModal, setShowResumeModal] = useState(hasSavedProject);
    // Track whether user has made their choice (to delay auto-save until decided)
    const [hasChosen, setHasChosen] = useState(!hasSavedProject);

    // Whether we're in the actual playground (vs. template chooser)
    // If there's a saved project, we'll go straight to playground after resume modal
    // If no saved project, show template chooser first
    const [isPlaygroundMode, setIsPlaygroundMode] = useState(hasSavedProject);

    // Restore from auto-save or use default
    const [history, setHistory] = useState<DiagramData[]>(() => {
        if (hasSavedProject && savedProjectSnapshot?.diagramData) {
            return [savedProjectSnapshot.diagramData];
        }
        return [DEFAULT_DIAGRAM];
    });
    const [historyIndex, setHistoryIndex] = useState(0);
    const diagramData = history[historyIndex];

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [userApiKey, setUserApiKey] = useState<string | null>(() => {
        try { return window.localStorage.getItem('user-api-key'); } catch { return null; }
    });

    // ─── Auto-save on every diagram change (only after user has chosen) ───
    useAutoSave(PROJECT_KEY, hasChosen ? diagramData : null);

    // Modal handlers
    const handleResume = useCallback(() => {
        // Keep current state (already loaded from saved project)
        setShowResumeModal(false);
        setHasChosen(true);
        setIsPlaygroundMode(true);
    }, []);

    const handleNewProject = useCallback(() => {
        // Archive old project, show template chooser
        archiveProject(PROJECT_KEY);
        setHistory([DEFAULT_DIAGRAM]);
        setHistoryIndex(0);
        setSelectedIds([]);
        setShowResumeModal(false);
        setHasChosen(true);
        setIsPlaygroundMode(false); // Show template chooser
    }, []);

    const handleLoadArchived = useCallback((project: ArchivedProject) => {
        // Load this archived project's diagram data
        if (project.diagramData) {
            setHistory([project.diagramData]);
            setHistoryIndex(0);
            setSelectedIds([]);
        }
        setShowResumeModal(false);
        setHasChosen(true);
        setIsPlaygroundMode(true);
    }, []);

    // ─── Template selection handler ───
    const handleTemplateSelect = useCallback((data: DiagramData) => {
        setHistory([data]);
        setHistoryIndex(0);
        setSelectedIds([]);
        setHasChosen(true);
        setIsPlaygroundMode(true);
    }, []);

    // Handlers
    const handleDiagramUpdate = (newData: DiagramData, fromHistory = false) => {
        if (fromHistory) {
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[historyIndex] = newData;
                return newHistory;
            });
        } else {
            const newHistory = history.slice(0, historyIndex + 1);
            setHistory([...newHistory, newData]);
            setHistoryIndex(newHistory.length);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setSelectedIds([]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setSelectedIds([]);
        }
    };



    const handleExit = () => {
        // Final save before leaving
        if (diagramData) {
            saveProject(PROJECT_KEY, diagramData);
        }
        navigate('/');
    };

    // ─── If resume modal is showing, render ONLY the modal ───
    if (showResumeModal && savedProjectSnapshot) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-bg)]">
                <ProjectResumeModal
                    savedProject={savedProjectSnapshot}
                    playgroundName="Custom Playground"
                    archivedProjects={listArchivedProjects(PROJECT_KEY)}
                    onResume={handleResume}
                    onLoadArchived={handleLoadArchived}
                    onNewProject={handleNewProject}
                />
            </div>
        );
    }

    // ─── If not in playground mode, show template chooser ───
    if (!isPlaygroundMode) {
        return (
            <TemplateChooser
                onSelect={handleTemplateSelect}
                onBack={() => navigate('/')}
            />
        );
    }

    return (
        <div className="h-screen w-screen bg-[var(--color-bg)] flex flex-col overflow-hidden">
            <SettingsSidebar userApiKey={userApiKey} setUserApiKey={setUserApiKey} onNavigate={() => navigate('/')} />

            <div className="flex-1 relative">
                <Playground
                    data={diagramData}
                    onDataChange={handleDiagramUpdate}
                    onExit={handleExit}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
            </div>

            <AnimatePresence>
                {successMessage && (
                    <Toast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default VisualPlayground;
