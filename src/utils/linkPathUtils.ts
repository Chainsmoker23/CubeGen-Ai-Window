/**
 * Smart Link Path Utilities
 * Advanced algorithms for intelligent arrow/link rendering
 */

import { ArchNode } from '../types';

/**
 * Calculate adaptive curve tension based on distance between nodes
 * Short distance → tighter curves (smaller radius)
 * Long distance → smoother, wider curves (larger radius)
 */
export const calculateAdaptiveCurveTension = (
    sourceNode: ArchNode,
    targetNode: ArchNode,
    _baseCurvature: number = 30
): { cornerRadius: number; curveFactor: number } => {
    // Calculate distance between node centers
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Define distance thresholds
    const SHORT_DISTANCE = 150;  // Nodes are close
    const MEDIUM_DISTANCE = 300; // Normal distance
    const LONG_DISTANCE = 500;   // Nodes are far apart

    // Calculate adaptive curve factor (0.5 to 2.0)
    let curveFactor: number;
    if (distance < SHORT_DISTANCE) {
        // Close nodes: tight curves (smaller radius)
        curveFactor = 0.6 + (distance / SHORT_DISTANCE) * 0.4;
    } else if (distance < MEDIUM_DISTANCE) {
        // Medium distance: normal curves
        curveFactor = 1.0;
    } else if (distance < LONG_DISTANCE) {
        // Far nodes: wider, smoother curves
        const t = (distance - MEDIUM_DISTANCE) / (LONG_DISTANCE - MEDIUM_DISTANCE);
        curveFactor = 1.0 + t * 0.8;
    } else {
        // Very far: maximum smoothness
        curveFactor = 1.8;
    }

    // Calculate corner radius based on distance and curve factor
    const minCornerRadius = 8;
    const maxCornerRadius = 30;

    // Base radius scales with distance
    const baseRadius = Math.min(
        maxCornerRadius,
        Math.max(minCornerRadius, distance * 0.04)
    );

    // Apply curve factor
    const cornerRadius = Math.round(baseRadius * curveFactor);

    return {
        cornerRadius: Math.min(maxCornerRadius, Math.max(minCornerRadius, cornerRadius)),
        curveFactor
    };
};

/**
 * Calculate smart curvature percentage based on node positions
 * Adjusts curvature to avoid overlapping paths
 */
export const calculateSmartCurvature = (
    sourceNode: ArchNode,
    targetNode: ArchNode,
    linkIndex: number = 0,
    totalLinks: number = 1
): number => {
    const dx = Math.abs(targetNode.x - sourceNode.x);
    const dy = Math.abs(targetNode.y - sourceNode.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Base curvature
    let curvature = 30;

    // Adjust based on aspect ratio of the connection
    const aspectRatio = dx / (dy + 1); // Avoid division by zero

    if (aspectRatio > 2) {
        // Primarily horizontal: less curvature needed
        curvature = 20;
    } else if (aspectRatio < 0.5) {
        // Primarily vertical: less curvature needed
        curvature = 20;
    } else {
        // Diagonal: more curvature for smooth turns
        curvature = 35;
    }

    // Increase curvature for short distances to prevent sharp turns
    if (distance < 150) {
        curvature += 15;
    }

    // Adjust for multiple links between same nodes
    if (totalLinks > 1) {
        curvature += linkIndex * 10;
    }

    return Math.min(80, Math.max(15, curvature));
};

/**
 * Generate CSS class for animated flow based on link properties
 */
export const getAnimatedFlowClass = (
    isAnimated: boolean,
    isSelected: boolean
): string => {
    if (!isAnimated) return '';

    // Only animate when selected (not distracting)
    if (isSelected) {
        return 'link-flow-animated';
    }

    // Subtle animation even when not selected
    return 'link-flow-animated-subtle';
};

/**
 * Calculate animation duration based on path length
 * Longer paths = slower animation for consistent visual speed
 */
export const calculateFlowAnimationDuration = (pathLength: number): number => {
    const baseSpeed = 50; // pixels per second
    const duration = pathLength / baseSpeed;
    return Math.max(1, Math.min(5, duration)); // Between 1-5 seconds
};
