import { NodeType, ExplorationMode, ModeConfig } from './types';

// Mode Configurations
export const MODE_CONFIGS: Record<ExplorationMode, ModeConfig> = {
  [ExplorationMode.INNOVATION]: {
    id: ExplorationMode.INNOVATION,
    name: 'Innovation Mode',
    description: 'Explore technologies, problems, and breakthrough solutions',
    nodeTypes: [
      NodeType.CONCEPT,
      NodeType.TECHNOLOGY,
      NodeType.PROBLEM,
      NodeType.PAIN_POINT,
      NodeType.INNOVATION,
      NodeType.CONSTRAINT,
      NodeType.FRICTION,
      NodeType.ENTITY,
      NodeType.QUESTION,
      NodeType.TRACE,
      NodeType.IMPLEMENTATION,
      NodeType.USER_SEGMENT,
      NodeType.ANALOGY,
      NodeType.REGULATION,
      NodeType.MARKET,
      NodeType.ETHICS,
      NodeType.MENTAL_MODEL
    ],
    defaultRelations: [
      "solves",
      "addresses",
      "innovates",
      "enables",
      "leverages",
      "conflicts with",
      "blocks",
      "creates friction for",
      "is limited by",
      "imposes",
      "requires"
    ],
    aiPersona: "pragmatic product strategist, hands-on innovation architect, and systems-thinker who values clarity over jargon",
    seedExamples: [
      { label: 'The Modular Professional Network', type: NodeType.INNOVATION, description: 'A project-centric replacement for LinkedIn that focuses on verified artifacts and collaborative "proof of work" rather than static resumes and corporate titles.' },
      { label: 'Hyper-Local Community Newsletters', type: NodeType.MARKET, description: 'Monetization platform for neighborhood organizers and local micro-journalists to reclaim civic discourse from noisy social media groups.' },
      { label: 'AI-First Knowledge OS', type: NodeType.TECHNOLOGY, description: 'A desktop environment that treats every file, note, and email as a vector-searchable entity, proactively surfacing context based on your current active workspace.' },
      { label: 'Verticalized Circular Economy', type: NodeType.MARKET, description: 'Resale and logistics platform dedicated solely to high-value upcycling, handling "reverse shipping" for modular electronics and precision-refurbished goods.' },
      { label: 'Voice-to-Task Personal Daemon', type: NodeType.INNOVATION, description: 'A local-first ambient listener that identifies commitments made in conversations and automatically stages them as actionable tasks in your workflow tool.' },
      { label: 'Programmable Trust Protocols', type: NodeType.TECHNOLOGY, description: 'Automated escrow agreements for early-stage hiring that release payments based on verified milestones like GitHub commits or Figma approvals.' }
    ]
  },
  [ExplorationMode.KNOWLEDGE]: {
    id: ExplorationMode.KNOWLEDGE,
    name: 'Knowledge Discovery',
    description: 'Explore topics, events, people, and their interconnections',
    nodeTypes: [
      NodeType.CONCEPT,
      NodeType.EVENT,
      NodeType.PERSON,
      NodeType.PLACE,
      NodeType.THEORY,
      NodeType.ARTIFACT,
      NodeType.MOVEMENT,
      NodeType.DISCOVERY,
      NodeType.ENTITY,
      NodeType.QUESTION,
      NodeType.RELATIONSHIP,
      NodeType.CONTRADICTION
    ],
    defaultRelations: [
      "influenced",
      "led to",
      "occurred in",
      "created by",
      "part of",
      "related to",
      "caused",
      "inspired",
      "opposed",
      "succeeded",
      "discovered",
      "founded",
      "participated in",
      "resulted in",
      "contradicts",
      "debunked"
    ],
    aiPersona: "knowledge curator and educational guide",
    seedExamples: [
      { label: 'The Renaissance', type: NodeType.EVENT, description: 'A period of cultural, artistic, and intellectual rebirth in Europe from the 14th to 17th century.' },
      { label: 'Marie Curie', type: NodeType.PERSON, description: 'Polish-French physicist and chemist who conducted pioneering research on radioactivity.' },
      { label: 'The Theory of Evolution', type: NodeType.THEORY, description: 'Darwin\'s theory explaining how species change over time through natural selection.' },
      { label: 'Ancient Rome', type: NodeType.PLACE, description: 'The civilization that dominated the Mediterranean world from 8th century BC to 5th century AD.' },
      { label: 'The Printing Press', type: NodeType.ARTIFACT, description: 'Gutenberg\'s invention that revolutionized the spread of knowledge in the 15th century.' },
      { label: 'The Enlightenment', type: NodeType.MOVEMENT, description: 'An intellectual and philosophical movement emphasizing reason and individualism in 17th-18th century Europe.' }
    ]
  }
};

export const NODE_COLORS: Record<NodeType, string> = {
  // Universal types
  [NodeType.CONCEPT]: '#3b82f6', // Bright Blue
  [NodeType.ENTITY]: '#6366f1', // Indigo
  [NodeType.QUESTION]: '#22d3ee', // Cyan

  // Innovation Mode
  [NodeType.TECHNOLOGY]: '#10b981', // Emerald
  [NodeType.PROBLEM]: '#ef4444', // Red
  [NodeType.PAIN_POINT]: '#f43f5e', // Rose
  [NodeType.INNOVATION]: '#8b5cf6', // Violet
  [NodeType.CONSTRAINT]: '#facc15', // Yellow (Obstacle)
  [NodeType.FRICTION]: '#fb923c', // Orange (Resistance)
  [NodeType.TRACE]: '#d946ef', // Fuchsia

  // Knowledge Mode
  [NodeType.EVENT]: '#f59e0b', // Amber
  [NodeType.PERSON]: '#ec4899', // Pink
  [NodeType.PLACE]: '#14b8a6', // Teal
  [NodeType.THEORY]: '#a855f7', // Purple
  [NodeType.ARTIFACT]: '#84cc16', // Lime
  [NodeType.MOVEMENT]: '#f97316', // Orange
  [NodeType.DISCOVERY]: '#06b6d4', // Cyan
  [NodeType.RELATIONSHIP]: '#8b5cf6', // Violet
  [NodeType.CONTRADICTION]: '#ef4444', // Red (Debate)
  [NodeType.IMPLEMENTATION]: '#22c55e', // Green (Practical)
  [NodeType.USER_SEGMENT]: '#f97316', // Orange (Active Person)
  [NodeType.ANALOGY]: '#f472b6', // Pink (Cross-pollination)
  [NodeType.REGULATION]: '#64748b', // Slate (Governance)
  [NodeType.MARKET]: '#eab308', // Gold (Economic)
  [NodeType.ETHICS]: '#2dd4bf', // Teal (Values)
  [NodeType.MENTAL_MODEL]: '#a78bfa', // Lavender (Paradigm)
};

// SVG Paths (based on 24x24 viewbox)
export const NODE_ICONS: Record<NodeType, string> = {
  // Universal
  [NodeType.CONCEPT]: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
  [NodeType.ENTITY]: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  [NodeType.QUESTION]: "M15.07 11.25l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z M12 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",

  // Innovation Mode
  [NodeType.TECHNOLOGY]: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  [NodeType.PROBLEM]: "M12 2C11.45 2 11 2.45 11 3V13C11 13.55 11.45 14 12 14C12.55 14 13 13.55 13 13V3C13 2.45 12.55 2 12 2ZM12 16C11.45 16 11 16.45 11 17C11 17.55 11.45 18 12 18C12.55 18 13 17.55 13 17C13 16.45 12.55 16 12 16Z",
  [NodeType.PAIN_POINT]: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  [NodeType.INNOVATION]: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  [NodeType.CONSTRAINT]: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z",
  [NodeType.FRICTION]: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z",
  [NodeType.TRACE]: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",

  // Knowledge Mode
  [NodeType.EVENT]: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z",
  [NodeType.PERSON]: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  [NodeType.PLACE]: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  [NodeType.THEORY]: "M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z",
  [NodeType.ARTIFACT]: "M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z",
  [NodeType.MOVEMENT]: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  [NodeType.DISCOVERY]: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  [NodeType.RELATIONSHIP]: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  [NodeType.CONTRADICTION]: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  [NodeType.IMPLEMENTATION]: "M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a.99.99 0 0 1-.94 0l-7.9-4.44A.993.993 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44a.99.99 0 0 1 .94 0l7.9 4.44c.32.17.53.5.53.88v9z M12 12l8.73-4.91 M12 12v9.7 M12 12L3.27 7.09",
  [NodeType.USER_SEGMENT]: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  [NodeType.ANALOGY]: "M18 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V6C20 4.9 19.1 4 18 4ZM18 18H6V6H18V18ZM8 17H16V15H8V17ZM8 13H16V11H8V13ZM8 9H16V7H8V9Z",
  [NodeType.REGULATION]: "M12 2L1 21H23L12 2ZM12 6L19.53 19H4.47L12 6ZM11 10V14H13V10H11ZM11 16V18H13V16H11Z",
  [NodeType.MARKET]: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  [NodeType.ETHICS]: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  [NodeType.MENTAL_MODEL]: "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z",
};

export const EXPANSION_BLUEPRINTS_INNOVATION = [
  {
    label: "What technology enables this?",
    relation: "leverages",
    targetType: NodeType.TECHNOLOGY,
    sourceTypes: [NodeType.CONCEPT, NodeType.INNOVATION, NodeType.PROBLEM, NodeType.PAIN_POINT]
  },
  {
    label: "What problem does this solve?",
    relation: "solves",
    targetType: NodeType.PROBLEM,
    sourceTypes: [NodeType.TECHNOLOGY, NodeType.INNOVATION, NodeType.CONCEPT]
  },
  {
    label: "What is the core technical challenge?",
    relation: "addresses",
    targetType: NodeType.PROBLEM,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY]
  },
  {
    label: "What is a critical question here?",
    relation: "questions",
    targetType: NodeType.QUESTION,
    sourceTypes: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.INNOVATION, NodeType.CONSTRAINT, NodeType.FRICTION, NodeType.ENTITY, NodeType.QUESTION, NodeType.TRACE]
  },
  {
    label: "What is a potential innovation?",
    relation: "enables",
    targetType: NodeType.INNOVATION,
    sourceTypes: [NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.TECHNOLOGY, NodeType.CONCEPT, NodeType.FRICTION, NodeType.CONSTRAINT]
  },
  {
    label: "What creates systemic friction?",
    relation: "is limited by",
    targetType: NodeType.FRICTION,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.CONCEPT]
  },
  {
    label: "What is the primary user pain point?",
    relation: "causes",
    targetType: NodeType.PAIN_POINT,
    sourceTypes: [NodeType.PROBLEM, NodeType.FRICTION, NodeType.CONSTRAINT]
  },
  {
    label: "What is a physical or legal constraint?",
    relation: "constrained by",
    targetType: NodeType.CONSTRAINT,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.CONCEPT, NodeType.PROBLEM]
  },
  {
    label: "Who are the key industry entities?",
    relation: "involves",
    targetType: NodeType.ENTITY,
    sourceTypes: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.INNOVATION, NodeType.CONSTRAINT, NodeType.FRICTION, NodeType.ENTITY, NodeType.QUESTION, NodeType.TRACE]
  },
  {
    label: "What would the app/product look like?",
    relation: "implemented as",
    targetType: NodeType.IMPLEMENTATION,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.CONCEPT]
  },
  {
    label: "Who is the target user segment?",
    relation: "targets",
    targetType: NodeType.USER_SEGMENT,
    sourceTypes: [NodeType.IMPLEMENTATION, NodeType.INNOVATION, NodeType.PAIN_POINT, NodeType.PROBLEM]
  },
  {
    label: "What is a cross-disciplinary analogy?",
    relation: "analogy of",
    targetType: NodeType.ANALOGY,
    sourceTypes: [NodeType.CONCEPT, NodeType.TECHNOLOGY, NodeType.INNOVATION]
  },
  {
    label: "Are there regulatory or policy hurdles?",
    relation: "impacted by",
    targetType: NodeType.REGULATION,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.IMPLEMENTATION]
  },
  {
    label: "What is the economic/market driver?",
    relation: "driven by",
    targetType: NodeType.MARKET,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.PROBLEM]
  },
  {
    label: "What are the ethical or social implications?",
    relation: "concerns",
    targetType: NodeType.ETHICS,
    sourceTypes: [NodeType.INNOVATION, NodeType.TECHNOLOGY, NodeType.USER_SEGMENT]
  },
  {
    label: "What underlying mental model is being challenged?",
    relation: "challenges",
    targetType: NodeType.MENTAL_MODEL,
    sourceTypes: [NodeType.INNOVATION, NodeType.CONCEPT, NodeType.TECHNOLOGY]
  }
];

export const EXPANSION_BLUEPRINTS_KNOWLEDGE = [
  {
    label: "What historical events are related?",
    relation: "led to",
    targetType: NodeType.EVENT,
    sourceTypes: [NodeType.CONCEPT, NodeType.EVENT, NodeType.PERSON, NodeType.PLACE, NodeType.MOVEMENT]
  },
  {
    label: "Who were the key people involved?",
    relation: "participated in",
    targetType: NodeType.PERSON,
    sourceTypes: [NodeType.EVENT, NodeType.MOVEMENT, NodeType.DISCOVERY, NodeType.ARTIFACT, NodeType.THEORY]
  },
  {
    label: "Where did this take place?",
    relation: "occurred in",
    targetType: NodeType.PLACE,
    sourceTypes: [NodeType.EVENT, NodeType.PERSON, NodeType.MOVEMENT, NodeType.DISCOVERY]
  },
  {
    label: "What theories or ideas emerged?",
    relation: "inspired",
    targetType: NodeType.THEORY,
    sourceTypes: [NodeType.CONCEPT, NodeType.EVENT, NodeType.PERSON, NodeType.DISCOVERY, NodeType.MOVEMENT]
  },
  {
    label: "What artifacts or creations resulted?",
    relation: "created",
    targetType: NodeType.ARTIFACT,
    sourceTypes: [NodeType.PERSON, NodeType.EVENT, NodeType.MOVEMENT, NodeType.THEORY]
  },
  {
    label: "What movements or trends emerged?",
    relation: "part of",
    targetType: NodeType.MOVEMENT,
    sourceTypes: [NodeType.EVENT, NodeType.PERSON, NodeType.THEORY, NodeType.ARTIFACT]
  },
  {
    label: "What discoveries were made?",
    relation: "discovered",
    targetType: NodeType.DISCOVERY,
    sourceTypes: [NodeType.PERSON, NodeType.EVENT, NodeType.THEORY, NodeType.PLACE]
  },
  {
    label: "What relationships exist?",
    relation: "related to",
    targetType: NodeType.RELATIONSHIP,
    sourceTypes: [NodeType.CONCEPT, NodeType.EVENT, NodeType.PERSON, NodeType.PLACE, NodeType.THEORY, NodeType.ARTIFACT, NodeType.MOVEMENT, NodeType.DISCOVERY, NodeType.ENTITY, NodeType.QUESTION, NodeType.RELATIONSHIP]
  },
  {
    label: "What questions arise?",
    relation: "questions",
    targetType: NodeType.QUESTION,
    sourceTypes: [NodeType.CONCEPT, NodeType.EVENT, NodeType.PERSON, NodeType.PLACE, NodeType.THEORY, NodeType.ARTIFACT, NodeType.MOVEMENT, NodeType.DISCOVERY, NodeType.ENTITY, NodeType.QUESTION, NodeType.RELATIONSHIP, NodeType.CONTRADICTION]
  },
  {
    label: "What is the counter-narrative?",
    relation: "contradicts",
    targetType: NodeType.CONTRADICTION,
    sourceTypes: [NodeType.THEORY, NodeType.EVENT, NodeType.MOVEMENT, NodeType.PERSON]
  },
];

export const INITIAL_DATA = {
  nodes: [],
  links: []
};

// Helper to get mode-specific configurations
export function getModeConfig(mode: ExplorationMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

export function getExpansionBlueprints(mode: ExplorationMode) {
  return mode === ExplorationMode.INNOVATION
    ? EXPANSION_BLUEPRINTS_INNOVATION
    : EXPANSION_BLUEPRINTS_KNOWLEDGE;
}

export function getRelationOptions(mode: ExplorationMode): string[] {
  return MODE_CONFIGS[mode].defaultRelations;
}

export function getSeedExamples(mode: ExplorationMode) {
  return MODE_CONFIGS[mode].seedExamples;
}