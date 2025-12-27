import { AISuggestion, NodeType, AIProvider, AISettings, GraphNode, ChatMessage, GraphLink, ExplorationMode } from '../types';
import { getModeConfig } from '../constants';

// Defined schemas via imported constants
const NODE_SCHEMA_OPENAI = {
    type: "object",
    properties: {
        label: { type: "string", description: "Name of the new concept" },
        type: { type: "string", enum: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.INNOVATION, NodeType.CONSTRAINT, NodeType.FRICTION, NodeType.ENTITY, NodeType.QUESTION, NodeType.TRACE, NodeType.EVENT, NodeType.PERSON, NodeType.PLACE, NodeType.THEORY, NodeType.ARTIFACT, NodeType.MOVEMENT, NodeType.DISCOVERY, NodeType.RELATIONSHIP, NodeType.CONTRADICTION, NodeType.IMPLEMENTATION, NodeType.USER_SEGMENT] },
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
    contextLineage?: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion[]> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificGuidance = mode === ExplorationMode.INNOVATION
        ? "Focus on adjacent technologies, underlying problems, key questions, or theoretical concepts."
        : "Focus on related events, influential people, connected places, underlying theories, or historical context.";

    const prompt = `You are a ${persona}. Given the node "${nodeLabel}" (${nodeDescription}), suggest 3-5 distinct, meaningful connections.
${contextLineage ? `CRITICAL CONTEXTUAL CONSTRAINT: The node "${nodeLabel}" emerged from: [ ${contextLineage} ]. Interpret it strictly within this context.` : ''}
    ${modeSpecificGuidance}
    The relationships should be active verbs.`;

    return await runIPCRequest(settings, prompt, true, mode);
};

export const expandConceptTargeted = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    relationType: string,
    count: number = 1,
    contextLineage?: string,
    targetType?: NodeType,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion[]> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const prompt = `You are a ${persona}. Given the source node "${nodeLabel}" (${nodeDescription}), generate exactly ${count} distinct node(s) that satisfy this relationship: --[${relationType}]--> [New Node].
${targetType ? `TARGET NODE TYPE: ${targetType}. Ensure every generated node is strictly of this type.` : ''}
${contextLineage ? `CONTEXT LINEAGE: [ ${contextLineage} ]. Use this to maintain conceptual continuity.` : ''}
Be specific and factually accurate.`;

    return await runIPCRequest(settings, prompt, count > 1, mode);
};

export const generateSynergyNode = async (
    settings: AISettings,
    labelA: string, descriptionA: string,
    labelB: string, descriptionB: string,
    contextA?: string, contextB?: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificGuidance = mode === ExplorationMode.INNOVATION
        ? "Identify a SINGLE DISTINCT emergent concept, technology, or problem that arises from their combination."
        : "Identify a SINGLE DISTINCT connection, relationship, or emergent concept that links these two nodes.";

    const prompt = `You are a ${persona}. Analyze the intersection between:
    1. "${labelA}" (${descriptionA}) ${contextA ? `[History: ${contextA}]` : ''}
    2. "${labelB}" (${descriptionB}) ${contextB ? `[History: ${contextB}]` : ''}
    
    ${modeSpecificGuidance}
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const traceLineageAnalysis = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    fullPathContext: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificObjective = mode === ExplorationMode.INNOVATION
        ? "Extract the most critical underlying challenge or breakthrough opportunity hidden within this specific lineage."
        : "Extract the most significant historical connection, causal relationship, or thematic pattern within this lineage.";

    const prompt = `You are a ${persona}. 
    Analyze this discovery path: [ ${fullPathContext} ].
    Current node: "${nodeLabel}" (${nodeDescription}).
    
    Objective: ${modeSpecificObjective}
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const innovateConcept = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificTask = mode === ExplorationMode.INNOVATION
        ? `Analyze this technology/concept within the context of the entire graph. 
    Propose a specific, high-viability INNOVATION that pushes this technology into its next architectural evolution.
    
    Label: "${nodeLabel} Evolution".
    Description: A detailed technical proposal (150-200 words) for a structural breakthrough. 
    Describe the unique mechanism, the theoretical basis, and how it dramatically overcomes current limitations mentioned in the graph.
    Include a brief technical stack or architectural approach.`
        : `Analyze this concept within the global historical or theoretical context.
    Propose a DEEPER SYNTHESIS or EMERGENT PATTERN that connects this node to seemingly unrelated areas of the graph or broader history.
    
    Label: "Synthesis: ${nodeLabel}".
    Description: A detailed interdisciplinary analysis (150-200 words) revealing hidden causal links, recurring historical patterns, or philosophical implications.
    Explain the source basis for this connection and its significance in the broader tapestry of knowledge.`;

    const prompt = `You are a ${persona}. 
    Target node: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    ${modeSpecificTask}`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const solveProblem = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificTask = mode === ExplorationMode.INNOVATION
        ? `Analyze this problem/pain point within the context of the entire graph. 
    Propose a specific, high-viability TECHNOLOGY or INNOVATION that solves this problem.
    
    Label: "${nodeLabel} Solution".
    Description: A detailed technical proposal (150-200 words) for an app or system. 
    Describe the core features, the unique value proposition, and why it specifically solves the target pain point better than existing solutions.
    Include a brief technical stack or architectural approach.`
        : `Analyze this historical event, debate, or contradiction within the context of the entire graph.
    Provide a comprehensive HISTORICAL RESOLUTION or THEMATIC SUMMARY that clarifies the ambiguity or settles the debate using evidence.
    
    Label: "Resolution: ${nodeLabel}".
    Description: A detailed evidence-based response (150-200 words) that synthesizes contradictory views or clarifies historical outcomes.
    Reference key artifacts, people, or movements that provide the resolution's foundation.`;

    const prompt = `You are a ${persona}. 
    Target Problem/Pain Point: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    ${modeSpecificTask}`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const answerQuestion = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificTask = mode === ExplorationMode.INNOVATION
        ? `Provide a concise, technically accurate answer to the question: "${nodeLabel}". 
           Use the surrounding context if available.
           
           Label: "Resolution: ${nodeLabel}".
           Description: A direct answer (100-150 words) that clarifies the technical or conceptual uncertainty.`
        : `Provide a historically accurate answer to the question: "${nodeLabel}".
           
           Label: "Historical Answer: ${nodeLabel}".
           Description: A direct answer (100-150 words) referencing artifacts, events, or people in the graph.`;

    const prompt = `You are a ${persona}. 
    Question: "${nodeLabel}" (${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    ${modeSpecificTask}
    
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const optimizeConcept = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are an expert technical optimizer and resource efficiency architect.
    Target node: "${nodeLabel}" (${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Propose a specific OPTIMIZATION for this technology/concept. 
    Focus on making it 10x faster, cheaper, or more sustainable WITHOUT changing the core breakthrough.
    
    Label: "${nodeLabel} Optimization".
    Description: A detailed plan (150-200 words) for efficiency gains. 
    Include specific technical levers (e.g., algorithmic complexity, material science, or resource distribution).`;

    const result = await runIPCRequest(settings, prompt, false, ExplorationMode.INNOVATION);
    return result[0] || null;
};

export const stressTestConcept = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    fullGraphContext: string
): Promise<AISuggestion[]> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are a professional Red Team engineer and systems skeptic.
    Target node: "${nodeLabel}" (${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Identify 2-3 critical failure modes or fundamental limitations for this seed.
    Each suggestion MUST be a CONSTRAINT or FRICTION node.
    
    Label: "Failure: [Cause]".
    Description: Why this fails, the physical/economic bottleneck, or the adoption friction.
    Relation: "is limited by" or "conflicts with".`;

    return await runIPCRequest(settings, prompt, true, ExplorationMode.INNOVATION);
};

export const generateImplementation = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    fullGraphContext: string
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const prompt = `You are a high-level Product Designer and Implementation strategist.
    Target node: "${nodeLabel}" (${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Your Task:
    Propose a practical IMPLEMENTATION (App, Product, or Physical Deployment) of this technology.
    Focus on "How it looks in practice" and the primary interface/interaction model.
    
    Label: "${nodeLabel} Product".
    Description: A detailed product description (150-200 words).
    Explain the UX, the core user flow, and how the underlying technology is abstracted for the user.
    Relation: "implemented as".`;

    const result = await runIPCRequest(settings, prompt, false, ExplorationMode.INNOVATION);
    return result[0] || null;
};


export const quickExpand = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    nodeType: string,
    fullGraphContext: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion[]> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const prompt = `You are a ${persona}. 
    Current node: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
    FULL GRAPH CONTEXT:
    ${fullGraphContext}
    
    Suggest 3 distinct discovery arcs. 
    Response schema: array of suggestions.`;

    return await runIPCRequest(settings, prompt, true, mode);
};

export const autonomousDiscovery = async (
    settings: AISettings,
    fullGraphContext: string,
    dieToGrow: boolean = true,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificGuidance = mode === ExplorationMode.INNOVATION
        ? "CRITICAL: Every 3rd developmental step MUST introduce a CONSTRAINT or FRICTION node to ground the innovation."
        : "Focus on expanding historical context, adding related people, events, or theories that enrich understanding.";

    const prompt = dieToGrow
        ? `You are an Autonomous Gardener working as a ${persona}. 
            CONTEXT:
            ${fullGraphContext}
            
            TASK: Pick the most 'active' or 'dangling' node in the graph and grow it further.
            ${modeSpecificGuidance}
            
            Response schema: Single node with label, type, description, and relationToParent.`
        : `You are an Autonomous Scout working as a ${persona}. 
            CONTEXT:
            ${fullGraphContext}
            
            TASK: Identify two seemingly unrelated nodes in the graph and propose a 'Ghost Link' (synergy, conflict, or dependency) between them.
            
            Response schema: Single node (the bridging concept) connecting them, or just a relationship if applicable. 
            (For this implementation, we'll focus on creating a bridging node).`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const agenticDiscovery = async (
    settings: AISettings,
    fullGraphContext: string,
    activeNode?: GraphNode,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;
    const isConstraint = activeNode && (
        activeNode.type === NodeType.CONSTRAINT ||
        activeNode.type === NodeType.FRICTION ||
        (mode === ExplorationMode.KNOWLEDGE && activeNode.type === NodeType.CONTRADICTION)
    );
    const isProblematic = activeNode && (
        activeNode.type === NodeType.PROBLEM ||
        activeNode.type === NodeType.PAIN_POINT ||
        (mode === ExplorationMode.KNOWLEDGE && activeNode.type === NodeType.QUESTION)
    );
    const isQuestion = activeNode && activeNode.type === NodeType.QUESTION;

    let intent;
    if (isConstraint) {
        // Roadblock hit: Mitigation or Pivot?
        intent = Math.random() > 0.4 ? "MITIGATE" : "PIVOT";
    } else if (isProblematic) {
        intent = mode === ExplorationMode.INNOVATION ? "SOLVE" : "RESOLVE";
    } else if (isQuestion) {
        intent = "ANSWER";
    } else {
        intent = Math.random() > 0.3 ? "EXPAND" : "CHALLENGE";
    }

    const expandGuidance = mode === ExplorationMode.INNOVATION
        ? "Grow the graph by proposing a non-obvious next step (TECHNOLOGY, INNOVATION, or ENTITY)."
        : "Grow the graph by proposing a non-obvious next step (EVENT, PERSON, THEORY, or DISCOVERY).";

    const challengeGuidance = mode === ExplorationMode.INNOVATION
        ? "Challenge the current path by proposing an unavoidable CONSTRAINT or FRICTION node."
        : "Challenge assumptions by proposing a QUESTION or alternative THEORY node.";

    const solveGuidance = mode === ExplorationMode.INNOVATION
        ? "Target is a technical problem. Propose a technical SOLUTION or mitigation approach."
        : "Target is a historical contradiction or gap. Provide a RESOLUTION or evidence-based synthesis.";

    const answerGuidance = "Target is a question. Synthesize an evidence-based ANSWER or resolution.";

    const mitigateGuidance = mode === ExplorationMode.INNOVATION
        ? "Target is a ROADBLOCK (Constraint/Friction). Propose a technical way to OVERCOME or circumvent this specific limitation."
        : "Target is a CONTRADICTION. Synthesize a higher-level perspective that reconciles the conflicting accounts or evidence.";

    const pivotGuidance = mode === ExplorationMode.INNOVATION
        ? "Target is a ROADBLOCK. This path might be a dead end. PIVOT: Propose an alternative solution or approach that avoids this specific constraint."
        : "Target is a CONTRADICTION. This line of reasoning is conflicting. PIVOT: Propose an alternative theory or historical perspective that avoids this specific contradiction.";

    const specificityGuidance = mode === ExplorationMode.INNOVATION
        ? `1. DO NOT be generic. Be technically specific.
    2. If a CONSTRAINT, explain why it's a physical or economic bottleneck.
    3. If FRICTION, explain the human or systemic resistance.`
        : `1. DO NOT be generic. Be historically and factually accurate.
    2. If an EVENT, provide specific dates or time periods.
    3. If a PERSON, include their key contributions or roles.`;

    const prompt = `You are a SEED Discovery Agent working as a ${persona}. 
    ${activeNode ? `Focusing on: "${activeNode.label}" [${activeNode.type}]` : "Scanning the entire system."}
    
    Current System State:
    ${fullGraphContext}
    
    Objective (${intent}):
    ${intent === "EXPAND" ? expandGuidance :
            intent === "CHALLENGE" ? challengeGuidance :
                intent === "SOLVE" ? solveGuidance :
                    intent === "RESOLVE" ? solveGuidance :
                        intent === "ANSWER" ? answerGuidance :
                            intent === "MITIGATE" ? mitigateGuidance : pivotGuidance}
    
    Constraint:
    ${specificityGuidance}
    
    Output a single node suggestion. If PIVOTING, ensure the 'relationToParent' field clearly identifies what it is pivoting 'from' or 'instead of'.`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

export const generateRandomSeedNode = async (
    settings: AISettings,
    entropy?: string,
    discardedTitles?: string[],
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const isRetry = discardedTitles && discardedTitles.length > 0;
    const avoidContext = isRetry
        ? `\nCRITICAL: DO NOT generate anything similar to these previously discarded ideas: ${discardedTitles.join(", ")}.
           PIVOT: Take a completely different direction, a different topic area, and a different angle.`
        : "";

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const modeSpecificPrompt = mode === ExplorationMode.INNOVATION
        ? `Generate a single PROBLEM or PAIN_POINT node that represents a significant friction point in modern technology (computing, AI, hardware, or human-system interaction).
    The problem should be concrete, high-impact, and clear.
    STYLE: Use "readable" language. Avoid hyper-technical academic jargon unless absolutely necessary to describe a common problem. Focus on the core friction felt by engineers or users.`
        : `Generate a single interesting starting point for knowledge exploration. This could be:
    - A significant historical EVENT
    - An influential PERSON
    - An important PLACE or civilization
    - A groundbreaking THEORY or idea
    - A fascinating DISCOVERY
    
    The topic should be interesting, educational, and rich with potential connections.
    STYLE: Use clear, engaging language. Make it accessible but intellectually stimulating.`;

    const prompt = `You are a ${persona}. ${modeSpecificPrompt}
    ${avoidContext}
    Variety context: [ ${entropy || Math.random()} ]
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, mode, 0.95);
    return result[0] || null;
};

export const researchAssistantChat = async (
    settings: AISettings,
    chatHistory: ChatMessage[],
    selectedNodes: GraphNode[],
    allLinks: GraphLink[],
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<ChatMessage> => {
    const activeSettings = settings.providers[settings.provider];
    if (!activeSettings?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;
    const nodeTypesList = modeConfig.nodeTypes.join(', ');

    // 1. Construct Contextual Brief
    let contextBrief = "NO NODES SELECTED.";
    if (selectedNodes.length > 0) {
        const nodeDescriptions = selectedNodes.map(n => `- ${n.label} (${n.type}): ${n.description || "No description"}`).join('\n');

        // Find links involving these nodes
        const relevantLinks = allLinks.filter(l => {
            const sid = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tid = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
            return selectedNodes.some(n => n.id === sid || n.id === tid);
        });

        const linkDescriptions = relevantLinks.map(l => {
            const sid = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tid = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
            const sNode = (typeof l.source === 'object' ? l.source : { label: "External Node" }) as any;
            const tNode = (typeof l.target === 'object' ? l.target : { label: "External Node" }) as any;
            return `- ${sNode.label} --[${l.relation}]--> ${tNode.label}`;
        }).join('\n');

        contextBrief = `SELECTED NODES:\n${nodeDescriptions}\n\nRELEVANT RELATIONSHIPS:\n${linkDescriptions}`;
    }

    const modeSpecificGuidance = mode === ExplorationMode.INNOVATION
        ? "Provide deep technical insights, definitions, and strategic analysis based on the selected nodes and their relationships."
        : "Provide interdisciplinary insights, historical evidence, and causal analysis. Focus on clarifying complex interconnections and referencing sources/artifacts where possible.";

    const systemPrompt = `You are the Nexus Research Assistant, a ${persona}.
    
    CURRENT GRAPH CONTEXT:
    ${contextBrief}

    YOUR GOAL:
    ${modeSpecificGuidance}
    
    IMPORTANT COMMUNICATION RULES:
    1. Always talk to the user in a helpful, conversational tone first. 
    2. Explain your reasoning and provide background information.
    3. If you identify a new concept, topic, or connection that belongs on the graph, you MUST propose it using this EXACT format at the VERY END of your message:
    
    [SUGGESTION]
    {
      "label": "Name",
      "type": "NodeType",
      "description": "Short justification",
      "relationToParent": "verb"
    }

    4. NodeType must be one of: ${nodeTypesList}.
    5. The relationToParent should describe how it connects to the primary node in the current selection.
    6. Do NOT output just JSON. Always provide a written response first.
    7. Do NOT wrap the JSON in Markdown code blocks. Output raw JSON after the [SUGGESTION] tag.`;

    const formattedMessages = chatHistory.map(m => ({
        role: m.role,
        content: m.content
    }));

    // @ts-ignore
    const response = await window.api.aiRequest({
        provider: settings.provider,
        apiKey: activeSettings.apiKey,
        model: activeSettings.model || undefined,
        messages: formattedMessages,
        systemPrompt: systemPrompt
    });

    if (response.error) {
        throw new Error(response.error);
    }

    const content = response.content;
    let mainContent = content;
    const suggestedNodes: AISuggestion[] = [];

    // Parse Suggestions if present (supports multiple)
    // Regex allows for optional markdown code blocks which some providers (OpenAI) insist on adding
    const regex = /\[SUGGESTION\]\s*(?:```(?:json)?\s*)?(\{[\s\S]*?\})(?:\s*```)?/g;
    const suggestionMatches = Array.from(content.matchAll(regex));

    for (const match of suggestionMatches) {
        try {
            const parsed = JSON.parse(match[1]);
            suggestedNodes.push({
                label: parsed.label || "New Seed",
                type: (parsed.type?.toUpperCase() as NodeType) || NodeType.CONCEPT,
                description: parsed.description || "",
                relationToParent: parsed.relationToParent || "related"
            });
            // Remove this suggestion block from the main content
            mainContent = mainContent.replace(match[0], '');
        } catch (e) {
            console.error("Failed to parse AI suggestion from chat:", e);
        }
    }

    return {
        id: Date.now().toString(),
        role: 'assistant',
        content: mainContent.trim(),
        timestamp: Date.now(),
        suggestedNode: suggestedNodes[0], // Backward compatibility
        suggestedNodes: suggestedNodes
    };
};

/**
 * Executes a request to the backend IPC bridge
 * @param settings AI Settings
 * @param prompt The full prompt to send
 * @param isArray Whether to expect an array of suggestions
 * @param mode The current exploration mode
 * @param entropy Optional temperature/entropy override
 */
async function runIPCRequest(
    settings: AISettings,
    prompt: string,
    isArray: boolean = false,
    mode: ExplorationMode = ExplorationMode.INNOVATION,
    entropy: number = 0.7
): Promise<AISuggestion[]> {
    const activeSettings = settings.providers[settings.provider];
    const isDeepSeek = activeSettings?.model?.toLowerCase().includes("deepseek");

    const modeConfig = getModeConfig(mode);
    const nodeTypesList = modeConfig.nodeTypes.join(', ');

    const messages = [
        { role: "user", content: prompt }
    ];

    const systemPrompt = isDeepSeek
        ? `You are a JSON-speaking ${modeConfig.aiPersona}. Respond ONLY with valid JSON. Do not use Markdown code blocks.
           CRITICAL: Your response MUST exactly match this schema:
           ${JSON.stringify(isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI, null, 2)}
            For "type", use one of: ${nodeTypesList}.
           [Entropy: ${entropy}]
           `
        : `You are a JSON-speaking ${modeConfig.aiPersona}. Respond ONLY with valid JSON. Do not use Markdown code blocks. [Entropy: ${entropy}]`;

    // Schema logic mainly for OpenAI strict mode
    const jsonSchema = isDeepSeek ? undefined : (isArray ? ARRAY_NODE_SCHEMA_OPENAI : NODE_SCHEMA_OPENAI);

    // @ts-ignore - bridge exposed in preload
    if (!window.api || !window.api.aiRequest) {
        throw new Error("IPC API not found. Is preload.js configured?");
    }

    // @ts-ignore
    const response = await window.api.aiRequest({
        provider: settings.provider,
        apiKey: activeSettings.apiKey,
        model: activeSettings.model || undefined,
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
