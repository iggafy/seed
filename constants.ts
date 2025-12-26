import { NodeType } from './types';

export const NODE_COLORS: Record<NodeType, string> = {
  [NodeType.CONCEPT]: '#3b82f6', // Bright Blue
  [NodeType.TECHNOLOGY]: '#10b981', // Emerald
  [NodeType.PROBLEM]: '#ef4444', // Red
  [NodeType.PAIN_POINT]: '#f43f5e', // Rose
  [NodeType.INNOVATION]: '#8b5cf6', // Violet
  [NodeType.CONSTRAINT]: '#facc15', // Yellow (Obstacle)
  [NodeType.FRICTION]: '#fb923c', // Orange (Resistance)
  [NodeType.ENTITY]: '#6366f1', // Indigo
  [NodeType.QUESTION]: '#22d3ee', // Cyan
  [NodeType.TRACE]: '#d946ef', // Fuchsia
};

// SVG Paths (based on 24x24 viewbox)
export const NODE_ICONS: Record<NodeType, string> = {
  [NodeType.CONCEPT]: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
  [NodeType.TECHNOLOGY]: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  [NodeType.PROBLEM]: "M12 2C11.45 2 11 2.45 11 3V13C11 13.55 11.45 14 12 14C12.55 14 13 13.55 13 13V3C13 2.45 12.55 2 12 2ZM12 16C11.45 16 11 16.45 11 17C11 17.55 11.45 18 12 18C12.55 18 13 17.55 13 17C13 16.45 12.55 16 12 16Z",
  [NodeType.PAIN_POINT]: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  [NodeType.INNOVATION]: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  [NodeType.CONSTRAINT]: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z",
  [NodeType.FRICTION]: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z",
  [NodeType.ENTITY]: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  [NodeType.QUESTION]: "M15.07 11.25l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z M12 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  [NodeType.TRACE]: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
};

export const NOVEL_SEEDS = [
  { label: 'Unused Cloud GPU Oversubscription', type: NodeType.PAIN_POINT, description: 'Enterprises pay for reserved GPU instances that sit idle 60% of the time, while startups can\'t access compute.' },
  { label: 'Fragmented Clinical Trial Data', type: NodeType.PROBLEM, description: 'Medical research is slowed down by siloed, non-interoperable patient records across different hospitals.' },
  { label: 'E-commerce Return Logistics Waste', type: NodeType.PAIN_POINT, description: 'The massive environmental and financial cost of processing returns in fast fashion.' },
  { label: 'Knowledge Silos in Remote Engineering', type: NodeType.PROBLEM, description: 'Senior engineers carry crucial architectural context that is never documented, causing friction in remote teams.' },
  { label: 'Deepfake Verification at Scale', type: NodeType.QUESTION, description: 'How can we trust video evidence when generative AI can produce perfect fakes in real-time?' },
  { label: 'Micro-SaaS Integration Fatigue', type: NodeType.PAIN_POINT, description: 'Users are overwhelmed by having 50+ different subscriptions that don\'t talk to each other.' }
];

export const RELATION_OPTIONS = [
  "solves",
  "addresses",
  "innovates",
  "questions",
  "answers",
  "enables",
  "integrates with",
  "leverages",
  "conflicts with",
  "blocks",
  "creates friction for",
  "is limited by",
  "imposes",
  "requires",
  "explores"
];

export const EXPANSION_BLUEPRINTS = [
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
    sourceTypes: Object.values(NodeType)
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
    sourceTypes: Object.values(NodeType)
  },
];

export const INITIAL_DATA = {
  nodes: [],
  links: []
};