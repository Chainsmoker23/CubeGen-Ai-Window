/**
 * CodePlayground - Code to Diagram Feature
 * User writes CubeGen DSL code, and it renders as a diagram
 * Same UX as GeneralArchitecturePage, but with code input instead of prompt
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { DiagramData, ArchNode, Container, Link, IconType } from '../types';
import Loader from './Loader';
import SettingsSidebar from './SettingsSidebar';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ArchitectureIcon from './ArchitectureIcon';

import Toast from './Toast';
import CodeEditor from './CodeEditor';
import { parseCubeGenDSL, ParseError } from '../utils/cubegenDSL';
import { explainArchitecture } from '../utils/mockDataUtils';
import { loadProject, saveProject, useAutoSave, archiveProject, listArchivedProjects, ArchivedProject } from '../services/projectStore';
import ProjectResumeModal from './ProjectResumeModal';

// Lazy load heavy components
const DiagramCanvas = React.lazy(() => import('./DiagramCanvas'));
const Toolbar = React.lazy(() => import('./Toolbar'));
const SummaryModal = React.lazy(() => import('./SummaryModal'));
const PropertiesSidebar = React.lazy(() => import('./PropertiesSidebar'));
const Playground = React.lazy(() => import('./Playground'));



import { useNavigate } from 'react-router-dom';

interface CodePlaygroundProps {
    // onNavigate prop deprecated
}

const CODE_PROJECT_KEY = 'code-playground';

const pageContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const pageItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 15, stiffness: 100 }
    },
};

// Example DSL code for initial state
const EXAMPLE_CODE = `// Simple Web Application Architecture
node user: "User" icon=User x=100 y=200
node lb: "Load Balancer" icon=LoadBalancer x=300 y=200
node api: "API Server" icon=Api x=500 y=200
node db: "Database" icon=Database x=700 y=200

user -> lb: "HTTPS"
lb -> api: "Route"
api -> db: "Query"`;

const CodePlayground: React.FC<CodePlaygroundProps> = () => {
    const navigate = useNavigate();


    // Check if saved project exists (for resume modal)
    const [savedProjectSnapshot] = useState(() => loadProject(CODE_PROJECT_KEY));
    const hasSavedProject = !!(savedProjectSnapshot?.diagramData && savedProjectSnapshot.diagramData.nodes.length > 0);

    // Modal state: show resume/new choice if a saved project exists
    const [showResumeModal, setShowResumeModal] = useState(hasSavedProject);
    const [hasChosen, setHasChosen] = useState(!hasSavedProject);

    // Restore saved project or fall back to defaults (only on first mount)
    const [code, setCode] = useState<string>(() => {
        const saved = loadProject(CODE_PROJECT_KEY);
        return saved?.code || EXAMPLE_CODE;
    });
    const [parseErrors, setParseErrors] = useState<ParseError[]>([]);

    const [history, setHistory] = useState<(DiagramData | null)[]>(() => {
        const saved = loadProject(CODE_PROJECT_KEY);
        return saved?.diagramData ? [saved.diagramData] : [null];
    });
    const [historyIndex, setHistoryIndex] = useState(0);
    const diagramData = history[historyIndex];

    // ─── Auto-save on every diagram/code change (only after user has chosen) ───
    useAutoSave(CODE_PROJECT_KEY, hasChosen ? diagramData : null, hasChosen ? code : undefined);

    const [isExplaining, setIsExplaining] = useState<boolean>(false);
    const [_error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPlaygroundMode, setIsPlaygroundMode] = useState<boolean>(() => {
        // If resuming a saved project with diagram data, go straight to playground
        const saved = loadProject(CODE_PROJECT_KEY);
        return !!(saved?.diagramData && saved.diagramData.nodes.length > 0);
    });

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const fitScreenRef = useRef<(() => void) | null>(null);

    const [userApiKey] = useState<string | null>(() => {
        try { return window.localStorage.getItem('user-api-key'); } catch { return null; }
    });

    // ─── Resume / New Project handlers ───
    const handleResume = useCallback(() => {
        setShowResumeModal(false);
        setHasChosen(true);
    }, []);

    const handleNewProject = useCallback(() => {
        archiveProject(CODE_PROJECT_KEY);
        setCode(EXAMPLE_CODE);
        setHistory([null]);
        setHistoryIndex(0);
        setSelectedIds([]);
        setParseErrors([]);
        setIsPlaygroundMode(false);
        setShowResumeModal(false);
        setHasChosen(true);
    }, []);

    const handleLoadArchived = useCallback((project: ArchivedProject) => {
        // Load this archived project's data
        if (project.code) setCode(project.code);
        if (project.diagramData) {
            setHistory([project.diagramData]);
            setHistoryIndex(0);
            setIsPlaygroundMode(project.diagramData.nodes.length > 0);
        }
        setSelectedIds([]);
        setShowResumeModal(false);
        setHasChosen(true);
    }, []);



    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExport = async (format: 'png' | 'json' | 'html') => {
        if (!diagramData) return;
        const filename = diagramData.title.replace(/[\s/]/g, '_').toLowerCase();

        if (format === 'json') {
            const dataStr = JSON.stringify(diagramData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            downloadBlob(blob, `${filename}.json`);
            return;
        }

        const svgElement = svgRef.current;
        if (!svgElement) {
            setError("Export failed: SVG element not found.");
            return;
        }

        const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
        const originalElements = Array.from(svgElement.querySelectorAll('*'));
        originalElements.unshift(svgElement);
        const clonedElements = Array.from(svgClone.querySelectorAll('*'));
        clonedElements.unshift(svgClone);

        originalElements.forEach((sourceEl, index) => {
            const targetEl = clonedElements[index] as Element;
            if (targetEl && (targetEl as SVGElement).style) {
                const computedStyle = window.getComputedStyle(sourceEl as Element);
                let cssText = '';
                for (let i = 0; i < computedStyle.length; i++) {
                    const prop = computedStyle[i];
                    cssText += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
                }
                (targetEl as SVGElement).style.cssText = cssText;
            }
        });

        const contentGroup = svgElement.querySelector('#diagram-content');
        if (!contentGroup) {
            setError("Export failed: Diagram content not found.");
            return;
        }
        const bbox = (contentGroup as SVGGraphicsElement).getBBox();

        const padding = 20;
        const exportWidth = Math.round(bbox.width + padding * 2);
        const exportHeight = Math.round(bbox.height + padding * 2);

        svgClone.setAttribute('width', `${exportWidth}`);
        svgClone.setAttribute('height', `${exportHeight}`);
        svgClone.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`);

        const exportRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const rootStyle = getComputedStyle(document.documentElement);
        const bgColor = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#FFF9FB';
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', bgColor);
        exportRoot.appendChild(bgRect);

        const clonedContentGroup = svgClone.querySelector('#diagram-content');
        if (clonedContentGroup instanceof globalThis.Element) {
            clonedContentGroup.setAttribute('transform', `translate(${-bbox.x + padding}, ${-bbox.y + padding})`);
            exportRoot.appendChild(clonedContentGroup);
        }

        const clonedDefs = svgClone.querySelector<SVGDefsElement>('defs');
        if (clonedDefs) {
            exportRoot.insertBefore(clonedDefs, exportRoot.firstChild);
        }

        while (svgClone.firstChild) {
            svgClone.removeChild(svgClone.firstChild);
        }
        svgClone.appendChild(exportRoot);

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        svgString = svgString.replace(/xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink"/g, '');

        if (format === 'html') {
            const htmlString = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${diagramData.title}</title>
                    <style> body { margin: 0; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; box-sizing: border-box; } svg { max-width: 100%; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 1rem; } </style>
                </head>
                <body>${svgString}</body>
                </html>`;
            const blob = new Blob([htmlString], { type: 'text/html' });
            downloadBlob(blob, `${filename}.html`);
            return;
        }

        if (format === 'png') {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = exportWidth * scale;
            canvas.height = exportHeight * scale;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                setError("Export failed: Could not create canvas context.");
                return;
            }
            ctx.scale(scale, scale);

            const img = new Image();
            const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        downloadBlob(blob, `${filename}.png`);
                    } else {
                        setError("Export failed: Canvas returned empty blob for png.");
                    }
                }, 'image/png');
            };

            img.onerror = () => {
                setError("Export failed: The generated SVG could not be loaded as an image.");
            };

            img.src = svgUrl;
        }
    };

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

    const handleFitToScreen = () => {
        (fitScreenRef.current as any)?.fitToScreen?.();
    };

    // Parse code and generate diagram - instant, no loading state needed
    const handleGenerate = useCallback(() => {
        if (!code.trim()) {
            setError("Please enter some code.");
            return;
        }

        setError(null);
        setParseErrors([]);

        const result = parseCubeGenDSL(code);

        if (result.success && result.data) {
            setHistory([result.data]);
            setHistoryIndex(0);
            setSelectedIds([]);
            setSuccessMessage('Diagram Generated!');
            setTimeout(() => handleFitToScreen(), 100);
        } else {
            setParseErrors(result.errors);
            setError(`Syntax error on line ${result.errors[0]?.line}: ${result.errors[0]?.message}`);
        }
    }, [code]);

    const handleExplain = useCallback(async () => {
        if (!diagramData) return;
        setIsExplaining(true);
        setError(null);
        try {
            const explanation = await explainArchitecture(diagramData, userApiKey || undefined);
            setSummary(explanation);
            setShowSummaryModal(true);
        } catch (err) {
            console.error(String(err));
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsExplaining(false);
        }
    }, [diagramData, userApiKey]);

    const selectedItem = useMemo(() => {
        if (!diagramData || selectedIds.length !== 1) return null;
        const selectedId = selectedIds[0];
        const items: (ArchNode | Container | Link)[] = [
            ...(diagramData.nodes || []),
            ...(diagramData.containers || []),
            ...(diagramData.links || []),
        ];
        return items.find(item => item.id === selectedId) || null;
    }, [diagramData, selectedIds]);

    const handlePropertyChange = (itemId: string, newProps: Partial<ArchNode | Container | Link>) => {
        if (!diagramData) return;
        const newNodes = diagramData.nodes.map(n => n.id === itemId ? { ...n, ...newProps } : n);
        const newContainers = diagramData.containers?.map(c => c.id === itemId ? { ...c, ...newProps as Partial<Container> } : c);
        const newLinks = diagramData.links.map(l => l.id === itemId ? { ...l, ...newProps as Partial<Link> } : l);
        handleDiagramUpdate({ ...diagramData, nodes: newNodes, containers: newContainers, links: newLinks }, true);
    }

    const handleTitleSave = () => {
        if (diagramData && editingTitle && editingTitle !== diagramData.title) {
            handleDiagramUpdate({ ...diagramData, title: editingTitle });
        }
        setIsEditingTitle(false);
    };

    const handleEnterPlayground = () => {
        setIsPlaygroundMode(true);
    };

    // ─── If resume modal is showing, render ONLY the modal ───
    if (showResumeModal && savedProjectSnapshot) {
        return (
            <div className="h-screen flex items-center justify-center app-bg">
                <ProjectResumeModal
                    savedProject={savedProjectSnapshot}
                    playgroundName="Code to Diagram"
                    archivedProjects={listArchivedProjects(CODE_PROJECT_KEY)}
                    onResume={handleResume}
                    onLoadArchived={handleLoadArchived}
                    onNewProject={handleNewProject}
                />
            </div>
        );
    }

    // If in playground mode, render the Playground component
    if (isPlaygroundMode && diagramData) {
        const playgroundProps = {
            data: diagramData,
            onDataChange: handleDiagramUpdate,
            onExit: () => {
                // Save before exiting playground mode
                if (diagramData) saveProject(CODE_PROJECT_KEY, diagramData, code);
                setIsPlaygroundMode(false);
            },
            selectedIds: selectedIds,
            setSelectedIds: setSelectedIds,
            onUndo: handleUndo,
            onRedo: handleRedo,
            canUndo: historyIndex > 0,
            canRedo: historyIndex < history.length - 1,
        };

        return (
            <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center app-bg"><Loader /></div>}>
                <Playground {...playgroundProps} />
            </Suspense>
        );
    }

    const isPropertiesPanelOpen = selectedIds.length > 0;

    const handleSave = async () => {
        if (!diagramData) return;
        try {
            const content = JSON.stringify(diagramData, null, 2);
            const success = await window.electronAPI.saveFile(content);
            if (success) {
                setSuccessMessage('Diagram saved successfully');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            setError('Failed to save file');
        }
    };

    const handleLoad = async () => {
        try {
            const content = await window.electronAPI.loadFile();
            if (content) {
                const loadedData = JSON.parse(content) as DiagramData;
                // Basic validation
                if (!loadedData.nodes || !loadedData.links) {
                    throw new Error('Invalid diagram file');
                }

                // Update history
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(loadedData);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);

                setSuccessMessage('Diagram loaded successfully');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (error) {
            console.error('Failed to load file:', error);
            setError('Failed to load file');
        }
    };

    return (
        <div className="h-screen text-[var(--color-text-primary)] flex flex-col transition-colors duration-300 app-bg">
            <SettingsSidebar userApiKey={userApiKey} setUserApiKey={() => { }} onNavigate={() => navigate('/')} />
            <div className="absolute top-4 right-4 z-40">
                {/* Home button removed, merged into SettingsSidebar */}
            </div>
            <motion.div
                variants={pageContainerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 flex flex-col"
            >

                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 pb-4">
                    {/* Code Editor Panel */}
                    <motion.aside variants={pageItemVariants} className="lg:col-span-4 rounded-2xl shadow-sm flex flex-col glass-panel p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ArchitectureIcon type={IconType.FileCode} className="w-5 h-5" />
                                Code Editor
                            </h2>
                            <button
                                onClick={handleGenerate}
                                className="px-4 py-2 bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] rounded-lg font-medium hover:bg-[var(--color-accent-text)] hover:text-white transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            errorLine={parseErrors[0]?.line}
                            className="flex-1"
                        />
                        {parseErrors.length > 0 && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                <strong>Errors:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                    {parseErrors.map((err, i) => (
                                        <li key={i}>Line {err.line}: {err.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.aside>

                    {/* Diagram Preview */}
                    <motion.section
                        variants={pageItemVariants}
                        className={`rounded-2xl shadow-sm flex flex-col relative min-h-[60vh] lg:min-h-0 glass-panel transition-all duration-300 ${isPropertiesPanelOpen ? 'lg:col-span-5' : 'lg:col-span-8'}`}
                    >
                        {/* Content - either empty state or diagram */}
                        <AnimatePresence mode="wait">
                            {!diagramData ? (
                                <motion.div
                                    key="empty-state"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center p-8"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <h3 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">Your diagram will appear here</h3>
                                    <p className="mt-1 text-[var(--color-text-secondary)]">Write your code and click "Generate".</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="diagram-content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col relative"
                                >
                                    <div className="p-4 border-b border-[var(--color-border-translucent)] flex justify-between items-center gap-4">
                                        <div className="group min-w-0 flex items-center gap-2">
                                            {isEditingTitle ? (
                                                <input
                                                    ref={titleInputRef}
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onBlur={handleTitleSave}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                                    className="text-xl font-semibold bg-transparent border-b border-[var(--color-accent-soft)] focus:outline-none focus:border-[var(--color-accent-text)]"
                                                />
                                            ) : (
                                                <>
                                                    <h2 className="text-xl font-semibold truncate" title={diagramData.title}>{diagramData.title}</h2>
                                                    <button onClick={() => { setIsEditingTitle(true); setEditingTitle(diagramData.title); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ArchitectureIcon type={IconType.Edit} className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0">
                                            <Suspense fallback={null}>
                                                <Toolbar
                                                    onExport={handleExport}
                                                    onExplain={handleExplain}
                                                    isExplaining={isExplaining}
                                                    onUndo={handleUndo}
                                                    onRedo={handleRedo}
                                                    canUndo={historyIndex > 0}
                                                    canRedo={historyIndex < history.length - 1}
                                                    onFitToScreen={handleFitToScreen}
                                                    onGoToPlayground={handleEnterPlayground}
                                                    canGoToPlayground={!!diagramData}
                                                    onSave={handleSave}
                                                    onLoad={handleLoad}
                                                    onZoomIn={() => (fitScreenRef.current as any)?.zoomIn?.()}
                                                    onZoomOut={() => (fitScreenRef.current as any)?.zoomOut?.()}
                                                />
                                            </Suspense>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader /></div>}>
                                            <DiagramCanvas
                                                forwardedRef={svgRef}
                                                fitScreenRef={fitScreenRef}
                                                data={diagramData}
                                                onDataChange={handleDiagramUpdate}
                                                selectedIds={selectedIds}
                                                setSelectedIds={setSelectedIds}
                                                isEditable={false}
                                                onLinkStart={() => { }}
                                                linkingState={null}
                                                previewLinkTarget={null}
                                            />
                                        </Suspense>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>

                    {/* Properties Panel */}
                    <AnimatePresence>
                        {isPropertiesPanelOpen && (
                            <motion.aside
                                key="properties-sidebar-desktop"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="lg:col-span-3 h-full flex-col hidden lg:flex"
                            >
                                <Suspense fallback={<div className="p-4"><Loader /></div>}>
                                    <PropertiesSidebar
                                        item={selectedItem}
                                        onPropertyChange={handlePropertyChange}
                                        selectedCount={selectedIds.length}
                                    />
                                </Suspense>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                </main>
            </motion.div>

            <AnimatePresence>
                {successMessage && (
                    <Toast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSummaryModal && summary && (
                    <SummaryModal summary={summary} onClose={() => setShowSummaryModal(false)} />
                )}
            </AnimatePresence>



        </div>
    );
};

export default CodePlayground;
