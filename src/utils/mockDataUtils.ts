import { DiagramData } from '../types';

export const MOCK_DIAGRAM_DATA = {
    title: "E-Commerce Microservices",
    nodes: [
        { id: "client", label: "Web Client", type: "container", x: 50, y: 200, icon: "User" },
        { id: "api_gateway", label: "API Gateway", type: "node", x: 250, y: 200, icon: "Api" },
        { id: "auth_service", label: "Auth Service", type: "node", x: 450, y: 100, icon: "Lock" },
        { id: "product_service", label: "Product Service", type: "node", x: 450, y: 300, icon: "Server" },
        { id: "db_auth", label: "Auth DB", type: "database", x: 650, y: 100, icon: "Database" },
        { id: "db_product", label: "Product DB", type: "database", x: 650, y: 300, icon: "Database" }
    ],
    links: [
        { id: "l1", source: "client", target: "api_gateway", label: "HTTPS" },
        { id: "l2", source: "api_gateway", target: "auth_service", label: "Auth Req" },
        { id: "l3", source: "api_gateway", target: "product_service", label: "Data Req" },
        { id: "l4", source: "auth_service", target: "db_auth", label: "SQL" },
        { id: "l5", source: "product_service", target: "db_product", label: "SQL" }
    ],
    containers: []
};

// Simulate Diagram Generation
// Simulate Diagram Generation
export const generateDiagramData = async (prompt: string, _userApiKey?: string): Promise<{ diagram: DiagramData; newGenerationCount: number | null }> => {
    console.log("STANDALONE MODE: Generating diagram for:", prompt);
    // Simulate a short delay to feel "real" but fast
    await new Promise(resolve => setTimeout(resolve, 800));

    // Return the static mock data for now, or randomize it slightly if needed
    const parsedData = JSON.parse(JSON.stringify(MOCK_DIAGRAM_DATA));
    parsedData.title = `Architecture: ${prompt.slice(0, 20)}...`;

    return { diagram: parsedData as DiagramData, newGenerationCount: null };
};

// Simulate Architecture Explanation
export const explainArchitecture = async (diagramData: DiagramData, _userApiKey?: string): Promise<string> => {
    console.log("STANDALONE MODE: Explaining architecture...");
    await new Promise(resolve => setTimeout(resolve, 600));

    return `## Architecture Explanation (Offline Mode)
    
This is a standard diagram explanation generated locally.
    
**Title**: ${diagramData.title}
    
**Components**:
${diagramData.nodes.map(n => `- **${n.label}**: A ${n.type} component.`).join('\n')}

In a full online version, this would provide a deep AI analysis. for now, enjoy this fast offline summary!`;
};

// Simulate Chat Interface
export const chatWithAssistant = async (_history: any[]): Promise<string> => {
    console.log("STANDALONE MODE: Chatting...");
    await new Promise(resolve => setTimeout(resolve, 500));

    return "I am currently running in offline standalone mode. I can't browse the web or generate novel complex text right now, but I'm here to help you navigate the app!";
};
