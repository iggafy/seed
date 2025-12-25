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
        const prompt = `Perform a deep "Trace Analysis" of "${nodeLabel}" (${nodeDescription}).
        Context Path: [ ${lineage} ].
        Generate a "Trace Analysis" node. 
        Label: "Trace: ${nodeLabel}".
        Description: Comprehensive narrative (80-120 words) synthesizing the journey, hidden logic, and philosophical necessity of this path.`;

        const result = await runIPCRequest(settings, prompt, false);
        return result[0] || null;
    } catch (e) {
        console.error("AI Service Error (Trace):", e);
        return null;
    }
};


export const generateRandomSeedNode = async (settings: AISettings): Promise<AISuggestion | null> => {
    if (!settings.apiKey) return null;

    try {
        const prompt = `Generate a single, high-potential starting point for an innovation graph in Information Technology.
        CRITICAL CONSTRAINT: The node must be either a "PROBLEM" or a "QUESTION".
        Areas: Unsolved CS Problems, AI Alignment, Crypto, Digital Sovereignty, Hardware Limits.`;

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
