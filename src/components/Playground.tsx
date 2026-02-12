import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagramData, ArchNode, Link, Container, IconType } from '../types';
import DiagramCanvas, { InteractionMode } from './DiagramCanvas';
import PropertiesSidebar from './PropertiesSidebar';
import PlaygroundToolbar from './PlaygroundToolbar';
import { customAlphabet } from 'nanoid';
import { zoomIdentity, ZoomTransform } from 'd3-zoom';
import Toast from './Toast';
import AddNodePanel from './AddNodePanel';

const nanoid = customAlphabet('1234567890abcdef', 10);

interface PlaygroundProps {
    data: DiagramData;
    onDataChange: (newData: DiagramData, fromHistory?: boolean) => void;
    onExit: () => void;
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    canvasType?: 'general' | 'neural-network';
}



const Playground: React.FC<PlaygroundProps> = (props) => {
    const { data, onDataChange, onExit, selectedIds, setSelectedIds, canUndo, canRedo, onUndo, onRedo } = props;

    const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
    const [viewTransform, setViewTransform] = useState<ZoomTransform>(() => zoomIdentity);
    const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isViewMode, setIsViewMode] = useState(false); // Distraction-free view mode

    // State for the new drag-to-connect feature
    const [linkingState, setLinkingState] = useState<{ sourceNodeId: string; startPos: { x: number, y: number } } | null>(null);
    const [previewLinkTarget, setPreviewLinkTarget] = useState<{ x: number; y: number; targetNodeId?: string } | null>(null);

    const isPropertiesPanelOpen = selectedIds.length > 0 && !isViewMode;

    const svgRef = useRef<SVGSVGElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const fitScreenRef = useRef<(() => void) | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            onUndo();
            setToastMessage('Action undone');
        }
    }, [canUndo, onUndo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            onRedo();
            setToastMessage('Action redone');
        }
    }, [canRedo, onRedo]);

    // View Mode side effects
    useEffect(() => {
        if (isViewMode) {
            setSelectedIds([]);
            setInteractionMode('pan');
        } else {
            setInteractionMode('select');
        }
    }, [isViewMode, setSelectedIds]);

    // View Mode toggle
    const toggleViewMode = useCallback(() => setIsViewMode(prev => !prev), []);

    // Keyboard shortcuts for view mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.key === 'v' || e.key === 'V') && e.shiftKey) {
                toggleViewMode();
            } else if (e.key === 'Escape' && isViewMode) {
                setIsViewMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isViewMode, toggleViewMode]);

    const handleAddContainer = (containerType: 'tier' | 'vpc' | 'region' | 'availability-zone' | 'subnet' | 'rectangle' | 'circle' | 'triangle' = 'availability-zone') => {
        if (!canvasContainerRef.current) return;
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();

        // Calculate center of the current view
        const [viewX, viewY] = viewTransform.invert([canvasRect.width / 2, canvasRect.height / 2]);

        const containerLabels: Record<string, string> = {
            'tier': 'New Tier',
            'vpc': 'Virtual Private Cloud',
            'region': 'Region',
            'availability-zone': 'Availability Zone',
            'subnet': 'Subnet',
            'rectangle': 'Rectangle',
            'circle': 'Circle',
            'triangle': 'Triangle'
        };

        const newContainer: Container = {
            id: nanoid(),
            label: containerLabels[containerType],
            type: containerType,
            x: viewX - 200, // Center it
            y: viewY - 150,
            width: 400,
            height: 300,
            childNodeIds: [],
            borderStyle: 'solid',
            borderWidth: 'medium',
            borderColor: '#000000',
        };
        const newContainers = [...(data.containers || []), newContainer];
        const newData = { ...data, containers: newContainers };
        onDataChange(newData);
        setSelectedIds([newContainer.id]);
        setToastMessage(`${containerLabels[containerType]} added`);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isViewMode) return;
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'z' && !e.shiftKey;
            const isRedo = (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey));

            if (isUndo) {
                e.preventDefault();
                handleUndo();
            } else if (isRedo) {
                e.preventDefault();
                handleRedo();
            } else if (e.key.toLowerCase() === 'v') {
                e.preventDefault();
                handleSetInteractionMode('select');
            } else if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setInteractionMode(prev => prev === 'addNode' ? 'select' : 'addNode');
            } else if (e.key.toLowerCase() === 'b') {
                e.preventDefault();
                handleAddContainer('availability-zone'); // Default to AZ
            } else if (e.key.toLowerCase() === 'a') {
                e.preventDefault();
                handleAddContainer('availability-zone');
            } else if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleAddContainer('subnet');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, isViewMode]);

    const nodesAndContainersById = useMemo(() => {
        const map = new Map<string, ArchNode | Container | Link>();
        data.nodes.forEach(node => map.set(node.id, node));
        (data.containers || []).forEach(container => map.set(container.id, container));
        (data.links || []).forEach(link => map.set(link.id, link));
        return map;
    }, [data.nodes, data.containers, data.links]);



    const handleFitToScreen = () => (fitScreenRef.current as any)?.fitToScreen?.();

    const handleSetInteractionMode = (mode: InteractionMode) => {
        setInteractionMode(mode);
        setSelectedIds([]);
        setResizingNodeId(null);
    };

    const handleNodeDoubleClick = useCallback((nodeId: string) => {
        setInteractionMode('select');
        setResizingNodeId(prevId => (prevId === nodeId ? null : nodeId));
        if (resizingNodeId !== nodeId) {
            setSelectedIds([nodeId]);
        }
    }, [resizingNodeId, setSelectedIds]);

    const handleCanvasClick = () => {
        setSelectedIds([]);
        setResizingNodeId(null);
    };

    const selectedItem = useMemo(() => {
        if (!data || selectedIds.length !== 1) return null;
        return nodesAndContainersById.get(selectedIds[0]) || null;
    }, [data, selectedIds, nodesAndContainersById]);

    const handlePropertyChange = (itemId: string, newProps: Partial<ArchNode> | Partial<Container> | Partial<Link>) => {
        if (!data) return;
        const newNodes = data.nodes.map(n => n.id === itemId ? { ...n, ...(newProps as Partial<ArchNode>) } : n);
        const newContainers = data.containers?.map(c => c.id === itemId ? { ...c, ...(newProps as Partial<Container>) } : c);
        const newLinks = data.links.map(l => l.id === itemId ? { ...l, ...(newProps as Partial<Link>) } : l);
        onDataChange({ ...data, nodes: newNodes, containers: newContainers, links: newLinks });
    };

    const handleDeleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        const selectedIdsSet = new Set(selectedIds);
        const newNodes = data.nodes.filter(n => !selectedIdsSet.has(n.id));
        const newContainers = (data.containers || []).filter(c => !selectedIdsSet.has(c.id));

        const remainingNodeIds = new Set(newNodes.map(n => n.id));
        const newLinks = data.links.filter(l => {
            if (selectedIdsSet.has(l.id)) return false;
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
        });

        onDataChange({ ...data, nodes: newNodes, containers: newContainers, links: newLinks });
        setSelectedIds([]);
    }, [data, onDataChange, selectedIds, setSelectedIds]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                    return;
                }
                e.preventDefault();
                handleDeleteSelected();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, handleDeleteSelected]);



    const onAddNode = (type: IconType) => {
        if (!canvasContainerRef.current) return;
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();

        const [viewX, viewY] = viewTransform.invert([canvasRect.width / 2, canvasRect.height / 2]);

        const newNode: ArchNode = {
            id: nanoid(),
            label: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: type,
            x: viewX,
            y: viewY,
            width: 150,
            height: 80,
            borderStyle: 'solid',
            borderWidth: 'medium',
            borderColor: '#000000',
        };
        const newData = { ...data, nodes: [...data.nodes, newNode] };
        onDataChange(newData);
        setInteractionMode('select');
        setSelectedIds([newNode.id]);
    };

    // Handler for custom image uploads (Pro feature)
    const handleCustomImageUpload = (imageData: string) => {
        if (!canvasContainerRef.current) return;
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();
        const [viewX, viewY] = viewTransform.invert([canvasRect.width / 2, canvasRect.height / 2]);

        const newNode: ArchNode = {
            id: nanoid(),
            label: 'Custom Image',
            type: 'custom-image',
            x: viewX,
            y: viewY,
            width: 200,
            height: 150,
            customIcon: imageData,
            customIconSize: 100,
            shapeOpacity: 0, // No background by default
            borderStyle: 'none',
            borderWidth: 'medium',
            borderColor: 'transparent',
        };
        const newData = { ...data, nodes: [...data.nodes, newNode] };
        onDataChange(newData);
        setInteractionMode('select');
        setSelectedIds([newNode.id]);
        setToastMessage('Custom image added!');
    };

    const handleLinkStart = useCallback((sourceNodeId: string, startPos: { x: number, y: number }) => {
        setLinkingState({ sourceNodeId, startPos });
    }, []);

    const handleLinkEnd = useCallback((targetNodeId?: string) => {
        if (linkingState && targetNodeId && linkingState.sourceNodeId !== targetNodeId) {
            const newLink: Link = {
                id: nanoid(),
                source: linkingState.sourceNodeId,
                target: targetNodeId,
            };
            onDataChange({ ...data, links: [...data.links, newLink] });
        }
        setLinkingState(null);
        setPreviewLinkTarget(null);
    }, [linkingState, data, onDataChange]);

    const handleLinkMove = useCallback((e: MouseEvent) => {
        if (!linkingState || !canvasContainerRef.current) return;
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();
        const [x, y] = viewTransform.invert([e.clientX - canvasRect.left, e.clientY - canvasRect.top]);

        let targetNodeId: string | undefined = undefined;
        if (e.target instanceof Element) {
            const parentGroup = e.target.closest('g.diagram-node');
            if (parentGroup) {
                targetNodeId = parentGroup.getAttribute('data-node-id') || undefined;
            }
        }

        setPreviewLinkTarget({ x, y, targetNodeId });
    }, [linkingState, viewTransform]);

    useEffect(() => {
        if (linkingState) {
            const handleMouseUp = (e: MouseEvent) => {
                let targetNodeId: string | undefined;
                // Check if the mouse is released over a node
                if (e.target instanceof Element) {
                    const parentGroup = e.target.closest('g.diagram-node');
                    if (parentGroup) {
                        targetNodeId = parentGroup.getAttribute('data-node-id') || undefined;
                    }
                }
                handleLinkEnd(targetNodeId);
            };

            window.addEventListener('mousemove', handleLinkMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleLinkMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [linkingState, handleLinkMove, handleLinkEnd]);

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
        if (!data) return;
        const filename = data.title.replace(/[\s/]/g, '_').toLowerCase();

        if (format === 'json') {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            downloadBlob(blob, `${filename}.json`);
            return;
        }

        const svgElement = svgRef.current;
        if (!svgElement) {
            setToastMessage("Export failed: SVG element not found.");
            return;
        }

        // Calculate dimensions and background color for export
        const contentGroup = svgElement.querySelector('.diagram-content');
        if (!contentGroup) {
            setToastMessage("Export failed: Diagram content not found.");
            return;
        }
        const bbox = (contentGroup as SVGGraphicsElement).getBBox();

        const padding = 20;
        const exportWidth = Math.round(bbox.width + padding * 2);
        const exportHeight = Math.round(bbox.height + padding * 2);

        const rootStyle = getComputedStyle(document.documentElement);
        const bgColor = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#FFF9FB';

        if (format === 'html') {
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            // Create a simple HTML wrapper
            const htmlString = `
<!DOCTYPE html>
<html>
<head>
    <title>${data.title}</title>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: ${bgColor}; }
        svg { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: ${bgColor}; }
    </style>
</head>
<body>
    ${svgString}
</body>
</html>`;
            const blob = new Blob([htmlString], { type: 'text/html' });
            downloadBlob(blob, `${filename}.html`);
            return;
        }

        if (format === 'png') {
            try {
                // 1. Clone the SVG to manipulate it for export without affecting the live view
                const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

                // 2. Inline Computed Styles
                // This is critical: Canvas doesn't know about external CSS classes.
                // We must copy computed styles from the live elements to the cloned elements.
                const originalElements = Array.from(svgElement.querySelectorAll('*'));
                const clonedElements = Array.from(svgClone.querySelectorAll('*'));

                // Note: deeply nested SVGs might misalign in count if shadow DOM is involved, 
                // but for standard SVG structure this usually matches 1:1.
                // We limit this to standard SVG elements to avoid massive perf hits on huge diagrams if needed,
                // but checking all is safest for visual fidelity.
                originalElements.forEach((sourceEl, index) => {
                    const targetEl = clonedElements[index];
                    if (targetEl && sourceEl instanceof Element && targetEl instanceof Element) {
                        // Copy styles explicitly
                        const computedStyle = window.getComputedStyle(sourceEl);
                        const targetStyle = (targetEl as SVGElement).style; // Safe cast

                        // We prioritize stroke, fill, coloring, and font properties
                        // Copying ALL styles is too slow and huge.
                        const essentialProps = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'opacity', 'visibility', 'transform', 'width', 'height', 'transform-origin', 'transform-box', 'display', 'flex-direction', 'justify-content', 'align-items'];
                        essentialProps.forEach(prop => {
                            const val = computedStyle.getPropertyValue(prop);
                            if (val && val !== 'none' && val !== 'auto' && val !== '0px') {
                                targetStyle.setProperty(prop, val);
                            }
                        });

                        // Copy CSS variables if needed? usually they are resolved by getComputedStyle into actual colors.
                    }
                });

                // 3. Configure the Clone (Dimensions, ViewBox)
                // Re-select content group from CLONE
                const clonedContentGroup = svgClone.querySelector('.diagram-content');
                if (clonedContentGroup instanceof SVGGraphicsElement) { // Check instance for safety
                    // Adjust transform for padding
                    clonedContentGroup.setAttribute('transform', `translate(${-bbox.x + padding}, ${-bbox.y + padding})`);
                }

                // Create a background rect
                const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgRect.setAttribute('width', '100%');
                bgRect.setAttribute('height', '100%');
                bgRect.setAttribute('fill', bgColor);

                // Prepend background
                svgClone.insertBefore(bgRect, svgClone.firstChild);

                svgClone.setAttribute('width', `${exportWidth}`);
                svgClone.setAttribute('height', `${exportHeight}`);
                svgClone.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`);

                // 4. Serialize to String
                const serializer = new XMLSerializer();
                const svgString = serializer.serializeToString(svgClone);

                // 5. Draw to Canvas
                const canvas = document.createElement('canvas');
                const scale = 2; // Retina resolution
                canvas.width = exportWidth * scale;
                canvas.height = exportHeight * scale;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Could not create canvas context");

                ctx.scale(scale, scale);

                const img = new Image();
                // Use standard Base64 encoding for the SVG
                // unescape(encodeURIComponent(x)) handles unicode properties correctly
                const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            downloadBlob(blob, `${filename}.png`);
                        } else {
                            setToastMessage("Export failed: Empty blob.");
                        }
                    }, 'image/png');
                };

                img.onerror = (e) => {
                    console.error("SVG Load Error", e);
                    setToastMessage("Export failed: Browser could not render SVG to image.");
                };

                img.src = svgUrl;

            } catch (error) {
                console.error("Export failed:", error);
                setToastMessage("Export failed: Error preparing diagram.");
            }
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target?.result as string;
                const importedData = JSON.parse(jsonString);

                // Validate structure
                if (!importedData.title || !Array.isArray(importedData.nodes) || !Array.isArray(importedData.links)) {
                    throw new Error('Invalid diagram format');
                }

                // Apply imported data
                onDataChange(importedData);
                setToastMessage(`Imported: ${importedData.title}`);
                setTimeout(() => fitScreenRef.current?.(), 100);
            } catch (err) {
                setToastMessage('Import failed: Invalid JSON file');
            }
        };
        reader.readAsText(file);

        // Reset input so same file can be imported again
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-bg)] app-bg flex flex-col md:flex-row z-30">
            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
            />
            <AnimatePresence>
                {toastMessage && (
                    <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
                )}
            </AnimatePresence>

            {!isViewMode && (
                <div className="order-2 md:order-1 h-full flex flex-col md:flex-row">
                    <PlaygroundToolbar
                        interactionMode={interactionMode}
                        onSetInteractionMode={handleSetInteractionMode}
                        onAddContainer={handleAddContainer}
                        onFitToScreen={handleFitToScreen}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onExport={handleExport}
                        onImport={() => fileInputRef.current?.click()}
                        isViewMode={isViewMode}
                        onToggleViewMode={toggleViewMode}
                        onZoomIn={() => (fitScreenRef.current as any)?.zoomIn?.()}
                        onZoomOut={() => (fitScreenRef.current as any)?.zoomOut?.()}
                        zoomLevel={viewTransform.k}
                    />
                    <AnimatePresence>
                        {interactionMode === 'addNode' && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                className="fixed bottom-0 left-0 right-0 z-20 md:relative md:bottom-auto md:left-auto md:right-auto"
                            >
                                <AddNodePanel
                                    onSelectNodeType={onAddNode}
                                    onClose={() => setInteractionMode('select')}
                                    onCustomImageUpload={handleCustomImageUpload}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <main className="order-1 md:order-2 flex-1 flex flex-col relative" ref={canvasContainerRef}>
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                    {!isViewMode ? (
                        <button onClick={onExit} className="bg-[var(--color-panel-bg)] text-[var(--color-text-primary)] font-semibold py-2 px-4 rounded-full shadow-lg border border-[var(--color-border)] pointer-events-auto hover:bg-[var(--color-button-bg-hover)] transition-colors">
                            &larr; Exit
                        </button>
                    ) : (
                        <button onClick={() => setIsViewMode(false)} className="bg-[var(--color-panel-bg)] text-[var(--color-text-primary)] font-semibold py-2 px-4 rounded-full shadow-lg border border-[var(--color-border)] pointer-events-auto hover:bg-[var(--color-button-bg-hover)] transition-colors opacity-50 hover:opacity-100">
                            Exit View Mode (Esc)
                        </button>
                    )}
                    {/* Contextual Action Bar removed as per user request to reduce clutter */}
                </div>
                <DiagramCanvas
                    forwardedRef={svgRef}
                    fitScreenRef={fitScreenRef}
                    data={data}
                    onDataChange={onDataChange}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    isEditable={!isViewMode}
                    interactionMode={interactionMode}
                    onTransformChange={setViewTransform}
                    resizingNodeId={resizingNodeId}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onCanvasClick={handleCanvasClick}
                    onLinkStart={handleLinkStart}
                    linkingState={linkingState}
                    previewLinkTarget={previewLinkTarget}
                />
            </main>

            <AnimatePresence>
                {isPropertiesPanelOpen && (
                    <motion.aside
                        key="properties-sidebar"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="order-3 w-screen max-w-sm md:w-80 h-full bg-[var(--color-panel-bg)] border-l border-[var(--color-border)] shadow-2xl z-20"
                    >
                        <PropertiesSidebar
                            item={selectedItem}
                            onPropertyChange={handlePropertyChange}
                            selectedCount={selectedIds.length}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>


            {/* Exit Confirmation Modal */}
        </div>
    );
};

export default Playground;