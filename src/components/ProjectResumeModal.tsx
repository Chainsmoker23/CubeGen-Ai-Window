/**
 * ProjectResumeModal
 * Shown when a saved project exists for the current playground.
 * User can choose to resume the latest project, load an archived one, or start new.
 * Shows all archived projects with delete capability.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedProject, ArchivedProject, deleteArchivedProject } from '../services/projectStore';

interface ProjectResumeModalProps {
    /** The most recent saved project */
    savedProject: SavedProject;
    /** Label for the playground type */
    playgroundName: string;
    /** All archived (older) projects */
    archivedProjects: ArchivedProject[];
    /** Called when user wants to resume the latest saved project */
    onResume: () => void;
    /** Called when user wants to load a specific archived project */
    onLoadArchived?: (project: ArchivedProject) => void;
    /** Called when user wants to start a new project */
    onNewProject: () => void;
}

const modal = {
    hidden: { opacity: 0, scale: 0.92, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 350 } },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

const ProjectResumeModal: React.FC<ProjectResumeModalProps> = ({
    savedProject,
    playgroundName,
    archivedProjects: initialArchived,
    onResume,
    onLoadArchived,
    onNewProject,
}) => {
    // Local state so we can remove archived items on delete without parent re-render
    const [archivedProjects, setArchivedProjects] = useState(initialArchived);

    const savedDate = new Date(savedProject.savedAt);
    const nodeCount = savedProject.diagramData?.nodes?.length || 0;
    const hasCode = !!(savedProject.code && savedProject.code.trim().length > 0);
    const title = savedProject.diagramData?.title || playgroundName;

    const handleDeleteArchived = (storageKey: string) => {
        deleteArchivedProject(storageKey);
        setArchivedProjects(prev => prev.filter(p => p.storageKey !== storageKey));
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                key="resume-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <motion.div
                    key="resume-modal"
                    variants={modal}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                    style={{ background: '#FFF0F5', border: '1px solid rgba(225,29,72,0.15)', maxHeight: '85vh' }}
                >
                    {/* Header accent */}
                    <div className="h-1.5 bg-gradient-to-r from-[#E11D48] via-[#EC4899] to-[#8B5CF6] flex-shrink-0" />

                    <div className="p-6 flex flex-col min-h-0">
                        {/* Title */}
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back!</h2>
                        <p className="text-sm text-slate-500 mb-5">
                            You have a saved <span className="font-semibold text-slate-700">{playgroundName}</span> project.
                        </p>

                        {/* Current project card */}
                        <div className="bg-white/80 border border-pink-100 rounded-xl p-4 mb-4 flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#EC4899] flex items-center justify-center flex-shrink-0 shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        Last saved {savedDate.toLocaleDateString()} at {savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5 border border-green-100">
                                            ● LATEST
                                        </span>
                                        {nodeCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                                                {nodeCount} node{nodeCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {hasCode && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                                                Has code
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mb-4 flex-shrink-0">
                            <button
                                onClick={onResume}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Resume
                            </button>

                            <button
                                onClick={onNewProject}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-slate-700 font-bold text-sm hover:bg-pink-50 hover:border-pink-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                New
                            </button>
                        </div>

                        {/* Archived projects section */}
                        {archivedProjects.length > 0 && (
                            <div className="flex flex-col min-h-0">
                                <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                    <div className="h-px flex-1 bg-pink-100"></div>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Previous Projects ({archivedProjects.length})
                                    </span>
                                    <div className="h-px flex-1 bg-pink-100"></div>
                                </div>

                                <div className="overflow-y-auto max-h-48 pr-1 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f9a8d4 transparent' }}>
                                    {archivedProjects.map((archived) => {
                                        const archNodes = archived.diagramData?.nodes?.length || 0;
                                        const archTitle = archived.diagramData?.title || 'Untitled Project';
                                        const archHasCode = !!(archived.code && archived.code.trim().length > 0);
                                        return (
                                            <div
                                                key={archived.storageKey}
                                                className="group bg-white/60 border border-pink-50 rounded-lg p-3 flex items-center gap-3 hover:bg-white/90 hover:border-pink-200 transition-all duration-200"
                                            >
                                                {/* Icon */}
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                                                    </svg>
                                                </div>

                                                {/* Info — clickable to load */}
                                                <button
                                                    onClick={() => onLoadArchived?.(archived)}
                                                    className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                                                    title="Click to load this project"
                                                >
                                                    <div className="font-semibold text-slate-700 text-xs truncate">{archTitle}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(archived.savedAt)}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        {archNodes > 0 && (
                                                            <span className="text-[9px] text-slate-400">
                                                                {archNodes} node{archNodes !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {archHasCode && (
                                                            <span className="text-[9px] text-slate-400">• code</span>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    onClick={() => handleDeleteArchived(archived.storageKey)}
                                                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete this project"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProjectResumeModal;
