import { AISuggestion, NodeType, AIProvider, AISettings } from '../types';

// Defined schemas via imported constants
const NODE_SCHEMA_OPENAI = {
    type: "object",
    properties: {
        label: { type: "string", description: "Name of the new concept" },
        type: { type: "string", enum: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.PROBLEM, NodeType.ENTITY, NodeType.QUESTION, NodeType.TRACE] },
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

    if (!settings.apiKey) return [];

    try {
        const prompt = `You are an innovation engine. Given the node "${nodeLabel}" (${nodeDescription}), suggest 3-5 distinct, innovative connections. 
        ${contextLineage ? `CRITICAL CONTEXTUAL CONSTRAINT: The node "${nodeLabel}" emerged from: [ ${contextLineage} ]. Interpret it strictly within this context.` : ''}
        Focus on adjacent technologies, underlying problems, key questions, or theoretical concepts.
        The relationships should be active verbs.`;

        return await runIPCRequest(settings, prompt, true);
    } catch (e) {
        console.error("AI Service Error (Expand):", e);
        return [];
    }
};

export const expandConceptTargeted = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    relationType: string,
    count: number = 1,
    contextLineage?: string
): Promise<AISuggestion[]> => {

    if (!settings.apiKey) return [];

    try {
        const prompt = `You are an innovation engine. Given the node "${nodeLabel}" (${nodeDescription}), generate ${count} distinct new node(s) that satisfy this relationship: 
        "${nodeLabel}" -> [${relationType}] -> "New Node".
        ${contextLineage ? `CRITICAL CONTEXTUAL LINEAGE: [ ${contextLineage} ].` : ''}`;

        return await runIPCRequest(settings, prompt, true);
    } catch (e) {
        console.error("AI Service Error (Targeted):", e);
        return [];
    }
};

export const generateSynergyNode = async (
    settings: AISettings,
    nodeA: string, descriptionA: string,
    nodeB: string, descriptionB: string,
    contextA?: string, contextB?: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) return null;

    try {
        const prompt = `Analyze the intersection between "${nodeA}" (${descriptionA}) and "${nodeB}" (${descriptionB}).
        ${contextA ? `Lineage A: ${contextA}` : ''}
        ${contextB ? `Lineage B: ${contextB}` : ''}
        Identify a SINGLE, DISTINCT emergent concept, technology, or problem that arises from their combination.`;

        const result = await runIPCRequest(settings, prompt, false);
        return result[0] || null;
    } catch (e) {
        console.error("AI Service Error (Synergy):", e);
        return null;
    }
};


export const analyzeNodeLineage = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    lineage: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) return null;

    try {
        const prompt = `Perform an exhaustive, multi-dimensional "Trace Analysis" of "${nodeLabel}" (${nodeDescription}).
        Context Path from Root: [ ${lineage} ].
        
        Generate a "Trace Analysis" node that functions as a structural synthesis of this entire lineage. 
        Label: "Trace: ${nodeLabel}".
        Description: An insightful, comprehensive narrative (150-200 words). 
        Include:
        1. The logical necessity of why this node emerged from its predecessors.
        2. The structural tensions or architectural shifts this path represents.
        3. A synthesis of the hidden themes and "ghost logic" connecting the root to this specific point.
        4. The potential future trajectory this path implies for the system.
        Be profound, technical, and analytical. Avoid fluff.`;

        const result = await runIPCRequest(settings, prompt, false);
        return result[0] || null;
    } catch (e) {
        console.error("AI Service Error (Trace):", e);
        return null;
    }
};

export const generateInnovationOpportunity = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.apiKey) return null;

    try {
        const prompt = `You are a high-level innovation strategist and systems architect. 
        Target Node for Innovation: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
        
        FULL GRAPH CONTEXT (All nodes, descriptions, and relationships):
        ${fullGraphContext}
        
        Your Task:
        Critically analyze the target node's position, meaning, and relationships within this entire systemic context. 
        Produce a "Fully Developed Innovation Opportunity" node.
        
        Label: "Innovation: ${nodeLabel}".
        Description: A masterful, highly-developed synthesis (200-250 words) that:
        1. Identifies a non-obvious, groundbreaking opportunity revealed by the target node's intersection with the rest of the graph.
        2. Describes the technical architecture or system shift required to capture this opportunity.
        3. Explains how this innovation resolves a fundamental tension or bottleneck present in the global graph.
        4. Predicts the emergent properties this innovation would trigger in the system.
        
        This must be profound, technically rigorous, and go far beyond a simple expansion. It is a structural breakthrough.`;

        const result = await runIPCRequest(settings, prompt, false);
        return result[0] || null;
    } catch (e) {
        console.error("AI Service Error (Innovate):", e);
        return null;
    }
};


export const generateRandomSeedNode = async (settings: AISettings): Promise<AISuggestion | null> => {
    if (!settings.apiKey) return null;

    const domains = [
        "Mechanistic Interpretability & Model Transparency",
        "Reinforcement Learning from Human Feedback (RLHF) Bias",
        "Large Language Model (LLM) Reasoning & Logic Bounds",
        "Vector Search Optimization & Dimensionality Reduction",
        "Multi-Agent Coordination & emergent behaviors",
        "Neural Network Architecture Search (NAS)",
        "On-Device AI & model Quantization/Pruning",
        "Synthetic Data Generation & Distribution Collapse",
        "AI Safety, Alignment & Jailbreak prevention",
        "Retrieval-Augmented Generation (RAG) context precision",
        "Automated Software Reasoning & Code Generation",
        "Ethical AI Governance & Algorithmic Bias Auditing"
    ];

    const vibes = [
        "Provocative & Non-Obvious",
        "Deeply Technical & Fundamental",
        "Disruptive & Structural",
        "Paradoxical & Challenging",
        "Efficiency-Focused & Radical",
        "Systemic & Architectural"
    ];

    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    try {
        const prompt = `Generate a single, high-potential starting point for a technical innovation graph.
        Vibe: ${randomVibe}.
        Technical Domain: ${randomDomain}.
        
        CRITICAL CONSTRAINT: 
        1. The node must be either a "PROBLEM" or a "QUESTION".
        2. It must be a real-world or theoretical challenge in IT/CS that sparks deep technical thinking.
        3. Avoid generic terms or sci-fi. Focus on structural bottlenecks, architectural paradoxes, or unsolved technical questions.
        4. Focus on the intersection of ${randomDomain} and current industry or academic constraints.`;

        const result = await runIPCRequest(settings, prompt, false);
        return result[0] || null;

    } catch (e) {
        console.error("AI Service Error (Random):", e);
        return null;
    }
};


// --- PRIVATE HELPER VIA IPC ---

async function runIPCRequest(settings: AISettings, prompt: string, isArray: boolean): Promise<AISuggestion[]> {
    const isDeepSeek = settings.provider === AIProvider.DEEPSEEK;

    const entropy = Math.random().toString(36).substring(7);

    // Prepare Payload
    // For Gemini/OpenAI standard we can pass messages format
    const systemPrompt = isDeepSeek
        ? `You are a JSON-speaking innovation assistant. Respond ONLY with valid JSON. Do not use Markdown code blocks.
           CRITICAL: Your response MUST exactly match this schema:
           ${JSON.stringify(isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI, null, 2)}
           For "type", use one of: CONCEPT, TECHNOLOGY, PROBLEM, ENTITY, QUESTION, TRACE.
           [Entropy: ${entropy}]
           `
        : `You are a JSON-speaking innovation assistant. Respond ONLY with valid JSON. Do not use Markdown code blocks. [Entropy: ${entropy}]`;

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
    ];

    // Schema logic mainly for OpenAI strict mode
    const jsonSchema = isDeepSeek ? undefined : (isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI);

    try {
        // @ts-ignore - bridge exposed in preload
        if (!window.api || !window.api.aiRequest) {
            console.error("IPC API not found. Is preload.js configured?");
            return [];
        }

        // @ts-ignore
        const response = await window.api.aiRequest({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model || undefined,
            messages: messages,
            jsonSchema: jsonSchema,
            systemPrompt: systemPrompt // For specific handling if needed backend side
        });

        if (response.error) {
            console.error("[AI-Service] IPC Error:", response.error, response.details);
            return [];
        }

        const content = response.content;
        if (!content) return [];



        // Parsing Logic (Shared)
        let parsed: any;
        try {
            const cleanContent = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
            parsed = JSON.parse(cleanContent);
        } catch (e) {
            console.error("[AI-Service] JSON Parse Error:", e, "Content:", content);
            return [];
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

    } catch (e) {
        console.error("AI Service IPC Exception:", e);
        return [];
    }
}
