import * as d3 from 'd3';

// Simulation types
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  isRoot?: boolean;
  // Nested Graph Persistence
  subGraphData?: GraphData;
  isGhost?: boolean; // Hypothetical node from Discovery Mode
  isNew?: boolean;   // Animation flag
  isLuckyResult?: boolean; // Result of "I'm feeling lucky" flow
  // Wormhole / Cross-Session Connectivity
  isWormhole?: boolean;
  targetSessionId?: string;
  targetNodeId?: string;
  // D3 optional properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // Wikipedia Integration
  wikiUrl?: string;
  isWikipediaSource?: boolean;
}

export interface WikiBrowserState {
  isOpen: boolean;
  url: string;
  title: string;
  sourceNodeId: string | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string; // e.g., "enables", "conflicts", "depends"
  isGhost?: boolean; // Hypothetical link
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SessionSnapshot {
  id: string; // unique ID for this stack frame
  label: string; // The name of the context (e.g., "Root" or Node Label)
  data: GraphData; // The graph state
  triggerNodeId?: string; // The ID of the node in THIS snapshot that leads to the NEXT session
}

// Mode System
export enum ExplorationMode {
  INNOVATION = 'INNOVATION',
  KNOWLEDGE = 'KNOWLEDGE'
}

export interface ModeConfig {
  id: ExplorationMode;
  name: string;
  description: string;
  nodeTypes: NodeType[];
  defaultRelations: string[];
  aiPersona: string;
  seedExamples: Array<{ label: string; type: NodeType; description: string }>;
}

// Node Types - Now mode-agnostic
export enum NodeType {
  // Universal types (used in both modes)
  CONCEPT = 'CONCEPT',
  ENTITY = 'ENTITY', // Person, Company, Place, Organization
  QUESTION = 'QUESTION',

  // Innovation Mode specific
  TECHNOLOGY = 'TECHNOLOGY',
  PROBLEM = 'PROBLEM',
  PAIN_POINT = 'PAIN_POINT',
  INNOVATION = 'INNOVATION',
  CONSTRAINT = 'CONSTRAINT',
  FRICTION = 'FRICTION',
  TRACE = 'TRACE',
  IMPLEMENTATION = 'IMPLEMENTATION', // Practical application, app, or product
  USER_SEGMENT = 'USER_SEGMENT', // Target audience, persona, or market segment
  ANALOGY = 'ANALOGY', // Cross-disciplinary analogy or inspiration
  REGULATION = 'REGULATION', // Legal, policy, or regulatory context
  MARKET = 'MARKET', // Economic drivers, market forces, or business models
  ETHICS = 'ETHICS', // Values, societal impact, or moral considerations
  MENTAL_MODEL = 'MENTAL_MODEL', // Underlying assumptions or paradigms being challenged

  // Knowledge Mode specific
  EVENT = 'EVENT', // Historical events, occurrences
  PERSON = 'PERSON', // Individuals
  PLACE = 'PLACE', // Locations, geography
  THEORY = 'THEORY', // Scientific theories, philosophies
  ARTIFACT = 'ARTIFACT', // Objects, documents, creations
  MOVEMENT = 'MOVEMENT', // Social, political, artistic movements
  DISCOVERY = 'DISCOVERY', // Scientific discoveries, findings
  RELATIONSHIP = 'RELATIONSHIP', // Connections between entities
  CONTRADICTION = 'CONTRADICTION', // Conflicting accounts, debates, or opposing theories
}

export interface AISuggestion {
  label: string;
  type: NodeType;
  description: string;
  relationToParent: string;
}

export interface DiscoveryState {
  isActive: boolean;
  activeNodeId: string | null;
  history: string[];
  isQuest?: boolean; // If true, discovery moves to the newly created node recursively
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  DEEPSEEK = 'DEEPSEEK'
}

export interface AISettings {
  provider: AIProvider;
  providers: Record<AIProvider, {
    apiKey: string;
    model: string;
  }>;
}

export interface SeedFile {
  id: string; // Filename (uuid)
  name: string; // User defined name
  lastModified: number;
  data: GraphData; // The core graph
  sessionStack: SessionSnapshot[]; // Navigation history
  viewport: { x: number, y: number, zoom: number }; // Camera state
  mode?: ExplorationMode; // The mode this seed was created in
}

// Chat System Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedNode?: AISuggestion; // Proactive seed suggestion
  suggestedNodes?: AISuggestion[]; // Support for multiple suggestions
  suggestedLinks?: Array<{ sourceLabel: string; targetLabel: string; relation: string }>;
  wasAssimilated?: boolean; // Flag to indicate if suggestions were already added to the graph
}

export interface ChatContext {
  activeNodeIds: string[]; // IDs of nodes currently being discussed
}