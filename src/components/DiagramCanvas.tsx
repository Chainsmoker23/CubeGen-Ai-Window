import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom, zoomIdentity, ZoomTransform } from 'd3-zoom';
import 'd3-transition';
import { DiagramData, ArchNode, Link, Container } from '../types';
import ArchitectureIcon from './ArchitectureIcon';
import ContextMenu from './ContextMenu';
import { motion } from 'framer-motion';

import { generateLinkColors, LINK_COLORS } from '../utils/linkColorAssigner';
import { calculateAdaptiveCurveTension, getAnimatedFlowClass } from '../utils/linkPathUtils';

const GRID_SIZE = 10;

export type InteractionMode = 'select' | 'pan' | 'addNode' | 'link';
type HandleType = 'top' | 'right' | 'bottom' | 'left';

interface DiagramCanvasProps {
  data: DiagramData;
  onDataChange: (newData: DiagramData, fromHistory?: boolean) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  forwardedRef: React.RefObject<SVGSVGElement>;
  fitScreenRef: React.RefObject<(() => void) | null>;
  isEditable?: boolean;
  interactionMode?: InteractionMode;
  onTransformChange?: (transform: ZoomTransform) => void;
  resizingNodeId?: string | null;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCanvasClick?: (event?: PointerEvent) => void;
  onLinkStart: (sourceNodeId: string, startPos: { x: number, y: number }) => void;
  linkingState: { sourceNodeId: string; startPos: { x: number, y: number } } | null;
  previewLinkTarget: { x: number; y: number; targetNodeId?: string } | null;
  showGrid?: boolean;
  autoFit?: boolean;
}

// ====================================================================================
// --- Main Canvas Component ---
// ====================================================================================

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  data, onDataChange, selectedIds, setSelectedIds, forwardedRef, fitScreenRef,
  isEditable = false,
  interactionMode = 'select',
  onTransformChange, resizingNodeId = null, onNodeDoubleClick, onCanvasClick,
  onLinkStart, linkingState, previewLinkTarget,
  showGrid = true,
  autoFit = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTransform, setViewTransform] = useState<ZoomTransform>(() => zoomIdentity);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ArchNode | Link | Container; } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-enhance layout logic removed - relying on backend generation


  // Auto-enhance layout logic removed - relying on backend generation




  const nodesById = useMemo(() => new Map(data.nodes.map(node => [node.id, node])), [data.nodes]);

  const linkGroups = useMemo(() => {
    const groups = new Map<string, { fwd: string[], bwd: string[] }>();
    data.links.forEach((link: Link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const key = [sourceId, targetId].sort().join('--');
      if (!groups.has(key)) {
        groups.set(key, { fwd: [], bwd: [] });
      }
      const group = groups.get(key)!;
      if (sourceId < targetId) {
        group.fwd.push(link.id);
      } else {
        group.bwd.push(link.id);
      }
    });
    return groups;
  }, [data.links]);

  // Generate relational-based colors for links
  const linkColorMap = useMemo(() => {
    return generateLinkColors(data.links, data.nodes);
  }, [data.links, data.nodes]);

  const renderableLinks = useMemo(() => {
    return data.links.map((link: Link) => {
      const sourceNode = nodesById.get(typeof link.source === 'string' ? link.source : (link.source as ArchNode).id);
      const targetNode = nodesById.get(typeof link.target === 'string' ? link.target : (link.target as ArchNode).id);

      if (!sourceNode || !targetNode) return null;

      const sourceId = sourceNode.id;
      const targetId = targetNode.id;

      // Enhanced connection point detection using Ray Casting for Continuous Docking
      const getConnectionPoint = (node: ArchNode, otherNode: ArchNode, _isSource: boolean, _isBidirectional: boolean = false, _isReverse: boolean = false) => {
        // Continuous Docking Logic:
        // Instead of snapping to Top/Right/Bottom/Left midpoints, calculate the EXACT intersection
        // of the line (center-to-center) with the node's bounding box.

        const cx = node.x;
        const cy = node.y;
        let w = (node.width || 120) / 2;
        let h = (node.height || 60) / 2;

        // Custom Icon Tighter Docking: Shrink bounding box effectively so arrows touch the image
        if ((node as any).customIcon) {
          w = w * 0.85;
          h = h * 0.85;
        }

        const targetX = otherNode.x;
        const targetY = otherNode.y;

        const dx = targetX - cx;
        const dy = targetY - cy;

        // Avoid division by zero
        if (dx === 0 && dy === 0) return { x: cx, y: cy, side: 'top' as const };

        // Ray equation: P = Center + t * Direction
        // Find smallest positive t where P hits the boundary (x = +/- w or y = +/- h)

        // t for vertical edges (x = +/- w)
        // t_x * dx = +/- w  => t_x = w / |dx|
        const t_x = dx === 0 ? Infinity : w / Math.abs(dx);

        // t for horizontal edges (y = +/- h)
        // t_y * dy = +/- h  => t_y = h / |dy|
        const t_y = dy === 0 ? Infinity : h / Math.abs(dy);

        // The intersection is at the smaller t
        const t = Math.min(t_x, t_y);

        let finalX = cx + t * dx;
        let finalY = cy + t * dy;

        // Determine side for potential metadata/arrowhead rotation hint
        let side: 'top' | 'right' | 'bottom' | 'left';
        if (t_x < t_y) {
          side = dx > 0 ? 'right' : 'left';
        } else {
          side = dy > 0 ? 'bottom' : 'top';
        }

        // Apply bidirectional offset if needed
        // For continuous docking, we offset perpendicular to the line
        if (isBidirectional) {
          const offsetDist = 10;
          const multiplier = isReverse ? -1 : 1;

          // Calculate perpendicular vector
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const perpX = -dy / len;
            const perpY = dx / len;

            finalX += perpX * offsetDist * multiplier;
            finalY += perpY * offsetDist * multiplier;
          }
        }

        return { x: finalX, y: finalY, side };
      };

      // Check if this is part of a bidirectional pair
      const key = [sourceId, targetId].sort().join('--');
      const group = linkGroups.get(key) || { fwd: [], bwd: [] };
      const isBidirectional = group.fwd.length > 0 && group.bwd.length > 0;
      const isForward = group.fwd.includes(link.id);
      const isReverse = group.bwd.includes(link.id);

      // Get connection points for both ends
      const sourcePoint = getConnectionPoint(sourceNode, targetNode, true, isBidirectional, false);
      const targetPoint = getConnectionPoint(targetNode, sourceNode, false, isBidirectional, isReverse);

      const LINK_SPACING = 12; // Reduced spacing for individual link offset

      const allLinksInGroup = [...group.fwd, ...group.bwd];
      const linkIndex = allLinksInGroup.indexOf(link.id);
      const totalLinks = allLinksInGroup.length;

      const groupOffset = (linkIndex - (totalLinks - 1) / 2) * LINK_SPACING;

      const isNeuronLink = sourceNode.type === 'neuron' && targetNode.type === 'neuron';

      // --- Path & Label Calculation with enhanced styling ---
      let pathD: string;
      let labelPos: { x: number, y: number } | null = null;

      if (isNeuronLink) {
        const dx = targetPoint.x - sourcePoint.x;
        const dy = targetPoint.y - sourcePoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) {
          pathD = '';
        } else {
          const sourceRadius = sourceNode.width / 2;
          const targetRadius = targetNode.width / 2;
          const p1 = { x: sourcePoint.x + (dx / dist) * sourceRadius, y: sourcePoint.y + (dy / dist) * sourceRadius };
          const p4 = { x: targetPoint.x - (dx / dist) * targetRadius, y: targetPoint.y - (dy / dist) * targetRadius };
          pathD = `M ${p1.x} ${p1.y} L ${p4.x} ${p4.y}`;
        }
      } else {
        const dx = targetPoint.x - sourcePoint.x;
        const dy = targetPoint.y - sourcePoint.y;
        const isPrimarilyHorizontal = Math.abs(dx) > Math.abs(dy);

        // Use custom curvature from link properties or default
        const curvaturePercent = link.curvature || 30;
        const maxCurve = Math.min(Math.abs(dx), Math.abs(dy)) * (curvaturePercent / 100);

        // ADVANCED: Distance-Adaptive Curve Tension
        // Short distance → tighter curves, Long distance → smoother, wider curves
        const adaptiveCurve = calculateAdaptiveCurveTension(sourceNode, targetNode, curvaturePercent);
        const cornerRadius = Math.min(adaptiveCurve.cornerRadius, maxCurve / 2);

        let p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }, p4: { x: number, y: number };

        const hasBidirectionalPair = group.fwd.length > 0 && group.bwd.length > 0;
        const directionMultiplier = hasBidirectionalPair ? (isForward ? -1 : 1) : -1;

        if (isPrimarilyHorizontal) {
          // H-V-H path with enhanced bidirectional separation and obstacle avoidance
          p1 = { x: sourcePoint.x, y: sourcePoint.y };
          p4 = { x: targetPoint.x, y: targetPoint.y };

          // Calculate the midpoint X, but offset it to avoid crossing through nodes
          let midX = (p1.x + p4.x) / 2 + groupOffset + (isBidirectional ? directionMultiplier * 15 : 0);

          // Smart offset: if nodes are at different Y levels, route around not through
          const yDiff = Math.abs(p1.y - p4.y);
          const xDiff = Math.abs(p1.x - p4.x);

          // If the Y difference is significant but X difference is larger (horizontal flow)
          // route the vertical segment outside the node area
          if (yDiff > 30 && xDiff > 100) {
            // Offset the midpoint to route around intermediate nodes
            const routeOffset = xDiff * 0.1; // 10% offset
            midX = p4.x - routeOffset; // Route closer to target to avoid middle nodes
          }

          p2 = { x: midX, y: p1.y };
          p3 = { x: midX, y: p4.y };

          // Apply custom angle if specified
          if (link.angle) {
            const angleRad = (link.angle * Math.PI) / 180;
            const offsetX = Math.cos(angleRad) * (link.offsetDistance || 20);
            const offsetY = Math.sin(angleRad) * (link.offsetDistance || 20);
            p2.x += offsetX;
            p2.y += offsetY;
            p3.x += offsetX;
            p3.y += offsetY;
          }

          pathD = `M ${p1.x} ${p1.y} H ${p2.x - cornerRadius * Math.sign(p2.x - p1.x)} Q ${p2.x} ${p2.y}, ${p2.x} ${p2.y + cornerRadius * Math.sign(p3.y - p2.y)} V ${p3.y - cornerRadius * Math.sign(p3.y - p2.y)} Q ${p3.x} ${p3.y}, ${p3.x + cornerRadius * Math.sign(p4.x - p3.x)} ${p3.y} H ${p4.x}`;

          if (link.label) {
            const labelX = p2.x;
            const labelY = (p2.y + p3.y) / 2;
            const xOffset = 15 * directionMultiplier;
            labelPos = { x: labelX + xOffset, y: labelY };
          }
        } else {
          // V-H-V path with enhanced bidirectional separation and obstacle avoidance
          p1 = { x: sourcePoint.x, y: sourcePoint.y };
          p4 = { x: targetPoint.x, y: targetPoint.y };

          // Calculate the midpoint Y, but offset it to avoid crossing through nodes
          let midY = (p1.y + p4.y) / 2 + groupOffset + (isBidirectional ? directionMultiplier * 15 : 0);

          // Smart offset: if nodes are at different X levels, route around not through
          const yDiff = Math.abs(p1.y - p4.y);
          const xDiff = Math.abs(p1.x - p4.x);

          // If the X difference is significant but Y difference is larger (vertical flow)
          // route the horizontal segment outside the node area
          if (xDiff > 30 && yDiff > 100) {
            // Offset the midpoint to route around intermediate nodes
            const routeOffset = yDiff * 0.1; // 10% offset
            midY = p4.y - routeOffset; // Route closer to target to avoid middle nodes
          }

          p2 = { x: p1.x, y: midY };
          p3 = { x: p4.x, y: midY };

          // Apply custom angle if specified
          if (link.angle) {
            const angleRad = (link.angle * Math.PI) / 180;
            const offsetX = Math.cos(angleRad) * (link.offsetDistance || 20);
            const offsetY = Math.sin(angleRad) * (link.offsetDistance || 20);
            p2.x += offsetX;
            p2.y += offsetY;
            p3.x += offsetX;
            p3.y += offsetY;
          }

          pathD = `M ${p1.x} ${p1.y} V ${p2.y - cornerRadius * Math.sign(p2.y - p1.y)} Q ${p2.x} ${p2.y}, ${p2.x + cornerRadius * Math.sign(p3.x - p2.x)} ${p2.y} H ${p3.x - cornerRadius * Math.sign(p3.x - p2.x)} Q ${p3.x} ${p3.y}, ${p3.x} ${p3.y + cornerRadius * Math.sign(p4.y - p3.y)} V ${p4.y}`;

          if (link.label) {
            const labelX = (p2.x + p3.x) / 2;
            const labelY = p2.y;
            const yOffset = 15 * directionMultiplier;
            labelPos = { x: labelX, y: labelY + yOffset };
          }
        }
      }

      return {
        link,
        pathD,
        labelPos,
        isNeuronLink,
        sourcePoint,
        targetPoint,
        isBidirectional,
        isForward,
        isReverse
      };
    }).filter(Boolean) as {
      link: Link;
      pathD: string;
      labelPos: { x: number, y: number } | null;
      isNeuronLink: boolean;
      sourcePoint: { x: number, y: number },
      targetPoint: { x: number, y: number },
      isBidirectional: boolean,
      isForward: boolean,
      isReverse: boolean
    }[];

    // Store the filtered links for intelligent label adjustment
    const linksWithPaths = data.links.map((link: Link) => {
      const sourceNode = nodesById.get(typeof link.source === 'string' ? link.source : link.source.id);
      const targetNode = nodesById.get(typeof link.target === 'string' ? link.target : link.target.id);
      if (!sourceNode || !targetNode) return null;

      const sourceId = sourceNode.id;
      const targetId = targetNode.id;
      const key = [sourceId, targetId].sort().join('--');
      const group = linkGroups.get(key) || { fwd: [], bwd: [] };
      const isBidirectional = group.fwd.length > 0 && group.bwd.length > 0;
      const isForward = group.fwd.includes(link.id);
      const isReverse = group.bwd.includes(link.id);

      // Find from our already calculated results
      return {
        link, pathD: '', labelPos: null as { x: number, y: number } | null,
        isNeuronLink: false, sourcePoint: { x: sourceNode.x, y: sourceNode.y },
        targetPoint: { x: targetNode.x, y: targetNode.y }, isBidirectional, isForward, isReverse
      };
    }).filter(Boolean) as {
      link: Link;
      pathD: string;
      labelPos: { x: number, y: number } | null;
      isNeuronLink: boolean;
      sourcePoint: { x: number, y: number },
      targetPoint: { x: number, y: number },
      isBidirectional: boolean,
      isForward: boolean,
      isReverse: boolean
    }[];

    // =========================================================================
    // INTELLIGENT LABEL POSITIONING - Collision avoidance & smart placement
    // =========================================================================
    const adjustedLinks: typeof linksWithPaths = [];

    // Track occupied areas (starts with nodes)
    const occupiedZones: { x: number, y: number, w: number, h: number }[] = data.nodes.map((node: ArchNode) => ({
      x: node.x,
      y: node.y,
      w: node.width || 120,
      h: node.height || 60
    }));

    // Serial processing to ensure later labels avoid earlier ones
    linksWithPaths.forEach((linkData) => {
      if (!linkData.labelPos || !linkData.link.label) {
        adjustedLinks.push(linkData);
        return;
      }

      const labelWidth = linkData.link.label.length * 7 + 28;
      const labelHeight = 24;
      let bestPos = linkData.labelPos;
      let foundCleanSpot = false;

      // Define candidates: Original -> Vertical offsets -> Horizontal offsets -> Diagonals -> Extended offsets
      const candidates = [
        { x: 0, y: 0 },
        { x: 0, y: -25 }, { x: 0, y: 25 },     // Close Vertical
        { x: 0, y: -45 }, { x: 0, y: 45 },     // Far Vertical
        { x: 30, y: 0 }, { x: -30, y: 0 },     // Close Horizontal
        { x: 20, y: -20 }, { x: -20, y: -20 }, // Diagonals
        { x: 20, y: 20 }, { x: -20, y: 20 },
        { x: 50, y: 0 }, { x: -50, y: 0 }      // Far Horizontal
      ];

      for (const offset of candidates) {
        const testX = linkData.labelPos.x + offset.x;
        const testY = linkData.labelPos.y + offset.y;

        // Define label rect with padding
        const labelRect = {
          left: testX - labelWidth / 2 - 4, // 4px extra buffer
          right: testX + labelWidth / 2 + 4,
          top: testY - labelHeight / 2 - 4,
          bottom: testY + labelHeight / 2 + 4
        };

        const hasCollision = occupiedZones.some(zone => {
          const zoneLeft = zone.x - zone.w / 2;
          const zoneRight = zone.x + zone.w / 2;
          const zoneTop = zone.y - zone.h / 2;
          const zoneBottom = zone.y + zone.h / 2;

          return !(labelRect.right < zoneLeft || labelRect.left > zoneRight ||
            labelRect.bottom < zoneTop || labelRect.top > zoneBottom);
        });

        if (!hasCollision) {
          bestPos = { x: testX, y: testY };
          foundCleanSpot = true;
          break;
        }
      }

      // If no clean spot, try a "desperate" fallback that shifts based on index to avoid total stacking
      if (!foundCleanSpot) {
        const shift = (adjustedLinks.length % 3) * 20; // 0, 20, 40
        bestPos = { x: bestPos.x + 40, y: bestPos.y - 40 - shift };
      }

      // Register this label's final position as occupied
      occupiedZones.push({
        x: bestPos.x,
        y: bestPos.y,
        w: labelWidth,
        h: labelHeight
      });

      adjustedLinks.push({
        ...linkData,
        labelPos: bestPos
      });
    });

    return adjustedLinks;
  }, [data.links, data.nodes, nodesById, linkGroups]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const tierColors = useMemo(() => {
    const colors = [
      'var(--color-tier-1)', 'var(--color-tier-2)', 'var(--color-tier-3)',
      'var(--color-tier-4)', 'var(--color-tier-5)', 'var(--color-tier-6)',
    ];
    // Filter containers that should get tier coloring - including all container types
    const tierContainers = data.containers?.filter((c: Container) =>
      c.type === 'tier' || c.type === 'vpc' || c.type === 'subnet' || c.type === 'region' || c.type === 'availability-zone'
    ).sort((a: Container, b: Container) => a.y - b.y) || [];
    const colorMap = new Map<string, string>();
    tierContainers.forEach((container: Container, index: number) => {
      colorMap.set(container.id, colors[index % colors.length]);
    });
    return colorMap;
  }, [data.containers]);

  const handleItemSelection = (e: React.MouseEvent, id: string) => {
    if (interactionMode !== 'select') return;
    if (e.shiftKey) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    } else {
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
    }
  };

  useEffect(() => {
    if (!forwardedRef.current) return;
    const svg = select(forwardedRef.current);
    const parent = containerRef.current;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
    zoomBehavior.filter((event: any) => {
      // Prevent double-tap to zoom on touch devices and double-click on desktop
      if (event.type === 'dblclick') return false;

      if (event.type === 'wheel') return true;
      // Allow panning in 'pan' mode regardless of editable state
      if (interactionMode === 'pan') return !event.button || event.button === 0;

      if (!isEditable) return false; // Otherwise enforce editable check

      if (event.defaultPrevented) return false;
      const isBackgroundDrag = (event.target as HTMLElement)?.tagName === 'svg';
      return event.button === 2 || (interactionMode === 'select' && isBackgroundDrag);
    })
      .on('zoom', (event: any) => {
        setViewTransform(event.transform);
        if (onTransformChange) onTransformChange(event.transform);
      });

    svg.call(zoomBehavior)
      .on("dblclick.zoom", null)  // Disable d3 zoom double click
      .on("dblclick", null);      // Disable standard double click just in case

    const fitToScreen = (instant = false) => {
      const contentGroup = svg.select<SVGGElement>('.diagram-content').node();
      if (!contentGroup || !parent || data.nodes.length === 0) return;
      const bounds = contentGroup.getBBox();
      const parentWidth = parent.clientWidth; const parentHeight = parent.clientHeight;
      const { width: diagramWidth, height: diagramHeight, x: diagramX, y: diagramY } = bounds;
      if (diagramWidth <= 0 || diagramHeight <= 0) return;
      const scale = Math.min(4, 0.95 / Math.max(diagramWidth / parentWidth, diagramHeight / parentHeight));
      const tx = parentWidth / 2 - (diagramX + diagramWidth / 2) * scale;
      const ty = parentHeight / 2 - (diagramY + diagramHeight / 2) * scale;

      if (instant) {
        svg.call(zoomBehavior.transform, zoomIdentity.translate(tx, ty).scale(scale));
      } else {
        svg.transition().duration(750).call(zoomBehavior.transform, zoomIdentity.translate(tx, ty).scale(scale));
      }
    };

    const zoomIn = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.2);
    };

    const zoomOut = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.8);
    };

    if (fitScreenRef) {
      // Expose controls via the ref
      (fitScreenRef as React.MutableRefObject<any>).current = {
        fitToScreen: () => fitToScreen(false),
        zoomIn,
        zoomOut
      };
    }

    // Auto-fit on mount (with slight delay to ensure layout)
    if (autoFit && data.nodes.length > 0) {
      // Use a timeout to ensure DOM is ready and bounds are calculable
      const timer = setTimeout(() => {
        fitToScreen(true);
      }, 50);
      return () => clearTimeout(timer);
    }

    const handleCanvasClick = (event: PointerEvent) => {
      if (!event.defaultPrevented && (event.target as SVGSVGElement).tagName === 'svg') {
        if (onCanvasClick) {
          onCanvasClick(event);
        } else {
          setSelectedIds([]);
        }
        setContextMenu(null);
      }
    };

    const svgNode = svg.node();
    if (svgNode) svgNode.addEventListener('pointerdown', handleCanvasClick as EventListener);

    return () => {
      if (svgNode) svgNode.removeEventListener('pointerdown', handleCanvasClick as EventListener);
      svg.on('.zoom', null);
      if (fitScreenRef) {
        (fitScreenRef as React.MutableRefObject<any>).current = null;
      }
    }
  }, [forwardedRef, setSelectedIds, data, fitScreenRef, isEditable, interactionMode, onTransformChange, onCanvasClick, autoFit]);

  const handleItemContextMenu = (e: React.MouseEvent, item: ArchNode | Link | Container) => {
    e.preventDefault(); e.stopPropagation();
    if (isEditable && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, item });
    }
  };

  const handleDeleteItem = (item: ArchNode | Link | Container) => {
    const { id } = item;
    const newNodes = data.nodes.filter((n: ArchNode) => n.id !== id);
    const newContainers = data.containers?.filter((c: Container) => c.id !== id);
    const remainingNodeIds = new Set(newNodes.map((n: ArchNode) => n.id));
    const newLinks = data.links.filter((l: Link) => l.id !== id && remainingNodeIds.has(typeof l.source === 'string' ? l.source : (l.source as ArchNode).id) && remainingNodeIds.has(typeof l.target === 'string' ? l.target : (l.target as ArchNode).id));
    onDataChange({ ...data, nodes: newNodes, containers: newContainers, links: newLinks });
    setContextMenu(null);
  }



  const getCursor = (): string => {
    if (interactionMode === 'pan') return 'grab';
    if (interactionMode === 'link') return 'crosshair';
    return 'default';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent rounded-b-2xl">
      <svg ref={forwardedRef} className="w-full h-full absolute inset-0" style={{ cursor: getCursor() }}>
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--color-grid-dot)"></circle>
          </pattern>

          {/* Smart Arrowheads - Refined design with precise edge docking */}
          {/* refX=10 positions the TIP exactly where the line ends (at node edge) */}
          <marker id="arrowhead" viewBox="0 0 12 12" refX="10" refY="6" orient="auto" markerWidth="8" markerHeight="8">
            {/* Sleek tapered arrow with slight curve for modern look */}
            <path d="M 1 1 Q 3 6 1 11 L 11 6 Z" fill="currentColor" />
          </marker>
          <marker id="arrowhead-reverse" viewBox="0 0 12 12" refX="2" refY="6" orient="auto" markerWidth="8" markerHeight="8">
            <path d="M 11 1 Q 9 6 11 11 L 1 6 Z" fill="currentColor" />
          </marker>

          {/* Color-coded smart arrowheads for relational coloring */}
          {/* Color-coded smart arrowheads for relational coloring AND custom user colors AND sizes */}
          {Array.from(new Set(data.links.flatMap(l => {
            const assigned = linkColorMap.get(l.id);
            const c = l.color || assigned || 'var(--color-link)';
            const s = l.arrowheadSize || 1;
            const ac = l.arrowheadColor;

            const combos = [`${c}:::${s}`, `var(--color-link):::${s}`];
            if (ac) {
              combos.push(`${ac}:::${s}`);
            }
            return combos;
          }))).map((combo: string) => {
            const [color, sizeStr] = combo.split(':::');
            const size = parseFloat(sizeStr);
            const isVar = color.startsWith('var(');
            // Sanitize ID the same way as usage
            const hexId = isVar ? 'default' : color.replace(/[^a-zA-Z0-9]/g, '');
            // Use currentColor for CSS vars so they inherit from the link stroke, specific color otherwise
            const fill = isVar ? 'currentColor' : color;

            // Scale the marker viewport to create effect of larger/smaller arrow
            const markerWidth = 8 * size;
            const markerHeight = 8 * size;

            return (
              <React.Fragment key={`arrow-${hexId}-${size}`}>
                <marker id={`arrowhead-${hexId}-${size}`} viewBox="0 0 12 12" refX="10" refY="6" orient="auto" markerWidth={markerWidth} markerHeight={markerHeight}>
                  <path d="M 1 1 Q 3 6 1 11 L 11 6 Z" fill={fill} />
                </marker>
                <marker id={`arrowhead-reverse-${hexId}-${size}`} viewBox="0 0 12 12" refX="2" refY="6" orient="auto" markerWidth={markerWidth} markerHeight={markerHeight}>
                  <path d="M 11 1 Q 9 6 11 11 L 1 6 Z" fill={fill} />
                </marker>
              </React.Fragment>
            );
          })}

          {/* Also keep the preset palette just in case specific logic relies on it, though the above catches most usage */}
          {LINK_COLORS.map((color: string, idx: number) => (
            <React.Fragment key={`arrow-preset-${idx}`}>
              <marker id={`arrowhead-${color.replace('#', '')}`} viewBox="0 0 12 12" refX="10" refY="6" orient="auto" markerWidth="8" markerHeight="8">
                <path d="M 1 1 Q 3 6 1 11 L 11 6 Z" fill={color} />
              </marker>
              <marker id={`arrowhead-reverse-${color.replace('#', '')}`} viewBox="0 0 12 12" refX="2" refY="6" orient="auto" markerWidth="8" markerHeight="8">
                <path d="M 11 1 Q 9 6 11 11 L 1 6 Z" fill={color} />
              </marker>
            </React.Fragment>
          ))}

          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="var(--color-shadow)" floodOpacity="0.1" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill={showGrid ? "url(#grid)" : "transparent"} />

        <g className="diagram-content" transform={viewTransform.toString()}>
          {/* Containers Layer */}
          <g>
            {data.containers?.map((container: Container) => (
              <DiagramContainer
                key={container.id}
                container={container}
                data={data}
                onDataChange={onDataChange}
                isSelected={isSelected(container.id)}
                setSelectedIds={setSelectedIds}
                onContextMenu={handleItemContextMenu}
                selectedIds={selectedIds}
                fillColor={container.color || tierColors.get(container.id) || 'var(--color-tier-default)'}
                interactionMode={interactionMode}
                isEditable={isEditable}
                onSelect={(e: React.MouseEvent, id: string) => handleItemSelection(e, id)}
              />
            ))}
          </g>

          {/* Link Paths Layer */}
          <g>
            {renderableLinks.map(({ link, pathD, labelPos, isNeuronLink }) => {
              const selected = isSelected(link.id);

              // Use relational colors from linkColorMap, falling back to custom or default
              const assignedColor = linkColorMap.get(link.id);
              const color = selected
                ? 'var(--color-accent-text)'
                : (link.color || assignedColor || 'var(--color-link)');

              // Helper to sanitize color for ID usage
              const sanitizeColorId = (c: string) => {
                if (c.startsWith('var(')) return 'default';
                return c.replace(/[^a-zA-Z0-9]/g, '');
              };

              // Use custom arrowhead size or default to 1
              const arrowScale = link.arrowheadSize || 1;
              const arrowColor = link.arrowheadColor || color;
              const uniqueMarkerId = `arrowhead-${sanitizeColorId(arrowColor)}-${arrowScale}`;
              const uniqueMarkerReverseId = `arrowhead-reverse-${sanitizeColorId(arrowColor)}-${arrowScale}`;

              const arrowheadId = uniqueMarkerId;
              const arrowheadReverseId = uniqueMarkerReverseId;

              // ADVANCED: Smart flow-aware stroke width calculation
              const getSmartStrokeWidth = () => {
                // If custom stroke width is set, use it
                if (link.strokeWidth) return link.strokeWidth;

                // Map text thickness to numeric values
                if (link.thickness === 'thin') return 1;
                if (link.thickness === 'medium') return 2;
                if (link.thickness === 'thick') return 4;

                if (isNeuronLink) return 0.5;

                // Calculate based on connection importance
                const linkSourceId = typeof link.source === 'string' ? link.source : (link.source as ArchNode).id;
                const linkTargetId = typeof link.target === 'string' ? link.target : (link.target as ArchNode).id;
                const allLinks = data.links || [];
                const sourceConnections = allLinks.filter((l: Link) => {
                  const sid = typeof l.source === 'string' ? l.source : (l.source as ArchNode).id;
                  return sid === linkSourceId;
                }).length;
                const targetConnections = allLinks.filter((l: Link) => {
                  const tid = typeof l.target === 'string' ? l.target : (l.target as ArchNode).id;
                  return tid === linkTargetId;
                }).length;

                // Main distributor nodes get thicker arrows
                const importance = Math.max(sourceConnections, targetConnections);
                if (importance >= 4) return 2.5;  // Major hub
                if (importance >= 3) return 2.2;  // Secondary hub
                if (importance >= 2) return 2;    // Normal flow
                return 1.8;  // Leaf connection
              };
              const strokeWidth = getSmartStrokeWidth();

              // Handle dash patterns
              let dashArray = 'none';
              if (link.animated) {
                // FORCE dash array for animation to work, even if style is solid
                dashArray = '10 5';
              } else if (link.dashPattern && link.dashPattern !== 'none') {
                dashArray = link.dashPattern;
              } else if (link.style === 'dashed') {
                dashArray = '8 6';
              } else if (link.style === 'dotted') {
                dashArray = '2 4';
              }

              return (
                <g
                  key={link.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemSelection(e, link.id);
                  }}
                  onContextMenu={(e) => handleItemContextMenu(e, link)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Click target area */}
                  <path d={pathD} stroke="transparent" strokeWidth={20} fill="none" />

                  {/* Main link path with colored arrowhead */}
                  <path
                    d={pathD}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray === 'none' ? undefined : dashArray}
                    fill="none"
                    markerEnd={link.endMarker !== false && !isNeuronLink && link.arrowheadStyle !== 'none' ? `url(#${arrowheadId})` : undefined}
                    markerStart={link.startMarker ? `url(#${arrowheadReverseId.replace('-reverse-reverse', '-reverse')})` : undefined}
                    className={link.animated ? getAnimatedFlowClass(true, selected) : ''}
                  />

                  {/* Interactive label area for adding/editing link labels */}
                  {labelPos && (
                    <g onClick={(e) => {
                      e.stopPropagation();
                      handleItemSelection(e, link.id);
                    }}>
                      <circle
                        cx={labelPos.x}
                        cy={labelPos.y}
                        r="10"
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth="2"
                        className="cursor-pointer hover:fill-[var(--color-accent-soft)]"
                      />
                    </g>
                  )}

                  {/* Alternative click area for adding labels if no label exists yet */}
                  {!labelPos && (
                    <g onClick={(e) => {
                      e.stopPropagation();
                      handleItemSelection(e, link.id);
                    }}>
                      <path d={pathD} stroke="transparent" strokeWidth={15} fill="none" className="cursor-pointer" />
                    </g>
                  )}

                  {/* Visualize connection points and bidirectional separation (debug) */}
                  {/*
                  <circle cx={sourcePoint.x} cy={sourcePoint.y} r="3" fill={isBidirectional ? (isForward ? "red" : "orange") : "green"} />
                  <circle cx={targetPoint.x} cy={targetPoint.y} r="3" fill={isBidirectional ? (isReverse ? "purple" : "blue") : "blue"} />
                  */}
                </g>
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g>
            {data.nodes.map(node => (
              <DiagramNode
                key={node.id}
                node={node}
                data={data}
                onDataChange={onDataChange}
                isSelected={isSelected(node.id)}
                setSelectedIds={setSelectedIds}
                onContextMenu={handleItemContextMenu}
                selectedIds={selectedIds}
                interactionMode={interactionMode}
                isEditable={isEditable}
                resizingNodeId={resizingNodeId}
                onNodeDoubleClick={onNodeDoubleClick}
                onLinkStart={onLinkStart}
                isLinkHoverTarget={previewLinkTarget?.targetNodeId === node.id}
                onSelect={handleItemSelection}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            ))}
          </g>

          {/* Preview Link (on top of nodes) */}
          {linkingState && previewLinkTarget && (
            <path
              d={`M ${linkingState.startPos.x} ${linkingState.startPos.y} L ${previewLinkTarget.x} ${previewLinkTarget.y} `}
              stroke="var(--color-accent-text)"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="none"
              markerEnd="url(#arrowhead)"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Link Labels Layer (On Top) - ADVANCED SMART LABELS */}
          <g>
            {renderableLinks.map(({ link, labelPos }) => {
              if (!link.label || !labelPos) return null;

              const labelText = link.label;
              // Smart width calculation based on text length
              const charWidth = 7;
              const paddingX = 14;

              const labelWidth = Math.max(labelText.length * charWidth + paddingX * 2, 50);
              const labelHeight = 24;
              const borderRadius = labelHeight / 2; // Pill shape

              // Get link color for accent border
              const assignedColor = linkColorMap.get(link.id);
              const linkColor = link.color || assignedColor || 'var(--color-link)';

              return (
                <g key={`${link.id} -label`} style={{ pointerEvents: 'none' }}>
                  {/* Shadow layer for depth */}
                  <rect
                    x={labelPos.x - labelWidth / 2 + 1}
                    y={labelPos.y - labelHeight / 2 + 2}
                    width={labelWidth}
                    height={labelHeight}
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="rgba(0, 0, 0, 0.08)"
                  />
                  {/* Background pill with subtle gradient feel */}
                  <rect
                    x={labelPos.x - labelWidth / 2}
                    y={labelPos.y - labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="var(--color-canvas-bg)"
                    stroke={linkColor}
                    strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))' }}
                  />
                  {/* Label text with improved typography */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    dy=".35em"
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="11px"
                    fontWeight="600"
                    fontFamily="Inter, system-ui, sans-serif"
                    letterSpacing="0.2px"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      {
        contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            options={
              'source' in contextMenu.item
                ? [
                  { label: 'Delete', onClick: () => handleDeleteItem(contextMenu.item) }
                ]
                : [{ label: 'Delete', onClick: () => handleDeleteItem(contextMenu.item) }]
            }
            onClose={() => setContextMenu(null)}
          />
        )
      }

    </div >
  );
};

// ====================================================================================
// --- Shape Renderer Component ---
// ====================================================================================

const ShapeRenderer: React.FC<{
  node: ArchNode;
  commonProps: any;
}> = ({ node, commonProps }) => {
  const { shape = 'rectangle', width: w, height: h } = node;

  const props = { ...commonProps, width: w, height: h };
  delete props.style; // Style is applied to the <g> wrapper in DiagramNode

  switch (shape) {
    case 'ellipse':
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...props} />;
    case 'circle':
      const r = Math.min(w, h) / 2;
      return <circle cx={w / 2} cy={h / 2} r={r} {...props} />;
    case 'diamond':
      return <polygon points={`${w / 2}, 0 ${w},${h / 2} ${w / 2},${h} 0, ${h / 2} `} {...props} />;
    case 'rounded-rectangle':
      return <rect rx={Math.min(w, h) * 0.2} ry={Math.min(w, h) * 0.2} {...props} />;
    case 'triangle':
      return <polygon points={`${w / 2}, 0 ${w},${h} 0, ${h} `} {...props} />;
    case 'hexagon':
      return <polygon points={`${w * 0.25}, 0 ${w * 0.75}, 0 ${w},${h / 2} ${w * 0.75},${h} ${w * 0.25},${h} 0, ${h / 2} `} {...props} />;
    case 'pentagon':
      return <polygon points={`${w / 2}, 0 ${w},${h * 0.4} ${w * 0.8},${h} ${w * 0.2},${h} 0, ${h * 0.4} `} {...props} />;
    case 'octagon':
      return <polygon points={`${w * 0.3}, 0 ${w * 0.7}, 0 ${w},${h * 0.3} ${w},${h * 0.7} ${w * 0.7},${h} ${w * 0.3},${h} 0, ${h * 0.7} 0, ${h * 0.3} `} {...props} />;
    case 'parallelogram':
      return <polygon points={`${w * 0.25}, 0 ${w}, 0 ${w * 0.75},${h} 0, ${h} `} {...props} />;
    case 'step':
      return <path d={`M 0, 0 L ${w * 0.75}, 0 L ${w},${h / 2} L ${w},${h} L 0, ${h} Z`} {...props} />;
    case 'tape':
      return <path d={`M 0, ${h * 0.2} C ${w * 0.25}, 0 ${w * 0.75}, 0 ${w},${h * 0.2} L ${w},${h * 0.8} C ${w * 0.75},${h} ${w * 0.25},${h} 0, ${h * 0.8} Z`} {...props} />;
    case 'cylinder':
    case 'storage':
      const rx = w / 2;
      const ry = Math.min(h * 0.15, 20);
      return (
        <g {...props}>
          <path d={`M 0, ${ry} L 0, ${h - ry} A ${rx},${ry} 0 1 0 ${w},${h - ry} L ${w},${ry} `} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />
          <ellipse cx={w / 2} cy={ry} rx={rx} ry={ry} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />
          <path d={`M 0, ${h - ry} A ${rx},${ry} 0 0 0 ${w},${h - ry} `} stroke={props.stroke} fill="none" strokeWidth={props.strokeWidth} />
        </g>
      );
    case 'cloud':
      return <path d={`M ${w * 0.25},${h} A ${w * 0.25},${h * 0.3} 0 0 1 ${w * 0.25},${h * 0.4} A ${w * 0.35},${h * 0.4} 0 0 1 ${w * 0.7},${h * 0.2} A ${w * 0.3},${h * 0.35} 0 0 1 ${w},${h * 0.6} A ${w * 0.2},${h * 0.4} 0 0 1 ${w * 0.75},${h} Z`} {...props} />;
    case 'document':
      return <path d={`M 0, 0 L ${w * 0.75}, 0 L ${w},${h * 0.25} L ${w},${h} L 0, ${h} Z`} {...props} />;
    case 'folder':
      return <path d={`M 0, ${h * 0.1} L ${w * 0.4},${h * 0.1} L ${w * 0.5},${h * 0.25} L ${w},${h * 0.25} L ${w},${h} L 0, ${h} Z`} {...props} />;
    case 'component':
      return (
        <g {...props}>
          <rect width={w} height={h} rx={12} ry={12} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />
          <rect x={w - w * 0.35} y={h * 0.2} width={w * 0.2} height={h * 0.15} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth / 2} />
          <rect x={w - w * 0.35} y={h * 0.4} width={w * 0.2} height={h * 0.15} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth / 2} />
        </g>
      );
    case 'queue':
      return (
        <g {...props} strokeWidth={props.strokeWidth} stroke={props.stroke}>
          <rect width={w} height={h} rx={h / 2} ry={h / 2} fill={props.fill} />
          <path d={`M ${w * 0.2},${h / 2} L ${w * 0.8},${h / 2} `} fill="none" />
          <path d={`M ${w * 0.6},${h * 0.3} L ${w * 0.8},${h / 2} L ${w * 0.6},${h * 0.7} `} fill="none" />
        </g>
      );
    case 'actor':
      return (
        <g stroke={props.stroke} fill="none" strokeWidth={props.strokeWidth}>
          <circle cx={w / 2} cy={h * 0.3} r={Math.min(w, h) * 0.15} />
          <path d={`M ${w / 2},${h * 0.45} L ${w / 2},${h * 0.75} `} />
          <path d={`M ${w * 0.2},${h} L ${w / 2},${h * 0.75} L ${w * 0.8},${h} `} />
          <path d={`M ${w * 0.1},${h * 0.55} L ${w * 0.9},${h * 0.55} `} />
        </g>
      );
    case 'rectangle':
    default:
      return <rect rx={12} ry={12} {...props} />;
  }
};


// ====================================================================================
// --- Draggable Container Component ---
// ====================================================================================

interface DraggableProps {
  data: DiagramData;
  onDataChange: (data: DiagramData, fromHistory?: boolean) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  interactionMode: InteractionMode;
}

interface DiagramContainerProps extends DraggableProps {
  container: Container;
  isSelected: boolean;
  onContextMenu: (e: React.MouseEvent, item: Container) => void;
  fillColor: string;
  isEditable: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
}

const DiagramContainer = memo<DiagramContainerProps>((props) => {
  const { container, onContextMenu, fillColor, interactionMode, isEditable, onSelect } = props;
  const ref = useRef<SVGGElement>(null);
  const dataRef = useRef(props.data);
  dataRef.current = props.data;

  useEffect(() => {
    if (!ref.current || !isEditable) return;
    const selection = select(ref.current);
    let currentData: DiagramData;

    const dragBehavior = drag<SVGGElement, unknown>()
      .filter(event => {
        const isHandle = (event.target as SVGElement)?.dataset?.handle === 'true';
        return !isHandle && (interactionMode === 'select' || interactionMode === 'pan') && !event.button;
      })
      .on('start', (event) => {
        if (event.sourceEvent.shiftKey) {
          props.setSelectedIds(prev => prev.includes(container.id) ? prev.filter(sid => sid !== container.id) : [...prev, container.id]);
        } else {
          if (!props.selectedIds.includes(container.id)) {
            props.setSelectedIds([container.id]);
          }
        }
        currentData = dataRef.current;
        selection.raise();
      })
      .on('drag', (event) => {
        const { dx, dy } = event;
        const { selectedIds, container } = props;

        const containerIdsToMove = new Set(selectedIds.filter(id => currentData.containers?.some(c => c.id === id)));
        if (!containerIdsToMove.has(container.id)) {
          containerIdsToMove.add(container.id);
        }

        const childNodeIdsToMove = new Set<string>();
        currentData.containers?.forEach(c => {
          if (containerIdsToMove.has(c.id)) {
            (c.childNodeIds || []).forEach(childId => childNodeIdsToMove.add(childId));
          }
        });

        const newContainers = currentData.containers?.map(c => {
          if (containerIdsToMove.has(c.id)) {
            return { ...c, x: c.x + dx, y: c.y + dy };
          }
          return c;
        });

        const newNodes = currentData.nodes.map(n => {
          if (childNodeIdsToMove.has(n.id)) {
            return { ...n, x: n.x + dx, y: n.y + dy };
          }
          return n;
        });

        currentData = { ...currentData, nodes: newNodes, containers: newContainers };
        props.onDataChange(currentData, true);
      })
      .on('end', () => {
        if (currentData) {
          props.onDataChange(currentData, false);
        }
      });
    selection.call(dragBehavior);
    return () => { selection.on('.drag', null); }
  }, [props.onDataChange, props.selectedIds, isEditable, interactionMode, container.id, props.setSelectedIds]);

  const handleResize = (dx: number, dy: number, handle: 'br' | 'bl' | 'tr' | 'tl') => {
    const { onDataChange, container } = props;
    const currentData = dataRef.current;
    const minSize = 100;
    const newContainers = currentData.containers?.map(c => {
      if (c.id === container.id) {
        let { x, y, width, height } = c;
        if (handle.includes('r')) width = Math.max(minSize, width + dx);
        if (handle.includes('l')) {
          const newWidth = Math.max(minSize, width - dx);
          x += width - newWidth; width = newWidth;
        }
        if (handle.includes('b')) height = Math.max(minSize, height + dy);
        if (handle.includes('t')) {
          const newHeight = Math.max(minSize, height - dy);
          y += height - newHeight; height = newHeight;
        }
        return { ...c, x, y, width, height };
      }
      return c;
    });
    const newData = { ...currentData, containers: newContainers };
    onDataChange(newData, true);
    dataRef.current = newData;
  };

  const ResizeHandle: React.FC<{ handle: 'br' | 'bl' | 'tr' | 'tl' }> = ({ handle }) => {
    const handleRef = useRef<SVGRectElement>(null);
    useEffect(() => {
      if (!handleRef.current) return;
      const selection = select(handleRef.current);
      const dragBehavior = drag<SVGRectElement, unknown>()
        .on('start', (e) => { e.sourceEvent.preventDefault(); e.sourceEvent.stopPropagation(); dataRef.current = props.data; })
        .on('drag', (event) => handleResize(event.dx, event.dy, handle))
        .on('end', () => props.onDataChange(dataRef.current, false));
      selection.call(dragBehavior);
      return () => { selection.on('.drag', null); };
    }, [handle]);

    const getCoords = () => {
      const size = 14; // Increased size for better usability
      let x = container.x - size / 2;
      let y = container.y - size / 2;
      if (handle.includes('r')) x += container.width;
      if (handle.includes('b')) y += container.height;
      return { x, y };
    };

    const getCursor = () => {
      if (handle === 'tl' || handle === 'br') return 'nwse-resize';
      if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
      return 'default';
    }

    return <rect ref={handleRef} data-handle="true" {...getCoords()} width={14} height={14} fill="var(--color-accent-text)" stroke="var(--color-node-bg)" strokeWidth={2} cursor={getCursor()} className="hover:brightness-125 transition-all duration-150" rx={2} ry={2} />;
  };

  // Use border style from container properties if available
  const getStrokeDasharray = () => {
    // Use custom border style if specified
    if (container.borderStyle === 'dotted') return '2 2';
    if (container.borderStyle === 'dashed') return '6 4';
    if (container.borderStyle === 'double') return '6 2 6';

    // Professional styling based on container type
    switch (container.type) {
      case 'region':
        return 'none'; // Solid for regions (outermost boundary)
      case 'vpc':
        return 'none'; // Solid for VPCs (network boundary)
      case 'availability-zone':
        return '8 4'; // Dashed for AZs (logical zone)
      case 'subnet':
        return '4 3'; // Different dash for subnets
      case 'security-group':
      case 'group':
        return '3 3'; // Dotted for security groups
      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'tier':
      default:
        return 'none'; // Solid border for basic shapes
    }
  };

  // Get border width based on container type for visual hierarchy
  const getBorderWidth = () => {
    if (container.borderWidth === 'thin') return 1;
    if (container.borderWidth === 'thick') return 3;

    // Type-based border width for hierarchy
    switch (container.type) {
      case 'region':
        return 2.5; // Thicker for outermost
      case 'vpc':
        return 2;
      case 'tier':
        return 1.5;
      case 'availability-zone':
      case 'subnet':
      case 'security-group':
      case 'group':
        return 1;
      default:
        return 1.5;
    }
  };

  // Professional color palette for container types
  const getContainerTypeStyle = () => {
    switch (container.type) {
      case 'region':
        return {
          borderColor: '#1e3a5f',
          backgroundColor: 'rgba(30, 58, 95, 0.04)',
          shadow: 'drop-shadow(0 4px 12px rgba(30, 58, 95, 0.15))'
        };
      case 'vpc':
        return {
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.05)',
          shadow: 'drop-shadow(0 3px 8px rgba(67, 97, 238, 0.12))'
        };
      case 'availability-zone':
      case 'triangle':
        return {
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.03)',
          shadow: 'none'
        };
      case 'subnet':
      case 'circle':
        return {
          borderColor: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.02)',
          shadow: 'none'
        };
      case 'security-group':
      case 'group':
      case 'rectangle':
        return {
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.04)',
          shadow: 'none'
        };
      case 'tier':
      default:
        return {
          borderColor: container.borderColor || '#3f3f46',
          backgroundColor: fillColor || 'rgba(63, 63, 70, 0.03)',
          shadow: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08))'
        };
    }
  };

  const typeStyle = getContainerTypeStyle();

  // Get border color based on container properties
  const getBorderColor = () => {
    if (container.borderColor) return container.borderColor;
    if (props.isSelected) return "var(--color-accent-text)";
    return typeStyle.borderColor;
  };

  // Enhanced visual feedback with type-based shadows
  const getVisualFeedback = () => {
    const baseStyle: React.CSSProperties = {
      filter: props.isSelected
        ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))'
        : typeStyle.shadow,
      transition: 'all 0.2s ease',
    };

    if (props.isSelected) {
      return {
        ...baseStyle,
        strokeWidth: getBorderWidth() + 1.5,
      };
    }

    return baseStyle;
  };

  // Get fill color - use type style if no custom color
  const getContainerFill = () => {
    if (container.color) return container.color;
    return typeStyle.backgroundColor;
  };

  return (
    <g
      ref={ref}
      onClick={(e) => onSelect(e, container.id)}
      onContextMenu={(e) => onContextMenu(e, container)}
      style={{ cursor: isEditable ? 'move' : 'default', pointerEvents: 'all' }}
      className={props.isSelected ? 'selected-container' : ''}
    >
      {(container.type === 'circle') ? (
        <ellipse
          cx={container.x + container.width / 2}
          cy={container.y + container.height / 2}
          rx={container.width / 2}
          ry={container.height / 2}
          fill={getContainerFill()}
          stroke={getBorderColor()}
          strokeWidth={getBorderWidth()}
          strokeDasharray={getStrokeDasharray()}
          className={props.isSelected ? 'selected-element' : ''}
          style={getVisualFeedback()}
        />
      ) : (container.type === 'triangle') ? (
        <polygon
          points={`${container.x + container.width / 2},${container.y} ${container.x + container.width},${container.y + container.height} ${container.x},${container.y + container.height}`}
          fill={getContainerFill()}
          stroke={getBorderColor()}
          strokeWidth={getBorderWidth()}
          strokeDasharray={getStrokeDasharray()}
          className={props.isSelected ? 'selected-element' : ''}
          style={getVisualFeedback()}
        />
      ) : (
        <rect
          x={container.x}
          y={container.y}
          width={container.width}
          height={container.height}
          rx={container.type === 'rectangle' ? 4 : 16}
          ry={container.type === 'rectangle' ? 4 : 16}
          fill={getContainerFill()}
          stroke={getBorderColor()}
          strokeWidth={getBorderWidth()}
          strokeDasharray={getStrokeDasharray()}
          className={props.isSelected ? 'selected-element' : ''}
          style={getVisualFeedback()}
        />
      )}
      <foreignObject x={container.x + 12} y={container.y + 8} width={container.width - 24} height={36} style={{ pointerEvents: 'none' }}>
        <div className="font-semibold text-[var(--color-text-secondary)] truncate px-1" title={container.label}>
          {container.label}
        </div>
      </foreignObject>
      {/* Interactive label area for selection - but allow dragging on main container */}
      <rect
        x={container.x + 8}
        y={container.y + 8}
        width={container.width - 16}
        height={36}
        fill="transparent"
        stroke="transparent"
        strokeWidth={0}
        className="cursor-pointer"
        onClick={(e) => onSelect(e, container.id)}
        style={{ pointerEvents: 'all' }}
      />
      {props.isSelected && isEditable && interactionMode === 'select' && (
        <>
          <ResizeHandle handle="tl" />
          <ResizeHandle handle="tr" />
          <ResizeHandle handle="bl" />
          <ResizeHandle handle="br" />
        </>
      )}
    </g>
  );
});

// ====================================================================================
// --- Draggable Node Component ---
// ====================================================================================

const DiagramNode = memo<{
  node: ArchNode;
  isSelected: boolean;
  onContextMenu: (e: React.MouseEvent, item: ArchNode) => void;
  isEditable: boolean;
  resizingNodeId: string | null;
  onNodeDoubleClick?: (nodeId: string) => void;
  onLinkStart: (sourceNodeId: string, startPos: { x: number, y: number }) => void;
  isLinkHoverTarget: boolean;
  onSelect: (e: React.MouseEvent, id: string) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
} & DraggableProps>((props) => {
  const { node, isSelected, onContextMenu, interactionMode, isEditable, resizingNodeId, onNodeDoubleClick, onLinkStart, isLinkHoverTarget, onSelect, isDragging, setIsDragging } = props;
  const ref = useRef<SVGGElement>(null);
  const dataRef = useRef(props.data);
  const [isHovered, setIsHovered] = useState(false);
  dataRef.current = props.data;

  // Enhanced connection handle positions - up to 3 ports per side with dynamic spacing
  const getConnectionHandles = useMemo(() => {
    const getNodeConnections = (side: HandleType) => {
      // Count connections on this side
      const connections = dataRef.current.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return sourceId === node.id || targetId === node.id;
      });

      const sideConnections = connections.filter(link => {
        const sourceNode = dataRef.current.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
        const targetNode = dataRef.current.nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id));

        if (!sourceNode || !targetNode) return false;

        // Determine which side this connection uses based on node positions
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const isSource = (typeof link.source === 'string' ? link.source : link.source.id) === node.id;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal connection
          if (isSource) {
            return (dx > 0 && side === 'right') || (dx < 0 && side === 'left');
          } else {
            return (dx > 0 && side === 'left') || (dx < 0 && side === 'right');
          }
        } else {
          // Vertical connection
          if (isSource) {
            return (dy > 0 && side === 'bottom') || (dy < 0 && side === 'top');
          } else {
            return (dy > 0 && side === 'top') || (dy < 0 && side === 'bottom');
          }
        }
      });

      // Create up to 3 evenly spaced positions per side
      const positions = [];
      const count = Math.min(3, Math.max(1, sideConnections.length));

      for (let i = 0; i < count; i++) {
        let x, y;
        const spacing = 20; // Distance between connection points
        const offset = (i - (count - 1) / 2) * spacing;

        switch (side) {
          case 'top':
            x = node.x + offset;
            y = node.y - node.height / 2;
            break;
          case 'right':
            x = node.x + node.width / 2;
            y = node.y + offset;
            break;
          case 'bottom':
            x = node.x + offset;
            y = node.y + node.height / 2;
            break;
          case 'left':
            x = node.x - node.width / 2;
            y = node.y + offset;
            break;
        }

        positions.push({ x, y, index: i });
      }

      return positions;
    };

    return {
      top: getNodeConnections('top'),
      right: getNodeConnections('right'),
      bottom: getNodeConnections('bottom'),
      left: getNodeConnections('left')
    };
  }, [node.x, node.y, node.width, node.height]);

  useEffect(() => {
    if (!ref.current || !isEditable) return;
    const selection = select(ref.current);
    let currentData: DiagramData;

    // node drag behavior (ignores connection handles)
    const dragBehavior = drag<SVGGElement, unknown>()
      .filter(event => {
        const target = event.target as SVGElement;
        if (target.classList.contains('connection-handle')) {
          return false;
        }
        return (interactionMode === 'select' || interactionMode === 'pan') && !event.button;
      })
      .on('start', (_event) => {
        setIsDragging(true);
        currentData = dataRef.current;
        selection.raise();
      })
      .on('drag', (event) => {
        const { dx, dy } = event;
        const { selectedIds, node } = props;

        const idsToMove = new Set(selectedIds);
        if (!idsToMove.has(node.id)) {
          idsToMove.add(node.id);
        }

        const newNodes = currentData.nodes.map(n => {
          if (idsToMove.has(n.id) && !n.locked) {
            return { ...n, x: n.x + dx, y: n.y + dy };
          }
          return n;
        });
        currentData = { ...currentData, nodes: newNodes };
        props.onDataChange(currentData, true);
      })
      .on('end', () => {
        setIsDragging(false);
        if (currentData) {
          props.onDataChange(currentData, false);
        }
      });

    selection.call(dragBehavior);
    return () => { selection.on('.drag', null); };
  }, [props.onDataChange, props.selectedIds, isEditable, interactionMode, node.id, props.setSelectedIds, setIsDragging]);

  const handleResize = (dx: number, dy: number, handle: 'br' | 'bl' | 'tr' | 'tl') => {
    const { onDataChange } = props;
    const currentData = dataRef.current;
    const minSize = 40;
    const newNodes = currentData.nodes.map(n => {
      if (n.id === node.id) {
        const newWidth = Math.max(minSize, handle.includes('r') ? n.width + dx : n.width - dx);
        const newHeight = Math.max(minSize, handle.includes('b') ? n.height + dy : n.height - dy);
        const newX = n.x + (handle.includes('r') ? dx / 2 : -dx / 2);
        const newY = n.y + (handle.includes('b') ? dy / 2 : -dy / 2);
        return { ...n, width: newWidth, height: newHeight, x: newX, y: newY };
      }
      return n;
    });
    const newData = { ...currentData, nodes: newNodes };
    onDataChange(newData, true);
    dataRef.current = newData;
  };

  const ResizeHandle: React.FC<{ handle: 'br' | 'bl' | 'tr' | 'tl' }> = ({ handle }) => {
    const handleRef = useRef<SVGRectElement>(null);
    useEffect(() => {
      if (!handleRef.current) return;
      const selection = select(handleRef.current);
      const dragBehavior = drag<SVGRectElement, unknown>()
        .on('start', (e) => { e.sourceEvent.preventDefault(); e.sourceEvent.stopPropagation(); dataRef.current = props.data; })
        .on('drag', (event) => handleResize(event.dx, event.dy, handle))
        .on('end', () => props.onDataChange(dataRef.current, false));
      selection.call(dragBehavior);
      return () => { selection.on('.drag', null); };
    }, []);

    const getCoords = () => {
      const size = 8;
      let x = node.x - node.width / 2 - size / 2;
      let y = node.y - node.height / 2 - size / 2;
      if (handle.includes('r')) x += node.width;
      if (handle.includes('b')) y += node.height;
      return { x, y };
    };

    return <rect ref={handleRef} {...getCoords()} width={8} height={8} fill="var(--color-accent-text)" stroke="var(--color-node-bg)" strokeWidth={2} cursor={`${handle.includes('b') ? 's' : 'n'}${handle.includes('r') ? 'e' : 'w'} -resize`} />;
  };

  const isResizing = resizingNodeId === node.id;
  const isCustomIcon = !!node.customIcon;

  const commonProps = {
    fill: node.color || "var(--color-node-bg)",
    fillOpacity: (node.shapeOpacity ?? 100) / 100, // Apply shape opacity (0-100 -> 0-1)
    stroke: node.borderColor || (isLinkHoverTarget ? "var(--color-accent-text)" : (isSelected ? "var(--color-accent-text)" : "var(--color-border)")),
    strokeOpacity: (node.shapeOpacity ?? 100) / 100, // Also apply to stroke/border
    strokeWidth: node.borderWidth === 'thin' ? 1 : (node.borderWidth === 'thick' ? 3 : (isLinkHoverTarget ? 3 : (isSelected ? 2.5 : 1.5))),
    strokeDasharray: node.borderStyle === 'dotted' ? '2 2' : (node.borderStyle === 'dashed' ? '6 4' : (node.borderStyle === 'double' ? '6 2 6' : 'none')),
  };

  const nodeBody = <ShapeRenderer node={node} commonProps={commonProps} />;


  return (
    <g
      ref={ref}
      data-node-id={node.id}
      onClick={(e) => onSelect(e, node.id)}
      onDoubleClick={() => onNodeDoubleClick?.(node.id)}
      onContextMenu={(e) => onContextMenu(e, node)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: isEditable && (interactionMode === 'select' || interactionMode === 'pan') ? 'move' : 'default' }}
      className={`diagram-node node-id-${node.id}`}
    >
      {node.description && <title>{node.description}</title>}
      <motion.g
        animate={{ x: node.x - node.width / 2, y: node.y - node.height / 2 }}
        transition={isDragging ? { type: false } : { type: 'spring', stiffness: 500, damping: 30 }}
        style={{ filter: 'url(#drop-shadow)', transition: 'stroke 0.2s ease-in-out' }}
      >
        {nodeBody}

        {isCustomIcon ? (
          (() => {
            const iconSizePercent = node.customIconSize || 60;
            const labelHeight = node.label ? 24 : 8;
            const availableWidth = node.width - 16;
            const availableHeight = node.height - 8 - labelHeight;
            const baseSize = Math.min(availableWidth, availableHeight);
            const iconSize = (baseSize * iconSizePercent) / 100;

            const iconX = (node.width - iconSize) / 2;
            const iconY = (availableHeight - iconSize) / 2 + 8;

            return (
              <>
                <image
                  href={node.customIcon!}
                  x={iconX}
                  y={iconY}
                  width={iconSize}
                  height={iconSize}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                />
                {node.label && (
                  <text
                    x={node.width / 2}
                    y={node.height - 4}
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="12px"
                    fontWeight="500"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label}
                  </text>
                )}
              </>
            );
          })()
        ) : (
          <g>
            {/* Center icon and text manually */}
            {node.type !== 'layer-label' && node.type !== 'group-label' && (
              <foreignObject x={8} y={8} width={node.width - 16} height={node.height - 30} style={{ pointerEvents: 'none' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <ArchitectureIcon type={node.type} className="w-8 h-8" />
                </div>
              </foreignObject>
            )}
            <text
              x={node.width / 2}
              y={node.height - 15}
              textAnchor="middle"
              fill="var(--color-text-primary)"
              fontSize="13px"
              fontWeight="500"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {node.label}
            </text>
          </g>
        )}
      </motion.g>
      {isResizing && isSelected && ['tl', 'tr', 'bl', 'br'].map(h => <ResizeHandle key={h} handle={h as 'br' | 'bl' | 'tr' | 'tl'} />)}

      {/* Connection Handles - Enhanced with multiple ports per side */}
      {(isSelected || isHovered) && isEditable && Object.entries(getConnectionHandles).map(([side, positions]) => (
        (positions as Array<{ x: number, y: number, index: number }>).map((pos, index) => (
          <g key={`${side} -${index} `}>
            <circle
              className="connection-handle"
              data-handle={`${side} -${index} `}
              cx={pos.x}
              cy={pos.y}
              r={8}
              fill="transparent"
              strokeWidth={10}
              stroke="transparent"
              cursor="crosshair"
              onPointerDown={(e) => {
                e.stopPropagation();
                onLinkStart(node.id, { x: pos.x, y: pos.y });
              }}
            />
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={4}
              fill="var(--color-accent-text)"
              stroke="var(--color-node-bg)"
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            />
          </g>
        ))
      ))}
    </g>
  );
});

export default DiagramCanvas;