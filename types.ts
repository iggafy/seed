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
  // D3 optional properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string; // e.g., "enables", "conflicts", "depends"
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

export enum NodeType {
  CONCEPT = 'CONCEPT',
  TECHNOLOGY = 'TECHNOLOGY',
  PROBLEM = 'PROBLEM',
  ENTITY = 'ENTITY', // Person, Company, etc.
  QUESTION = 'QUESTION',
  TRACE = 'TRACE' // New Analysis Node
}

export interface AISuggestion {
  label: string;
  type: NodeType;
  description: string;
  relationToParent: string;
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  DEEPSEEK = 'DEEPSEEK'
}

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface SeedFile {
  id: string; // Filename (uuid)
  name: string; // User defined name
  lastModified: number;
  data: GraphData; // The core graph
  sessionStack: SessionSnapshot[]; // Navigation history
  viewport: { x: number, y: number, zoom: number }; // Camera state
}