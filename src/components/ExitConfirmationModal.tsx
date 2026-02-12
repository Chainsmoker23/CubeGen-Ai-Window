import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ExitConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    // Determine if we're on the client to safely access document
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // If not mounted or body not available, return null
    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
                        onClick={onCancel}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    {/* Modal Container - centers the modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="w-full max-w-md pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100">
                                    <div className="flex items-center gap-3">
                                        {/* Warning Icon */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Wait! Your Masterpiece!</h2>
                                            <p className="text-sm text-amber-700 font-medium">Unsaved changes detected</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-5">
                                    <p className="text-gray-600 leading-relaxed">
                                        Your brilliant architecture hasn't been saved yet! If you leave now,
                                        all those beautiful nodes and connections will vanish into the digital void.
                                        <span className="text-gray-800 font-medium"> Are you sure you want to exit?</span>
                                    </p>

                                    {/* Tip */}
                                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-700 flex items-start gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span><strong>Pro tip:</strong> Export your diagram as JSON before leaving to save your work!</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                                    <button
                                        onClick={onCancel}
                                        className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                                    >
                                        Stay & Create
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-105 transition-all duration-200"
                                    >
                                        Exit Anyway
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ExitConfirmationModal;
