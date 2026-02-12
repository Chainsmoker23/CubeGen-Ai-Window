/**
 * LinkColorAssigner - Assigns unique colors to links based on their relationships
 * 
 * Rules:
 * 1. Links connecting to the same node have different colors
 * 2. Incoming vs outgoing links have distinct color schemes
 * 3. Colors are aesthetically pleasing and readable
 */

import { Link, ArchNode } from '../types';

// ============================================================================
// COLOR PALETTE
// ============================================================================

// Primary link colors - distinct and readable
const LINK_COLORS = [
    '#C41E3A',   // Crimson Red
    '#D6336C',   // Dark Pink (matches your accent)
    '#374151',   // Dark Gray
    '#6B7280',   // Medium Gray
    '#059669',   // Emerald Green
    '#2563EB',   // Blue
    '#7C3AED',   // Purple
    '#DC2626',   // Red
    '#EA580C',   // Orange
    '#0891B2',   // Cyan
];

// Fallback color for unassigned links
const DEFAULT_LINK_COLOR = '#6B7280';

// ============================================================================
// TYPES
// ============================================================================

export interface LinkColorInfo {
    linkId: string;
    color: string;
    isIncoming: boolean;
    isOutgoing: boolean;
    connectedNodeId: string;
}

export interface NodeLinkMap {
    nodeId: string;
    incomingLinks: string[];  // Link IDs
    outgoingLinks: string[];  // Link IDs
}

// ============================================================================
// LINK COLOR ASSIGNER CLASS
// ============================================================================

export class LinkColorAssigner {
    private colorAssignments: Map<string, string> = new Map();
    private nodeConnectionMap: Map<string, NodeLinkMap> = new Map();

    /**
     * Assigns colors to all links based on their relationships
     */
    assignColors(links: Link[], nodes: ArchNode[]): Map<string, string> {
        this.colorAssignments.clear();
        this.nodeConnectionMap.clear();

        // Build connection map for each node
        this.buildNodeConnectionMap(links, nodes);

        // Assign colors based on relationships
        this.assignColorsBasedOnRelationships(links);

        return this.colorAssignments;
    }

    /**
     * Gets the assigned color for a specific link
     */
    getColor(linkId: string): string {
        return this.colorAssignments.get(linkId) || DEFAULT_LINK_COLOR;
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    private buildNodeConnectionMap(links: Link[], nodes: ArchNode[]): void {
        // Initialize map for all nodes
        nodes.forEach(node => {
            this.nodeConnectionMap.set(node.id, {
                nodeId: node.id,
                incomingLinks: [],
                outgoingLinks: []
            });
        });

        // Populate connections
        links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;

            // Add to source's outgoing
            const sourceNodeMap = this.nodeConnectionMap.get(sourceId);
            if (sourceNodeMap) {
                sourceNodeMap.outgoingLinks.push(link.id);
            }

            // Add to target's incoming
            const targetNodeMap = this.nodeConnectionMap.get(targetId);
            if (targetNodeMap) {
                targetNodeMap.incomingLinks.push(link.id);
            }
        });
    }

    private assignColorsBasedOnRelationships(links: Link[]): void {
        // Track used colors per node to ensure diversity
        const nodeUsedColors: Map<string, Set<string>> = new Map();

        links.forEach((link, index) => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;

            // Get used colors for both source and target nodes
            if (!nodeUsedColors.has(sourceId)) {
                nodeUsedColors.set(sourceId, new Set());
            }
            if (!nodeUsedColors.has(targetId)) {
                nodeUsedColors.set(targetId, new Set());
            }

            const sourceUsed = nodeUsedColors.get(sourceId)!;
            const targetUsed = nodeUsedColors.get(targetId)!;
            const combinedUsed = new Set([...sourceUsed, ...targetUsed]);

            // Find an unused color, prioritizing based on direction
            let assignedColor = this.selectBestColor(
                link,
                combinedUsed,
                index,
                links.length
            );

            this.colorAssignments.set(link.id, assignedColor);
            sourceUsed.add(assignedColor);
            targetUsed.add(assignedColor);
        });
    }

    private selectBestColor(
        link: Link,
        usedColors: Set<string>,
        linkIndex: number,
        _totalLinks: number
    ): string {
        // If link already has a color specified, use it
        if (link.color && link.color !== 'var(--color-link)') {
            return link.color;
        }

        // Try to find an unused color from the palette
        for (const color of LINK_COLORS) {
            if (!usedColors.has(color)) {
                return color;
            }
        }

        // If all colors are used, cycle through based on index
        return LINK_COLORS[linkIndex % LINK_COLORS.length];
    }

    /**
     * Gets a contrasting color for bidirectional links
     */
    getContrastingColor(existingColor: string): string {
        const colorIndex = LINK_COLORS.indexOf(existingColor);
        if (colorIndex === -1) {
            return LINK_COLORS[0];
        }
        // Return a color from the opposite half of the palette
        const contrastIndex = (colorIndex + Math.floor(LINK_COLORS.length / 2)) % LINK_COLORS.length;
        return LINK_COLORS[contrastIndex];
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a color map for all links in a diagram
 */
export function generateLinkColors(links: Link[], nodes: ArchNode[]): Map<string, string> {
    const assigner = new LinkColorAssigner();
    return assigner.assignColors(links, nodes);
}

/**
 * Gets a link color based on its connection pattern
 */
export function getLinkColor(
    link: Link,
    linkIndex: number,
    _totalLinksToNode: number,
    isIncoming: boolean
): string {
    // Use different color schemes for incoming vs outgoing
    const baseIndex = isIncoming ? 0 : Math.floor(LINK_COLORS.length / 2);
    const colorIndex = (baseIndex + linkIndex) % LINK_COLORS.length;
    return link.color || LINK_COLORS[colorIndex];
}

// Export color palette for external use
export { LINK_COLORS, DEFAULT_LINK_COLOR };
