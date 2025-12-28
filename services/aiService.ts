import { AISuggestion, NodeType, AIProvider, AISettings, GraphNode, ChatMessage, GraphLink, ExplorationMode } from '../types';
import { getModeConfig } from '../constants';

const INNOVATION_RESEARCH_PRINCIPLES = `
INNOVATION RESEARCH PRINCIPLES:
1. EPISTEMIC GROUNDING: Be concrete. Use specific technical terms, architectural patterns, biological mechanisms, or industrial processes.
2. EXPERIENTIAL ANCHORING: Describe concepts through the lens of real interaction. Mention "the practitioner," "the end-user," "the operator," or "the system bottleneck."
3. HUMAN RELEVANCE: Connect abstract ideas to real-world friction, cost, time, or safety. Why does it matter right now?
4. FALSIFIABILITY: Avoid buzzwords. Be specific enough that a physical or technical implementation could be validated or stress-tested.
5. CURRENT TECHNOLOGY: Focus on what can be started or prototyped today (0-5 years). Avoid purely theoretical sci-fi (like broad-market starships).
6. FOUNDER-GRADE PAIN: Focus on high-intent problems. Concrete, costly, and recognizable. Identify "clear losers" and "massive inefficiency" where a breakthrough would create immediate value.
7. SHARP & GROUNDED: Avoid institutional white-paper tone. Be direct, pragmatic, and slightly skeptical of "magic" solutions.
8. REAL-WORLD VIABILITY: When proposing solutions, constraints (energy, bandwidth, cost, physics) must be acknowledged. Improvements should be incremental and specific rather than magical.
9. ANTI-HYPE: Do not use marketing fluff. If a solution is boring but effective, state it.
10. CONTEXTUAL INTEGRITY: MATCH THE LAYER. If the user's graph is about software/web (e.g. "API", "React", "User Flow"), your suggestions MUST be software-based. Do not jump to hardware/bio/quantum unless the graph ALREADY contains those elements. If the context is ambiguous, favor software/digital product solutions as the default baseline.
`;

const KNOWLEDGE_RESEARCH_PRINCIPLES = `
KNOWLEDGE RESEARCH PRINCIPLES:
1. PRIMARY SOURCE INTENT: When describing events or people, prioritize facts that would be found in primary historical records or reputable academic syntheses. Avoid pop-history myths.
2. CAUSAL DEPTH: Do not just list events. explain the *mechanism* of change. How did Event A specifically lead to Event B? (e.g., "The printing press didn't just 'spread ideas'; it drastically reduced the cost of reproduction, breaking the church's monopoly on scripture.")
3. CHRONOLOGICAL INTEGRITY: Be hyper-aware of time. Do not use modern metaphors to describe ancient events unless explicitly drawing an analogy. (e.g., Don't say "Aristotle 'downloaded' knowledge").
4. INTERDISCIPLINARY WEAVING: History is not just politics. It is economics, geography, philosophy, and technology. Link a political event to the *economic* condition that caused it, or the *philosophical* idea that justified it.
5. NUANCED PERSPECTIVE: History is rarely black and white. Highlight internal contradictions, debates, or the "grey areas" of a person or movement.
6. CURIOSITY DRIVEN: Frame descriptions to provoke the next question. "X happened, but historians still debate Y..."
7. SPECIFICITY OVER GENERALITY: Instead of "ancient rituals", say "the Eleusinian Mysteries". Instead of "scientists", say "The Royal Society".
`;

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
${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : ''}
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
${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : ''}
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

export const directedDiscovery = async (
    settings: AISettings,
    nodeLabel: string,
    nodeDescription: string,
    instruction: string,
    count: number = 1,
    contextLineage?: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<AISuggestion[]> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const prompt = `You are a ${persona}. Given the source node "${nodeLabel}" (${nodeDescription}), follow this SPECIFIC DISCOVERY INSTRUCTION: "${instruction}".
    Generate exactly ${count} distinct node(s) as a result of this discovery.
    ${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : ''}
    ${contextLineage ? `CONTEXT LINEAGE: [ ${contextLineage} ]. Use this to maintain conceptual continuity.` : ''}
    Be specific, factually accurate, and highly relevant to the instruction.`;

    return await runIPCRequest(settings, prompt, count > 1, mode);
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
    ${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : ''}
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
    ${INNOVATION_RESEARCH_PRINCIPLES}
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
    ${INNOVATION_RESEARCH_PRINCIPLES}
    Describe the core features, the unique value proposition, and why it specifically solves the target pain point better than existing solutions.
    Include a brief technical stack or architectural approach.`
        : `Analyze this historical event, debate, or contradiction within the context of the entire graph.
    Provide a comprehensive HISTORICAL RESOLUTION or THEMATIC SUMMARY that clarifies the ambiguity or settles the debate using evidence.
    
    Label: "Resolution: ${nodeLabel}".
    Description: A detailed evidence-based response (150-200 words) that synthesizes contradictory views or clarifies historical outcomes.
    Reference key artifacts, people, or movements that provide the resolution's foundation.`;

    const prompt = `You are a ${persona}. 
    Target Problem / Pain Point: "${nodeLabel}" (Type: ${nodeType}, Description: ${nodeDescription}).
    
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
            Description: A direct answer(100 - 150 words) that clarifies the technical or conceptual uncertainty.
                ${INNOVATION_RESEARCH_PRINCIPLES} `
        : `Provide a historically accurate answer to the question: "${nodeLabel}".

        Label: "Historical Answer: ${nodeLabel}".
            Description: A direct answer(100 - 150 words) referencing artifacts, events, or people in the graph.`;

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
    Propose a specific OPTIMIZATION for this technology / concept. 
    Focus on making it 10x faster, cheaper, or more sustainable WITHOUT changing the core breakthrough.

    Label: "${nodeLabel} Optimization".
    Description: A detailed plan (150-200 words) for efficiency gains.
    ${INNOVATION_RESEARCH_PRINCIPLES}
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
    Description: Why this fails, the physical / economic bottleneck, or the adoption friction.
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
    Focus on "How it looks in practice" and the primary interface / interaction model.

    Label: "${nodeLabel} Product".
    Description: A detailed product description (150-200 words).
    ${INNOVATION_RESEARCH_PRINCIPLES}
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
        ${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : KNOWLEDGE_RESEARCH_PRINCIPLES}
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
        ? `RESEARCH PRINCIPLE: Maintain 360-degree sight. Do not default to TECHNOLOGY or CONCEPT loops. If you see a technology, look for its hidden PROBLEM, friction point, or the USER_SEGMENT it targets. Consider the REGULATION, MARKET drivers, and ETHICS. Use ANALOGY to find cross-disciplinary solutions. Every advancement must be balanced by a ground-truth challenge or a MENTAL_MODEL being challenged.
        ${INNOVATION_RESEARCH_PRINCIPLES}`
        : "RESEARCH PRINCIPLE: Maintain 360-degree sight. Expand historical context by linking EVENTS to the PEOPLE they affected, the PLACES they occurred, and the underlying THEORIES or CONTRADICTIONS that drove them.";

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
${mode === ExplorationMode.KNOWLEDGE ? KNOWLEDGE_RESEARCH_PRINCIPLES : ''}

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
        ? "Target is a technical problem or pain point. Propose a specific SOLUTION or mitigation approach. DO NOT be generic. Consider the architectural trade-offs."
        : "Target is a historical contradiction or gap. Provide a RESOLUTION or evidence-based synthesis that reconciles conflicting artifacts or accounts.";

    const answerGuidance = "Target is a question. Synthesize an evidence-based ANSWER or resolution.";

    const mitigateGuidance = mode === ExplorationMode.INNOVATION
        ? "Target is a ROADBLOCK (Constraint/Friction). Propose a technical way to OVERCOME or circumvent this specific limitation."
        : "Target is a CONTRADICTION. Synthesize a higher-level perspective that reconciles the conflicting accounts or evidence.";

    const pivotGuidance = mode === ExplorationMode.INNOVATION
        ? "Target is a ROADBLOCK. This path might be a dead end. PIVOT: Propose an alternative solution or approach that avoids this specific constraint."
        : "Target is a CONTRADICTION. This line of reasoning is conflicting. PIVOT: Propose an alternative theory or historical perspective that avoids this specific contradiction.";

    const specificityGuidance = mode === ExplorationMode.INNOVATION
        ? `1. DO NOT be generic. Be technically specific.
    2. AVOID LOOPS: If the surrounding graph is mostly TECHNOLOGIES, look for a PAIN_POINT, USER_SEGMENT, or ETHICS node. If it is all PROBLEMS, look for an ENTITY, MARKET driver, or ANALOGY.
    3. BALANCE: For every two forward steps, provide one grounding step (CONSTRAINT, FRICTION, REGULATION, or QUESTION).
    4. PERSPECTIVE: Occasionally challenge the underlying MENTAL_MODEL or propose a cross-disciplinary ANALOGY.
    ${INNOVATION_RESEARCH_PRINCIPLES}`
        : `1. DO NOT be generic. Be historically and factually accurate.
    2. AVOID LOOPS: Do not just chain EVENTS. Link them to the PERSON who influenced them or the ARTIFACT they left behind.
    3. CURIOSITY: Look for the CONTRADICTION or QUESTION that remains unanswered in this lineage.
    ${KNOWLEDGE_RESEARCH_PRINCIPLES}`;

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
                            intent === "MITIGATE" ? mitigateGuidance : pivotGuidance
        }

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
        ? `Generate a single HIGH-IMPACT PROBLEM or PAIN_POINT node. 
    The problem should be concrete, costly (in time, money, or efficiency), and recognizable to an industry expert.
    DOMAIN ROTATION: Randomize between: Energy/Grid, BioTech/MedTech, Logistics/SupplyChain, MaterialsScience, AgriTech, or High-Efficiency Computing.
    ${isRetry ? 'CRITICAL: Pick a DIFFERENT domain than any previously discarded idea.' : ''}
    STYLE: Use "readable" language. Be sharp. Focus on the core friction where a stakeholder would say "this is the bottleneck holding us back."
    ${INNOVATION_RESEARCH_PRINCIPLES}`
        : `Generate a single interesting starting point for knowledge exploration. This could be:
    - A significant historical EVENT
    - An influential PERSON
    - An important PLACE or civilization
    - A groundbreaking THEORY or idea
    - A fascinating DISCOVERY
    
    The topic should be interesting, educational, and rich with potential connections.
    STYLE: Use clear, engaging language. Make it accessible but intellectually stimulating.
    ${KNOWLEDGE_RESEARCH_PRINCIPLES}`;

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
    allNodes: GraphNode[],
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

    // Use selected nodes if present, otherwise use the last 5 added nodes as "Recent Focus"
    const focusNodes = selectedNodes.length > 0 ? selectedNodes : allNodes.slice(-5);

    if (focusNodes.length > 0) {
        const nodeDescriptions = focusNodes.map(n => `- ${n.label} (${n.type}): ${n.description || "No description"} `).join('\n');

        // Find links involving these nodes
        const relevantLinks = allLinks.filter(l => {
            const sid = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tid = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
            return focusNodes.some(n => n.id === sid || n.id === tid);
        });

        const linkDescriptions = relevantLinks.map(l => {
            const sid = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tid = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;

            // Attempt to find nodes by ID in allNodes for labeling
            const sNode = allNodes.find(n => n.id === sid) || { label: "Source" };
            const tNode = allNodes.find(n => n.id === tid) || { label: "Target" };

            return `- ${sNode.label} --[${l.relation}]--> ${tNode.label} `;
        }).join('\n');

        contextBrief = `${selectedNodes.length > 0 ? 'SELECTED NODES' : 'RECENT DISCOVERIES'}: \n${nodeDescriptions} \n\nRELEVANT RELATIONSHIPS: \n${linkDescriptions} `;
    }

    const modeSpecificGuidance = mode === ExplorationMode.INNOVATION
        ? `Provide deep technical insights, definitions, and strategic analysis. EXERCISE 360-DEGREE RESEARCH: Suggest a variety of types (e.g. Problems, Entities, Constraints) to ensure a comprehensive investigation.
        ${INNOVATION_RESEARCH_PRINCIPLES}`
        : "Provide interdisciplinary insights, historical evidence, and causal analysis. EXERCISE 360-DEGREE RESEARCH: Suggest connections across diverse types (e.g. Artifacts, Places, Contradictions) to enrich the tapestry of knowledge.";

    const systemPrompt = `You are the Nexus Research Assistant, a ${persona}.
    
    CURRENT GRAPH CONTEXT:
    ${contextBrief}

    YOUR GOAL:
    ${modeSpecificGuidance}
    
    IMPORTANT SHARED DISCOVERY RULES (MANDATORY):
    1. CONVERSATION FIRST: Respond to the user with depth, intuition, and technical/historical accuracy. 
    2. SHARED KNOWLEDGE MAPPING: Act as a visual scribe for our shared discovery session. Extract the ACTUAL CONTENT and ESSENCE of what we discussed.
       - CRITICAL: Seeds must represent THE SPECIFIC TOPICS we talked about, not generic definitions.
       - Example: If we discuss "problems with AI tools", create a seed like "AI Tools Limitations" with a description of the ACTUAL problems we mentioned (e.g., "lack of context grounding, generic outputs"), NOT a generic definition like "A challenging situation".
       - Capture the SUBSTANCE and NUANCE of our conversation in each seed's label and description.
       - Each seed should be a meaningful artifact of WHAT WAS ACTUALLY SAID, not a placeholder concept.
    3. NO DISCONNECTED SEEDS: The graph is a single unified narrative. Every node in your [MAP] MUST be connected to something.
       - If a new node relates to another new node, link them.
       - CRITICAL: At least one node in your new set MUST link back to a node in the CURRENT GRAPH CONTEXT (if any nodes exist).
       - If there is no specific technical parent, use a relational link like "evolves from", "context for", or "adjacent to" to connect to the most relevant existing node.
       - Connections should also reflect HOW we discussed the relationships, not just generic links.
    4. THE [MAP] BLOCK: Provide a raw JSON [MAP] block at the VERY END of your message.
    
    [MAP]
    {
      "nodes": [
        { "label": "Concept Name", "type": "NodeType", "description": "Justification" }
      ],
      "links": [
        { "sourceLabel": "Source", "targetLabel": "Target", "relation": "active verb" }
      ]
    }

    5. NodeType must be one of: ${nodeTypesList}.
    6. Relationships: Use active verbs. Avoid generic "related to" if possible.
    7. CRITICAL: Do NOT output raw JSON alone. Provide a conversational response first.`;

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

    return extractMapInternal(response.content);
};

// --- PARALLEL PERFORMANCE EXPLOIT: SPEED-OPTIMIZED CHAT ---

/**
 * FAST CALL 1: Return ONLY the text response from the persona.
 * No JSON or mapping logic involved to reduce cognitive load and latency.
 */
export const researchAssistantTextReply = async (
    settings: AISettings,
    chatHistory: ChatMessage[],
    selectedNodes: GraphNode[],
    allNodes: GraphNode[],
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<string> => {
    const activeSettings = settings.providers[settings.provider];
    if (!activeSettings?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    // 1. Construct Lightweight Context (Optimized for speed)
    const focusNodes = selectedNodes.length > 0 ? selectedNodes : allNodes.slice(-3); // Reduced from 5 to 3 for speed
    let contextBrief = "NO NODES SELECTED.";

    if (focusNodes.length > 0) {
        const nodeDescriptions = focusNodes.map(n => `- ${n.label} (${n.type})`).join('\n'); // Dropped description for speed unless essential
        contextBrief = `FOCUS: \n${nodeDescriptions}`;
    }

    const systemPrompt = `You are the Nexus Research Assistant, a ${persona}.
    
    CONTEXT:
    ${contextBrief}

    IMPORTANT RULES:
    1. Respond to the user with depth and intuition but BE CONCISE. 
    2. DO NOT output any structured data, [MAP], or structural tags. 
    3. Just talk. Be an intellectual brainstorming partner.
    4. Keep your response under 100 words unless complex explanation is requested.`;

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

    if (response.error) throw new Error(response.error);
    let content = response.content.trim();

    // Fix for DeepSeek/models that return JSON despite instructions
    try {
        const cleanContent = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        if (cleanContent.startsWith('{') && cleanContent.endsWith('}')) {
            const parsed = JSON.parse(cleanContent);
            if (parsed.response && typeof parsed.response === 'string') return parsed.response;
            if (parsed.content && typeof parsed.content === 'string') return parsed.content;
            if (parsed.message && typeof parsed.message === 'string') return parsed.message;
            if (parsed.answer && typeof parsed.answer === 'string') return parsed.answer;
            if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                return "Here are some suggestions:\n\n" + parsed.suggestions.map((s: string) => `- ${s}`).join('\n');
            }
        }
    } catch (e) {
        // Ignore JSON parse errors and return raw content
    }

    return content;
};

/**
 * FAST CALL 2: Extract a knowledge map from raw text (User or AI).
 * This runs in parallel or background to populate the graph without blocking chat.
 */
export const extractKnowledgeMap = async (
    settings: AISettings,
    textToAnalyze: string,
    contextBrief: string,
    mode: ExplorationMode = ExplorationMode.INNOVATION
): Promise<{ nodes: AISuggestion[], links: Array<{ sourceLabel: string, targetLabel: string, relation: string }> }> => {
    const activeSettings = settings.providers[settings.provider];
    if (!activeSettings?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const nodeTypesList = modeConfig.nodeTypes.join(', ');

    const systemPrompt = `You are a strict JSON-only Visual Discovery Scribe.
    
    YOUR TASK:
    Extract a high-density knowledge map from the text, capturing the ACTUAL CONTENT and ESSENCE of what was discussed.
    
    CONTEXT (RECENT GRAPH):
    ${contextBrief}

    CRITICAL RULES:
    1. Extract 2-5 significant Seeds (Nodes) and their Relationships (Links).
    2. CONTENT FIDELITY: Seeds must represent THE SPECIFIC TOPICS mentioned in the text, not generic definitions.
       - Example: If the text discusses "problems with AI tools", create "AI Tools Limitations" with the ACTUAL problems mentioned, NOT "A challenging situation".
       - Each seed's label and description should capture WHAT WAS ACTUALLY SAID.
    3. NO DISCONNECTED CLUSTERS: At least one new node MUST link to an existing node in the CONTEXT.
    4. Relationships MUST be active verbs that reflect HOW the topics were connected in the discussion.
    5. OUTPUT ONLY RAW JSON. Do not use Markdown code blocks. Do not add any text before or after the JSON.
    
    [MAP]
    {
      "nodes": [
        { "label": "Concept", "type": "NodeType", "description": "Justification" }
      ],
      "links": [
        { "sourceLabel": "Source", "targetLabel": "Target", "relation": "verb" }
      ]
    }
    
    NodeType must be one of: ${nodeTypesList}.`;

    // @ts-ignore
    const response = await window.api.aiRequest({
        provider: settings.provider,
        apiKey: activeSettings.apiKey,
        model: activeSettings.model || undefined,
        messages: [{ role: 'user', content: `Extract the JSON map from this text: "${textToAnalyze}"` }],
        systemPrompt: systemPrompt
    });

    if (response.error) return { nodes: [], links: [] };

    // Use internal extractor logic
    const chatMsg = extractMapInternal(response.content);
    return { nodes: chatMsg.suggestedNodes || [], links: chatMsg.suggestedLinks || [] };
};

export const curateWikiSnippet = async (
    settings: AISettings,
    snippet: string,
    pageTitle: string,
    sourceNodeContext: { label: string; description: string },
    mode: ExplorationMode = ExplorationMode.KNOWLEDGE
): Promise<AISuggestion | null> => {
    if (!settings.providers[settings.provider]?.apiKey) throw new Error("AI API Key is missing. Please check Settings.");

    const modeConfig = getModeConfig(mode);
    const persona = modeConfig.aiPersona;

    const prompt = `You are the Nexus Research Assistant.
    A user has highlighted a specific snippet from a Wikipedia article while researching a concept in SEED.
    
    WIKIPEDIA PAGE: "${pageTitle}"
    SNIPPET: "${snippet}"
    
    CONSTITUTIONAL CONTEXT:
    The user is connecting this back to their existing seed: "${sourceNodeContext.label}" (${sourceNodeContext.description}).
    
    TASK:
    1. ARTIFACT CREATION: Summarize the snippet into a high-density "Seed Node". Focus on the core mechanism, event, or principle.
    2. ARCHITECTURAL PLACEMENT: Select the most accurate NodeType from the internal framework.
    3. RELATIONAL SYNTHESIS: Determine the precise relationship verb connecting this new seed back to "${sourceNodeContext.label}".
    
    PRINCIPLES OF RELATIONAL SYNTHESIS (MANDATORY):
    - ANALYTICAL DEPTH: Move beyond generic connections. Identify the structural/functional role (e.g., is it a "catalyst for," "structural component of," "modern critique of," or "functional precursor to"?).
    - TEMPORAL & CAUSAL INTEGRITY: Be sophisticated about time. While the arrow of time is absolute (earlier can cause later, not vice-versa), bridge-links can be thematic. A modern theory might "re-interpret" or "provide a framework for analyzing" an ancient event.
    - EPISTEMIC PRECISION: Use high-intent, active verbs. If a technology is used in an event, use "operationalized by". If a person founded a movement, use "galvanized".
    - SOPHISTICATED BRIDGE-LINKING: If the connection is indirect, identify the shared principle or structural parallel (e.g., "strategic analogue of" or "instantiates the principle of").
    
    \${mode === ExplorationMode.INNOVATION ? INNOVATION_RESEARCH_PRINCIPLES : ''}
    Response schema: single node.`;

    const result = await runIPCRequest(settings, prompt, false, mode);
    return result[0] || null;
};

const extractMapInternal = (content: string) => {
    let mainContent = content;
    const suggestedNodes: AISuggestion[] = [];
    const suggestedLinks: Array<{ sourceLabel: string; targetLabel: string; relation: string }> = [];

    // 1. ROBUST PARSING: Check if the entire response is a valid JSON (common with DeepSeek/highly structured models)
    let possibleJson: any = null;
    try {
        const cleanContent = content.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        if (cleanContent.startsWith('{') && cleanContent.endsWith('}')) {
            possibleJson = JSON.parse(cleanContent);
        }
    } catch (e) { }

    if (possibleJson) {
        const responseText = possibleJson.response || possibleJson.conversation || possibleJson.content || possibleJson.text || possibleJson.message;
        if (responseText && typeof responseText === 'string') {
            mainContent = responseText;
        }
        const mapData = possibleJson.map || possibleJson;
        if (mapData.nodes && Array.isArray(mapData.nodes)) {
            mapData.nodes.forEach((n: any) => {
                suggestedNodes.push({
                    label: n.label || "New Seed",
                    type: (n.type?.toUpperCase() as NodeType) || NodeType.CONCEPT,
                    description: n.description || "",
                    relationToParent: "related"
                });
            });
        }
        if (mapData.links && Array.isArray(mapData.links)) {
            mapData.links.forEach((l: any) => {
                if (l.sourceLabel && l.targetLabel && l.relation) {
                    suggestedLinks.push({ sourceLabel: l.sourceLabel, targetLabel: l.targetLabel, relation: l.relation });
                }
            });
        }
    } else {
        const mapRegex = /\[MAP\]\s*(?:```(?:json)?\s*)?(\{[\s\S]*?\})(?:\s*```)?/g;
        const mapMatch = mapRegex.exec(content);
        if (mapMatch) {
            try {
                const parsedMap = JSON.parse(mapMatch[1]);
                if (parsedMap.nodes && Array.isArray(parsedMap.nodes)) {
                    parsedMap.nodes.forEach((n: any) => {
                        suggestedNodes.push({
                            label: n.label || "New Seed",
                            type: (n.type?.toUpperCase() as NodeType) || NodeType.CONCEPT,
                            description: n.description || "",
                            relationToParent: "related"
                        });
                    });
                }
                if (parsedMap.links && Array.isArray(parsedMap.links)) {
                    parsedMap.links.forEach((l: any) => {
                        if (l.sourceLabel && l.targetLabel && l.relation) {
                            suggestedLinks.push({ sourceLabel: l.sourceLabel, targetLabel: l.targetLabel, relation: l.relation });
                        }
                    });
                }
                mainContent = mainContent.replace(mapMatch[0], '');
            } catch (e) { }
        }
        const suggestionRegex = /\[SUGGESTION\]\s*(?:```(?:json)?\s*)?(\{[\s\S]*?\})(?:\s*```)?/g;
        const suggestionMatches = Array.from(content.matchAll(suggestionRegex));
        for (const match of suggestionMatches) {
            try {
                const parsed = JSON.parse(match[1]);
                suggestedNodes.push({
                    label: parsed.label || "New Seed",
                    type: (parsed.type?.toUpperCase() as NodeType) || NodeType.CONCEPT,
                    description: parsed.description || "",
                    relationToParent: parsed.relationToParent || "related"
                });
                mainContent = mainContent.replace(match[0], '');
            } catch (e) { }
        }
    }

    return {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: mainContent.trim(),
        timestamp: Date.now(),
        suggestedNode: suggestedNodes[0],
        suggestedNodes: suggestedNodes,
        suggestedLinks: suggestedLinks
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
        throw new Error(`Failed to parse AI response: \${e instanceof Error ? e.message : 'Invalid JSON'}`);
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
