/**
 * LayoutDecisionEngine - AI-assisted layout strategy selection
 * 
 * Analyzes user prompts to understand architecture patterns and determine
 * the optimal layout strategy for diagram generation.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ArchitecturePattern =
    | 'microservices'
    | 'rag-llm'
    | 'pipeline'
    | 'layered'
    | 'hub-spoke'
    | 'client-server'
    | 'event-driven'
    | 'data-flow'
    | 'neural-network'
    | 'general';

export type LayoutStrategy =
    | 'tiered'      // Horizontal layers (left-to-right)
    | 'layered'     // Vertical layers (top-to-bottom)
    | 'hub-spoke'   // Central node with radial arrangement
    | 'grid'        // Uniform grid distribution
    | 'clustered'   // Grouped by service/domain
    | 'pipeline'    // Sequential linear flow
    | 'swimlane'    // Swim lane with containers as lanes
    | 'radial';     // Circular arrangement

export interface ComponentInfo {
    id: string;
    name: string;
    type: string;
    category: 'input' | 'processing' | 'output' | 'storage' | 'infrastructure' | 'user' | 'external';
    layer?: number;
    importance: 'critical' | 'important' | 'supporting';
}

export interface RelationshipInfo {
    source: string;
    target: string;
    type: 'data-flow' | 'control-flow' | 'dependency' | 'communication';
    strength: 'strong' | 'medium' | 'weak';
}

export interface ArchitectureAnalysis {
    pattern: ArchitecturePattern;
    confidence: number;
    components: ComponentInfo[];
    relationships: RelationshipInfo[];
    suggestedLayout: LayoutStrategy;
    containerHint: 'horizontal' | 'vertical' | 'none';
    flowDirection: 'left-to-right' | 'top-to-bottom' | 'radial' | 'bidirectional';
    layerCount: number;
    metadata: {
        hasDatabase: boolean;
        hasGateway: boolean;
        hasMessageQueue: boolean;
        hasLoadBalancer: boolean;
        hasUserInterface: boolean;
        hasLLM: boolean;
        hasVectorDB: boolean;
    };
}

export interface LayoutConfig {
    strategy: LayoutStrategy;
    direction: 'horizontal' | 'vertical';
    spacing: {
        nodeHorizontal: number;
        nodeVertical: number;
        containerPadding: number;
        layerGap: number;
    };
    alignment: 'start' | 'center' | 'end' | 'distribute';
    containerBehavior: 'wrap-content' | 'fixed-width' | 'equal-width';
    edgeRouting: 'orthogonal' | 'curved' | 'straight';
}

// ============================================================================
// PATTERN DETECTION KEYWORDS
// ============================================================================

const PATTERN_KEYWORDS: Record<ArchitecturePattern, { keywords: string[]; weight: number }> = {
    'rag-llm': {
        keywords: [
            'rag', 'retrieval', 'augmented', 'generation', 'llm', 'embedding',
            'vector', 'knowledge', 'chatbot', 'ai assistant', 'gemini', 'gpt',
            'claude', 'langchain', 'retrieval-augmented', 'document', 'chunking',
            'semantic search', 'context window', 'prompt'
        ],
        weight: 1.5
    },
    'microservices': {
        keywords: [
            'microservice', 'service', 'api gateway', 'docker', 'kubernetes',
            'container', 'distributed', 'service mesh', 'istio', 'consul',
            'discovery', 'registry', 'circuit breaker', 'saga'
        ],
        weight: 1.3
    },
    'pipeline': {
        keywords: [
            'pipeline', 'etl', 'extract', 'transform', 'load', 'stream',
            'kafka', 'spark', 'flink', 'workflow', 'stage', 'step',
            'batch', 'processing', 'data flow', 'airflow', 'dag'
        ],
        weight: 1.2
    },
    'layered': {
        keywords: [
            'layer', 'tier', '3-tier', 'n-tier', 'presentation', 'business',
            'data access', 'mvc', 'mvvm', 'clean architecture', 'hexagonal',
            'onion', 'domain driven'
        ],
        weight: 1.1
    },
    'hub-spoke': {
        keywords: [
            'hub', 'spoke', 'central', 'gateway', 'proxy', 'router',
            'mediator', 'broker', 'orchestrator', 'coordinator', 'api gateway'
        ],
        weight: 1.2
    },
    'client-server': {
        keywords: [
            'client', 'server', 'frontend', 'backend', 'web app', 'mobile',
            'browser', 'request', 'response', 'rest', 'graphql', 'http'
        ],
        weight: 1.0
    },
    'event-driven': {
        keywords: [
            'event', 'message', 'queue', 'pub/sub', 'subscriber', 'publisher',
            'async', 'kafka', 'rabbitmq', 'sns', 'sqs', 'eventbridge', 'cqrs',
            'event sourcing', 'saga', 'choreography'
        ],
        weight: 1.3
    },
    'data-flow': {
        keywords: [
            'data flow', 'input', 'output', 'process', 'transform', 'store',
            'read', 'write', 'sync', 'replicate'
        ],
        weight: 0.9
    },
    'neural-network': {
        keywords: [
            'neural', 'network', 'layer', 'neuron', 'dense', 'convolutional',
            'lstm', 'transformer', 'attention', 'encoder', 'decoder',
            'training', 'inference', 'weights', 'activation'
        ],
        weight: 1.5
    },
    'general': {
        keywords: [],
        weight: 0.5
    }
};

// ============================================================================
// COMPONENT CATEGORY DETECTION
// ============================================================================

const COMPONENT_CATEGORIES: Record<string, ComponentInfo['category']> = {
    // User/Interface
    'user': 'user',
    'client': 'user',
    'browser': 'user',
    'mobile': 'user',
    'frontend': 'user',
    'ui': 'user',
    'web app': 'user',

    // Input
    'input': 'input',
    'source': 'input',
    'producer': 'input',
    'ingestion': 'input',
    'upload': 'input',
    'request': 'input',

    // Processing
    'service': 'processing',
    'processor': 'processing',
    'handler': 'processing',
    'controller': 'processing',
    'transformer': 'processing',
    'api': 'processing',
    'engine': 'processing',
    'llm': 'processing',
    'model': 'processing',

    // Storage
    'database': 'storage',
    'db': 'storage',
    'storage': 'storage',
    'cache': 'storage',
    'redis': 'storage',
    'vector': 'storage',
    's3': 'storage',
    'blob': 'storage',

    // Infrastructure
    'gateway': 'infrastructure',
    'load balancer': 'infrastructure',
    'proxy': 'infrastructure',
    'queue': 'infrastructure',
    'bus': 'infrastructure',
    'firewall': 'infrastructure',
    'cdn': 'infrastructure',

    // External
    'external': 'external',
    'third party': 'external',
    'external api': 'external',
    'webhook': 'external'
};

// ============================================================================
// LAYOUT DECISION ENGINE CLASS
// ============================================================================

export class LayoutDecisionEngine {

    /**
     * Analyzes a user prompt to understand the architecture pattern and components
     */
    analyzeArchitecture(prompt: string): ArchitectureAnalysis {
        const normalizedPrompt = prompt.toLowerCase();

        // Detect architecture pattern
        const { pattern, confidence } = this.detectPattern(normalizedPrompt);

        // Extract components (simplified - in production, this would use AI)
        const components = this.extractComponents(normalizedPrompt);

        // Infer relationships
        const relationships = this.inferRelationships(components, pattern);

        // Determine layout strategy
        const suggestedLayout = this.mapPatternToLayout(pattern);

        // Determine container behavior
        const containerHint = this.determineContainerHint(pattern);

        // Determine flow direction
        const flowDirection = this.determineFlowDirection(pattern);

        // Count logical layers
        const layerCount = this.estimateLayerCount(components, pattern);

        // Extract metadata
        const metadata = this.extractMetadata(normalizedPrompt);

        return {
            pattern,
            confidence,
            components,
            relationships,
            suggestedLayout,
            containerHint,
            flowDirection,
            layerCount,
            metadata
        };
    }

    /**
     * Determines the optimal layout configuration based on analysis
     */
    determineLayout(analysis: ArchitectureAnalysis): LayoutConfig {
        const baseSpacing = this.calculateBaseSpacing(analysis);

        // Strategy-specific configuration
        const strategyConfigs: Record<LayoutStrategy, Partial<LayoutConfig>> = {
            'tiered': {
                direction: 'horizontal',
                alignment: 'center',
                containerBehavior: 'wrap-content',
                edgeRouting: 'orthogonal'
            },
            'layered': {
                direction: 'vertical',
                alignment: 'center',
                containerBehavior: 'equal-width',
                edgeRouting: 'orthogonal'
            },
            'swimlane': {
                direction: 'horizontal',
                alignment: 'distribute',
                containerBehavior: 'equal-width',
                edgeRouting: 'orthogonal'
            },
            'hub-spoke': {
                direction: 'horizontal',
                alignment: 'center',
                containerBehavior: 'wrap-content',
                edgeRouting: 'curved'
            },
            'pipeline': {
                direction: 'horizontal',
                alignment: 'center',
                containerBehavior: 'wrap-content',
                edgeRouting: 'straight'
            },
            'grid': {
                direction: 'horizontal',
                alignment: 'distribute',
                containerBehavior: 'wrap-content',
                edgeRouting: 'curved'
            },
            'clustered': {
                direction: 'horizontal',
                alignment: 'center',
                containerBehavior: 'wrap-content',
                edgeRouting: 'curved'
            },
            'radial': {
                direction: 'horizontal',
                alignment: 'center',
                containerBehavior: 'wrap-content',
                edgeRouting: 'curved'
            }
        };

        const strategyConfig = strategyConfigs[analysis.suggestedLayout] || strategyConfigs['grid'];

        return {
            strategy: analysis.suggestedLayout,
            direction: strategyConfig.direction!,
            spacing: {
                nodeHorizontal: baseSpacing.horizontal,
                nodeVertical: baseSpacing.vertical,
                containerPadding: baseSpacing.padding,
                layerGap: baseSpacing.layerGap
            },
            alignment: strategyConfig.alignment!,
            containerBehavior: strategyConfig.containerBehavior!,
            edgeRouting: strategyConfig.edgeRouting!
        };
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    private detectPattern(prompt: string): { pattern: ArchitecturePattern; confidence: number } {
        const scores: Record<ArchitecturePattern, number> = {} as any;

        for (const [pattern, config] of Object.entries(PATTERN_KEYWORDS)) {
            let score = 0;
            for (const keyword of config.keywords) {
                if (prompt.includes(keyword)) {
                    score += config.weight;
                }
            }
            scores[pattern as ArchitecturePattern] = score;
        }

        // Find highest scoring pattern
        let bestPattern: ArchitecturePattern = 'general';
        let bestScore = 0;

        for (const [pattern, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestPattern = pattern as ArchitecturePattern;
            }
        }

        // Calculate confidence (0-1)
        const maxPossibleScore = Math.max(...Object.values(PATTERN_KEYWORDS).map(p => p.keywords.length * p.weight));
        const confidence = Math.min(bestScore / (maxPossibleScore * 0.3), 1); // 30% match = 100% confidence

        return { pattern: bestPattern, confidence };
    }

    private extractComponents(prompt: string): ComponentInfo[] {
        const components: ComponentInfo[] = [];
        const words = prompt.split(/\s+/);

        // Simple extraction based on keywords
        const componentMatches = new Set<string>();

        for (let i = 0; i < words.length; i++) {
            const word = words[i].toLowerCase();
            const twoWords = i < words.length - 1 ? `${word} ${words[i + 1].toLowerCase()}` : '';

            for (const [componentType, category] of Object.entries(COMPONENT_CATEGORIES)) {
                if (word.includes(componentType) || twoWords.includes(componentType)) {
                    if (!componentMatches.has(componentType)) {
                        componentMatches.add(componentType);
                        components.push({
                            id: `comp-${componentType.replace(/\s+/g, '-')}`,
                            name: componentType.charAt(0).toUpperCase() + componentType.slice(1),
                            type: componentType,
                            category,
                            importance: category === 'processing' ? 'critical' : 'important'
                        });
                    }
                }
            }
        }

        return components;
    }

    private inferRelationships(components: ComponentInfo[], _pattern: ArchitecturePattern): RelationshipInfo[] {
        const relationships: RelationshipInfo[] = [];

        // Simple rule-based relationship inference
        const sortedComponents = [...components].sort((a, b) => {
            const order = ['user', 'input', 'processing', 'storage', 'output', 'external'];
            return order.indexOf(a.category) - order.indexOf(b.category);
        });

        // Create linear flow relationships
        for (let i = 0; i < sortedComponents.length - 1; i++) {
            relationships.push({
                source: sortedComponents[i].id,
                target: sortedComponents[i + 1].id,
                type: 'data-flow',
                strength: 'medium'
            });
        }

        return relationships;
    }

    private mapPatternToLayout(pattern: ArchitecturePattern): LayoutStrategy {
        const mapping: Record<ArchitecturePattern, LayoutStrategy> = {
            'microservices': 'clustered',
            'rag-llm': 'swimlane',  // Best for RAG - shows clear layer separation
            'pipeline': 'pipeline',
            'layered': 'layered',
            'hub-spoke': 'hub-spoke',
            'client-server': 'tiered',
            'event-driven': 'hub-spoke',
            'data-flow': 'pipeline',
            'neural-network': 'layered',
            'general': 'swimlane'  // Default to swimlane for general architectures
        };

        return mapping[pattern];
    }

    private determineContainerHint(pattern: ArchitecturePattern): 'horizontal' | 'vertical' | 'none' {
        switch (pattern) {
            case 'rag-llm':
            case 'pipeline':
            case 'layered':
            case 'client-server':
                return 'horizontal';  // Containers as horizontal lanes
            case 'microservices':
            case 'event-driven':
                return 'vertical';   // Containers as vertical groups
            default:
                return 'horizontal';
        }
    }

    private determineFlowDirection(pattern: ArchitecturePattern): ArchitectureAnalysis['flowDirection'] {
        switch (pattern) {
            case 'rag-llm':
            case 'pipeline':
            case 'data-flow':
                return 'left-to-right';
            case 'layered':
            case 'client-server':
                return 'top-to-bottom';
            case 'hub-spoke':
            case 'event-driven':
                return 'radial';
            default:
                return 'left-to-right';
        }
    }

    private estimateLayerCount(components: ComponentInfo[], pattern: ArchitecturePattern): number {
        // Estimate based on pattern and component count
        switch (pattern) {
            case 'rag-llm':
                return 4; // User → App → Retrieval → Generation
            case 'layered':
            case 'client-server':
                return 3; // Presentation → Business → Data
            case 'pipeline':
                return Math.max(3, Math.ceil(components.length / 2));
            default:
                return Math.max(2, Math.min(5, Math.ceil(components.length / 3)));
        }
    }

    private extractMetadata(prompt: string): ArchitectureAnalysis['metadata'] {
        return {
            hasDatabase: /database|db|sql|mongo|postgres|dynamo|rds/.test(prompt),
            hasGateway: /gateway|api gateway|ingress/.test(prompt),
            hasMessageQueue: /queue|kafka|rabbitmq|sqs|pubsub/.test(prompt),
            hasLoadBalancer: /load balancer|lb|elb|alb/.test(prompt),
            hasUserInterface: /ui|frontend|client|browser|mobile|web app/.test(prompt),
            hasLLM: /llm|gpt|gemini|claude|chatgpt|ai model|language model/.test(prompt),
            hasVectorDB: /vector|embedding|pinecone|weaviate|chromadb|faiss/.test(prompt)
        };
    }

    private calculateBaseSpacing(analysis: ArchitectureAnalysis): {
        horizontal: number;
        vertical: number;
        padding: number;
        layerGap: number;
    } {
        // Adjust spacing based on estimated component count and layout type
        const componentCount = analysis.components.length;

        // Base values
        let horizontal = 200;
        let vertical = 100;
        let padding = 50;
        let layerGap = 250;

        // Adjust for component density
        if (componentCount > 10) {
            horizontal = 180;
            vertical = 90;
            padding = 40;
        } else if (componentCount < 5) {
            horizontal = 250;
            vertical = 120;
            padding = 60;
            layerGap = 300;
        }

        // Adjust for layout type
        if (analysis.suggestedLayout === 'swimlane' || analysis.suggestedLayout === 'tiered') {
            layerGap = 200; // Tighter for swimlanes
        }

        return { horizontal, vertical, padding, layerGap };
    }
}

// Export singleton for convenience
export const layoutDecisionEngine = new LayoutDecisionEngine();
