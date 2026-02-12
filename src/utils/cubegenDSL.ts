/**
 * CubeGen DSL Parser
 * Parses declarative code syntax into DiagramData for DiagramCanvas
 * 
 * Syntax:
 *   node <id>: "<label>" icon=<IconType> x=<number> y=<number>
 *   <source> -> <target>: "<label>"
 *   <source> <-> <target>: "<label>"
 *   container <id>: "<label>" type=<type> x=<number> y=<number> width=<number> height=<number> { ... }
 */

import { DiagramData, ArchNode, Link, Container, IconType } from '../types';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdef', 10);

// Default node dimensions
const DEFAULT_NODE_WIDTH = 120;
const DEFAULT_NODE_HEIGHT = 100;

// Icon type mapping (lowercase to IconType enum)
const ICON_MAP: Record<string, IconType> = {};
Object.entries(IconType).forEach(([key, value]) => {
    ICON_MAP[key.toLowerCase()] = value as IconType;
    ICON_MAP[value.toLowerCase()] = value as IconType;
});

export interface ParseResult {
    success: boolean;
    data?: DiagramData;
    errors: ParseError[];
}

export interface ParseError {
    line: number;
    message: string;
    code: string;
}

interface ParsedNode {
    id: string;
    label: string;
    icon: IconType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    containerId?: string;
}

interface ParsedConnection {
    sourceId: string;
    targetId: string;
    label?: string;
    bidirectional: boolean;
}

interface ParsedContainer {
    id: string;
    label: string;
    type: Container['type'];
    x: number;
    y: number;
    width: number;
    height: number;
    childNodeIds: string[];
}

/**
 * Main parser function
 */
export function parseCubeGenDSL(code: string): ParseResult {
    const errors: ParseError[] = [];
    const nodes: ParsedNode[] = [];
    const connections: ParsedConnection[] = [];
    const containers: ParsedContainer[] = [];

    const lines = code.split('\n');
    let currentContainer: ParsedContainer | null = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('//')) continue;

        // Track brace depth for containers
        if (line.includes('{')) braceDepth++;
        if (line.includes('}')) {
            braceDepth--;
            if (braceDepth === 0 && currentContainer) {
                containers.push(currentContainer);
                currentContainer = null;
            }
            continue;
        }

        // Parse container declaration
        if (line.startsWith('container ')) {
            const containerResult = parseContainer(line, lineNum);
            if (containerResult.error) {
                errors.push(containerResult.error);
            } else if (containerResult.container) {
                currentContainer = containerResult.container;
            }
            continue;
        }

        // Parse node declaration
        if (line.startsWith('node ')) {
            const nodeResult = parseNode(line, lineNum);
            if (nodeResult.error) {
                errors.push(nodeResult.error);
            } else if (nodeResult.node) {
                const node = nodeResult.node;
                if (currentContainer) {
                    node.containerId = currentContainer.id;
                    currentContainer.childNodeIds.push(node.id);
                }
                nodes.push(node);
            }
            continue;
        }

        // Parse connection (-> or <->)
        if (line.includes('->')) {
            const connResult = parseConnection(line, lineNum);
            if (connResult.error) {
                errors.push(connResult.error);
            } else if (connResult.connection) {
                connections.push(connResult.connection);
            }
            continue;
        }

        // Unknown syntax
        if (line && !line.startsWith('}')) {
            errors.push({
                line: lineNum,
                message: `Unknown syntax: "${line.substring(0, 30)}..."`,
                code: line
            });
        }
    }

    // Build DiagramData
    if (errors.length === 0) {
        const diagramNodes: ArchNode[] = nodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.icon,
            x: n.x,
            y: n.y,
            width: n.width || DEFAULT_NODE_WIDTH,
            height: n.height || DEFAULT_NODE_HEIGHT,
        }));

        const diagramLinks: Link[] = connections.map(c => ({
            id: `link-${nanoid()}`,
            source: c.sourceId,
            target: c.targetId,
            label: c.label,
            bidirectional: c.bidirectional,
        }));

        const diagramContainers: Container[] = containers.map(c => ({
            id: c.id,
            label: c.label,
            type: c.type,
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height,
            childNodeIds: c.childNodeIds,
        }));

        return {
            success: true,
            data: {
                title: 'CubeGen Diagram',
                architectureType: 'code-to-diagram',
                nodes: diagramNodes,
                links: diagramLinks,
                containers: diagramContainers.length > 0 ? diagramContainers : undefined,
            },
            errors: [],
        };
    }

    return { success: false, errors };
}

/**
 * Parse a node line
 * Format: node <id>: "<label>" icon=<IconType> x=<number> y=<number>
 */
function parseNode(line: string, lineNum: number): { node?: ParsedNode; error?: ParseError } {
    // Regex: node id: "label" icon=Type x=100 y=200 [width=120] [height=100]
    const regex = /^node\s+(\w+):\s*"([^"]+)"\s+icon=(\w+)\s+x=(\d+)\s+y=(\d+)(?:\s+width=(\d+))?(?:\s+height=(\d+))?/;
    const match = line.match(regex);

    if (!match) {
        return {
            error: {
                line: lineNum,
                message: 'Invalid node syntax. Expected: node <id>: "<label>" icon=<IconType> x=<number> y=<number>',
                code: line
            }
        };
    }

    const [, id, label, iconName, xStr, yStr, widthStr, heightStr] = match;

    // Resolve icon type
    const icon = ICON_MAP[iconName.toLowerCase()];
    if (!icon) {
        return {
            error: {
                line: lineNum,
                message: `Unknown icon type: "${iconName}". Check available icons in documentation.`,
                code: line
            }
        };
    }

    return {
        node: {
            id,
            label,
            icon,
            x: parseInt(xStr, 10),
            y: parseInt(yStr, 10),
            width: widthStr ? parseInt(widthStr, 10) : undefined,
            height: heightStr ? parseInt(heightStr, 10) : undefined,
        }
    };
}

/**
 * Parse a connection line
 * Format: source -> target: "label"  OR  source <-> target: "label"
 */
function parseConnection(line: string, lineNum: number): { connection?: ParsedConnection; error?: ParseError } {
    // Regex for bidirectional: source <-> target: "label"
    const biRegex = /^(\w+)\s*<->\s*(\w+)(?::\s*"([^"]*)")?/;
    // Regex for unidirectional: source -> target: "label"
    const uniRegex = /^(\w+)\s*->\s*(\w+)(?::\s*"([^"]*)")?/;

    let match = line.match(biRegex);
    let bidirectional = true;

    if (!match) {
        match = line.match(uniRegex);
        bidirectional = false;
    }

    if (!match) {
        return {
            error: {
                line: lineNum,
                message: 'Invalid connection syntax. Expected: source -> target: "label" or source <-> target: "label"',
                code: line
            }
        };
    }

    const [, sourceId, targetId, label] = match;

    return {
        connection: {
            sourceId,
            targetId,
            label: label || undefined,
            bidirectional,
        }
    };
}

/**
 * Parse a container line
 * Format: container <id>: "<label>" type=<type> x=<number> y=<number> width=<number> height=<number> {
 */
function parseContainer(line: string, lineNum: number): { container?: ParsedContainer; error?: ParseError } {
    // Regex: container id: "label" type=vpc x=50 y=50 width=600 height=400 {
    const regex = /^container\s+(\w+):\s*"([^"]+)"\s+type=(\w+)\s+x=(\d+)\s+y=(\d+)\s+width=(\d+)\s+height=(\d+)\s*\{?/;
    const match = line.match(regex);

    if (!match) {
        return {
            error: {
                line: lineNum,
                message: 'Invalid container syntax. Expected: container <id>: "<label>" type=<type> x=<n> y=<n> width=<n> height=<n> {',
                code: line
            }
        };
    }

    const [, id, label, typeStr, xStr, yStr, widthStr, heightStr] = match;

    // Validate container type
    const validTypes: Container['type'][] = ['region', 'availability-zone', 'tier', 'vpc', 'subnet', 'security-group', 'group'];
    const containerType = typeStr.toLowerCase() as Container['type'];

    if (!validTypes.includes(containerType)) {
        return {
            error: {
                line: lineNum,
                message: `Invalid container type: "${typeStr}". Valid types: ${validTypes.join(', ')}`,
                code: line
            }
        };
    }

    return {
        container: {
            id,
            label,
            type: containerType,
            x: parseInt(xStr, 10),
            y: parseInt(yStr, 10),
            width: parseInt(widthStr, 10),
            height: parseInt(heightStr, 10),
            childNodeIds: [],
        }
    };
}

/**
 * Get list of available icon names for documentation/autocomplete
 */
export function getAvailableIcons(): string[] {
    return Object.keys(IconType);
}

/**
 * Get list of available container types
 */
export function getContainerTypes(): string[] {
    return ['region', 'availability-zone', 'tier', 'vpc', 'subnet', 'security-group', 'group'];
}
