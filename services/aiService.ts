import { AISuggestion, NodeType, AIProvider, AISettings, GraphNode } from '../types';

// Defined schemas via imported constants
const NODE_SCHEMA_OPENAI = {
    type: "object",
    properties: {
        label: { type: "string", description: "Name of the new concept" },
        type: { type: "string", enum: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.INNOVATION, NodeType.CONSTRAINT, NodeType.FRICTION, NodeType.ENTITY, NodeType.QUESTION, NodeType.TRACE] },
        description: { type: "string", description: "Short description" },
        relationToParent: { type: "string", description: "Relationship verb" }
    },
    required: ["label", "type", "description", "relationToParent"],
    additionalProperties: false
};

const ARRAY_NODE_SCHEMA_OPENAI = {
    type: "object",
    properties: {
        suggestions: {
            type: "array",
            items: NODE_SCHEMA_OPENAI
        }
    },
    required: ["suggestions"],
    additionalProperties: false
};

// --- PUBLIC METHODS ---

export const expandConcept = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    contextLineage?: string
): Promise<AISuggestion[]> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are an innovation engine. Given the node "${nodeLabel}" (${nodeDescription}), suggest 3-5 distinct, innovative connections.
${contextLineage ? `CRITICAL CONTEXTUAL CONSTRAINT: The node "${nodeLabel}" emerged from: [ ${contextLineage} ]. Interpret it strictly within this context.` : ''}
    Focus on adjacent technologies, underlying problems, key questions, or theoretical concepts.
    The relationships should be active verbs.`;

    return await runIPCRequest(settings, prompt, true);
};

export const expandConceptTargeted = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    relationType: string,
    count: number = 1,
    contextLineage?: string,
    targetType?: NodeType
): Promise<AISuggestion[]> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are an innovation engine. Given the source node "${nodeLabel}" (${nodeDescription}), generate exactly ${count} distinct node(s) that satisfy this relationship: --[${relationType}]--> [New Node].
${targetType ? `TARGET NODE TYPE: ${targetType}. Ensure every generated node is strictly of this type.` : ''}
${contextLineage ? `CONTEXT LINEAGE: [ ${contextLineage} ]. Use this to maintain conceptual continuity.` : ''}
Be technically specific.`;

    return await runIPCRequest(settings, prompt, count > 1);
};

export const generateSynergyNode = async (
    settings: AISettings,
    labelA: string, descriptionA: string,
    labelB: string, descriptionB: string,
    contextA?: string, contextB?: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `Analyze the intersection between:
    1. "${labelA}" (${descriptionA}) ${contextA ? `[History: ${contextA}]` : ''}
    2. "${labelB}" (${descriptionB}) ${contextB ? `[History: ${contextB}]` : ''}
    
    Identify a SINGLE DISTINCT emergent concept, technology, or problem that arises from their combination.
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const traceLineageAnalysis = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    lineage: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `Perform an exhaustive multi-dimensional analysis of: "${nodeLabel}" (${nodeDescription}).
    Context Path from Root: ${lineage}.
    
    Generate a TRACE node that functions as a structural synthesis of the entire lineage.
    Label: "Trace: ${nodeLabel}".
    Description: An insightful, comprehensive narrative (150-200 words). 
    The logical necessity of why this node emerged from its predecessors.
    The structural tensions or architectural shifts this path represents.
    A synthesis of the hidden themes and connecting the root to this specific point.
    The potential future trajectory this path implies for the system.
    Be profound, technical and analytical. No fluff.`;

    const result = await runIPCRequest(settings, prompt, false, 0.4);
    return result[0] || null;
};

export const generateInnovationOpportunity = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are a product architect and software innovator. 
    Target node: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Analyze this technology/concept within the context of the entire graph. 
    Propose a specific, high-viability INNOVATION that pushes this technology into its next architectural evolution.
    
    Label: "${nodeLabel} Evolution".
    Description: A detailed technical proposal (150-200 words) for a structural breakthrough. 
    Describe the unique mechanism, the theoretical basis, and how it dramatically overcomes current limitations mentioned in the graph.
    Include a brief technical stack or architectural approach.`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const solveProblem = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are a product architect and software innovator. 
    Target Problem/Pain Point: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Analyze this problem/pain point within the context of the entire graph. 
    Propose a specific, high-viability TECHNOLOGY or INNOVATION that solves this problem.
    
    Label: "${nodeLabel} Solution".
    Description: A detailed technical proposal (150-200 words) for an app or system. 
    Describe the core features, the unique value proposition, and why it specifically solves the target pain point better than existing solutions.
    Include a brief technical stack or architectural approach.`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const answerQuestion = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are a research scientist and systems engineer. 
    Target Question: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Critically address this question using the context of the entire graph. 
    Propose a TECHNOLOGY, INNOVATION, or CONCEPT that provides a functional answer or exploratory path.
    
    Label: "Answer: ${nodeLabel}".
    Description: A rigorous, evidence-based answer (150-200 words). 
    Explain the technical mechanism, the theoretical basis, and how this answer advances the overall project goal.`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const performDiscoveryPulse = async (
    settings: AISettings,
    fullGraphContext: string,
    existingNodes: GraphNode[]
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    // Choose between finding a connection or growing a new node
    const dieToGrow = Math.random() > 0.4; // 60% chance to grow, 40% to connect

    const prompt = dieToGrow
        ? `You are an Autonomous Gardener in an innovation graph. 
            CONTEXT:
            ${fullGraphContext}
            
            TASK: Pick the most 'active' or 'dangling' node in the graph and grow it further.
            CRITICAL: Every 3rd developmental step MUST introduce a CONSTRAINT or FRICTION node to ground the innovation.
            
            Response schema: Single node with label, type, description, and relationToParent.`
        : `You are an Autonomous Scout. 
            CONTEXT:
            ${fullGraphContext}
            
            TASK: Identify two seemingly unrelated nodes in the graph and propose a 'Ghost Link' (synergy, conflict, or dependency) between them.
            
            Response schema: Single node (the bridging concept) connecting them, or just a relationship if applicable. 
            (For this implementation, we'll focus on creating a bridging node).`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const agenticDiscovery = async (
    settings: AISettings,
    fullGraphContext: string,
    activeNode?: GraphNode
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const intent = Math.random() > 0.3 ? "EXPAND" : "CHALLENGE";

    const prompt = `You are a SEED Discovery Agent. 
    ${activeNode ? `Focusing on: "${activeNode.label}" [${activeNode.type}]` : "Scanning the entire system."}
    
    Current System State:
    ${fullGraphContext}
    
    Objective (${intent}):
    ${intent === "EXPAND"
            ? "Grow the graph by proposing a non-obvious next step (TECHNOLOGY, INNOVATION, or ENTITY)."
            : "Challenge the current path by proposing an unavoidable CONSTRAINT or FRICTION node."}
    
    Constraint:
    1. DO NOT be generic. Be technically specific.
    2. If a CONSTRAINT, explain why it's a physical or economic bottleneck.
    3. If FRICTION, explain the human or systemic resistance.
    
    Output a single node suggestion.`;

    const result = await runIPCRequest(settings, prompt, false);
    return result[0] || null;
};

export const generateRandomSeedNode = async (settings: AISettings, entropy?: string, discardedTitles?: string[]): Promise<AISuggestion | null> => {
    if (!settings.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const isRetry = discardedTitles && discardedTitles.length > 0;
    const avoidContext = isRetry
        ? `\nCRITICAL: DO NOT generate anything similar to these previously discarded ideas: ${discardedTitles.join(", ")}.
           PIVOT: Take a completely different direction, a different industry, and a different technical angle. If the previous ones were about backend data, try frontend UX; if they were about AI security, try sustainable hardware or decentralized infra.`
        : "";

    const prompt = `You are a visionary system architect. Generate a single PROBLEM or PAIN_POINT node that represents a significant friction point in modern technology (computing, AI, hardware, or human-system interaction).
    The problem should be concrete, high-impact, and clear.
    STYLE: Use "readable" language. Avoid hyper-technical academic jargon unless absolutely necessary to describe a common problem. Focus on the core friction felt by engineers or users.
    ${avoidContext}
    Variety context: [ ${entropy || Math.random()} ]
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, 0.95);
    return result[0] || null;
};

/**
 * Executes a request to the backend IPC bridge
 * @param settings AI Settings
 * @param prompt The full prompt to send
 * @param isArray Whether to expect an array of suggestions
 * @param entropy Optional temperature/entropy override
 */
async function runIPCRequest(
    settings: AISettings,
    prompt: string,
    isArray: boolean = false,
    entropy: number = 0.7
): Promise<AISuggestion[]> {
    const isDeepSeek = settings.model?.toLowerCase().includes("deepseek");

    const messages = [
        { role: "user", content: prompt }
    ];

    const systemPrompt = isDeepSeek
        ? `You are a JSON-speaking innovation assistant. Respond ONLY with valid JSON. Do not use Markdown code blocks.
           CRITICAL: Your response MUST exactly match this schema:
           ${JSON.stringify(isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI, null, 2)}
            For "type", use one of: CONCEPT, TECHNOLOGY, PROBLEM, PAIN_POINT, INNOVATION, CONSTRAINT, FRICTION, ENTITY, QUESTION, TRACE.
           [Entropy: ${entropy}]
           `
        : `You are a JSON-speaking innovation assistant. Respond ONLY with valid JSON. Do not use Markdown code blocks. [Entropy: ${entropy}]`;

    // Schema logic mainly for OpenAI strict mode
    const jsonSchema = isDeepSeek ? undefined : (isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI);

    // @ts-ignore - bridge exposed in preload
    if (!window.api || !window.api.aiRequest) {
        throw new Error("IPC API not found. Is preload.js configured?");
    }

    // @ts-ignore
    const response = await window.api.aiRequest({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model || undefined,
        messages: messages,
        jsonSchema: jsonSchema,
        systemPrompt: systemPrompt
    });

    if (response.error) {
        throw new Error(response.error || "Unknown AI Request Error");
    }

    const content = response.content;
    if (!content) return [];

    // Parsing Logic (Shared)
    let parsed: any;
    try {
        const cleanContent = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        parsed = JSON.parse(cleanContent);
    } catch (e) {
        throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
    }

    // Normalizer
    const normalizeNode = (n: any) => ({
        label: n.label || n.title || "Unknown",
        type: n.type || "CONCEPT",
        description: n.description || "No description",
        relationToParent: n.relationToParent || n.relation || "related"
    });

    if (isArray) {
        let items: any[] = [];
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            items = parsed.suggestions;
        } else if (parsed.nodes && Array.isArray(parsed.nodes)) {
            items = parsed.nodes;
        } else if (parsed.innovation_node) {
            items = [parsed.innovation_node];
        } else {
            console.warn("[AI-Service] Expected array but got:", parsed);
            return [];
        }
        return items.map(normalizeNode);
    } else {
        let item = parsed;
        if (parsed.suggestions && parsed.suggestions.length > 0) item = parsed.suggestions[0];
        else if (parsed.innovation_node) item = parsed.innovation_node;
        else if (Array.isArray(parsed) && parsed.length > 0) item = parsed[0];

        return [normalizeNode(item)];
    }
}
