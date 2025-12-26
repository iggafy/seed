import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DiscoveryState, GraphData, GraphNode, NodeType, SessionSnapshot, AISettings, AIProvider, SeedFile } from './types';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import SettingsModal from './components/SettingsModal';
import SeedsDashboard from './components/SeedsDashboard';
import { INITIAL_DATA, NOVEL_SEEDS, NODE_ICONS, NODE_COLORS, RELATION_OPTIONS, EXPANSION_BLUEPRINTS } from './constants';
import { expandConcept, expandConceptTargeted, generateSynergyNode, generateRandomSeedNode, generateInnovationOpportunity, solveProblem, answerQuestion, performDiscoveryPulse, traceLineageAnalysis } from './services/aiService';
import { Share2, PlusCircle, Sparkles, Eye, EyeOff, GitBranch, Zap, MessageCircle, X, Trash2, Layers, ChevronRight, Home, GitMerge, Loader2, Search, CheckCircle2, MoreHorizontal, Minimize2, Cpu, AlertCircle, Heart, BrainCircuit, Info, Lightbulb, MousePointerClick } from 'lucide-react';

// Utility to generate UUIDs locally
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [data, setData] = useState<GraphData>(JSON.parse(JSON.stringify(INITIAL_DATA)));
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSeed, setIsGeneratingSeed] = useState(false);

  // Session / Nested View State
  const [sessionStack, setSessionStack] = useState<SessionSnapshot[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('root'); // Used to force-reset canvas
  const [currentSessionName, setCurrentSessionName] = useState<string>('Root');

  // Persistence State
  const [currentSeedFileId, setCurrentSeedFileId] = useState<string | undefined>(undefined);
  const [showDashboard, setShowDashboard] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Filtering & Info
  const [hiddenTypes, setHiddenTypes] = useState<NodeType[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  // Context / Lineage Mode
  const [isContextMode, setIsContextMode] = useState(true);

  // Context Menu State (Right-click)
  const [contextMenuNode, setContextMenuNode] = useState<GraphNode | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // AI Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: AIProvider.GEMINI,
    apiKey: process.env.VITE_GEMINI_API_KEY || '',
    model: ''
  });

  // Discovery Mode State
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    isActive: false,
    activeNodeId: null,
    history: []
  });

  const [discardedLuckySeeds, setDiscardedLuckySeeds] = useState<string[]>([]);

  // Load Settings from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('seed_ai_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        setAiSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    localStorage.setItem('seed_ai_settings', JSON.stringify(newSettings));
    setNotification({ message: "Settings saved", type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const popError = (msg: string) => {
    setNotification({ message: msg, type: 'error' });
    setTimeout(() => setNotification(null), 6000);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const selectedNodes = data.nodes.filter(n => selectedNodeIds.includes(n.id));

      if (selectedNodes.length === 1) {
        const node = selectedNodes[0];

        // 'i' for Innovate
        if (e.key.toLowerCase() === 'i' && (node.type === NodeType.TECHNOLOGY || node.type === NodeType.INNOVATION)) {
          handleInnovateNode(node);
        }
        // 's' for Solve
        else if (e.key.toLowerCase() === 's' && (node.type === NodeType.PROBLEM || node.type === NodeType.PAIN_POINT)) {
          handleSolveProblem(node);
        }
        // 'a' for Answer
        else if (e.key.toLowerCase() === 'a' && node.type === NodeType.QUESTION) {
          handleAnswerQuestion(node);
        }
        // 'e' for Expand (Quick)
        else if (e.key.toLowerCase() === 'e') {
          handleExpandNode(node);
        }
      }

      // 'Delete' or 'Backspace' to delete selected nodes
      if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
        if (selectedNodeIds.length > 0) {
          if (confirm(`Delete ${selectedNodeIds.length} selected seed(s)?`)) {
            selectedNodeIds.forEach(id => handleDeleteNode(id));
            setSelectedNodeIds([]);
          }
        }
      }

      // 'Escape' to clear selection
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setContextMenuNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, data, aiSettings, isProcessing]); // Dependencies to ensure handlers have latest state

  // --- PERSISTENCE HANDLERS ---

  const handleSaveSeed = async () => {
    if (!currentSeedFileId) {
      // If no ID (unsaved new seed), verify with user or just save as new
      if (!window.confirm("Save this as a new Seed?")) return;
    }

    const id = currentSeedFileId || generateId();
    // Use first node label or custom name? Let's default to "Root Session" or specific node count
    const name = data.nodes.length > 0 ? data.nodes[0].label : "Empty Seed";

    // Electron renderer prompt() is often disabled.
    // For now, auto-name it. We can add a "Rename" feature in dashboard later.
    const finalName = name;

    const seedFile: SeedFile = {
      id: id,
      name: finalName,
      lastModified: Date.now(),
      data: data,
      sessionStack: sessionStack,
      viewport: { x: 0, y: 0, zoom: 1 } // TODO: Capture actual viewport from canvas if possible or ignore
    };

    // @ts-ignore
    const result = await window.api.db.saveSeed(seedFile);
    if (result.error) {
      console.error("Save failed:", result.error);
      alert(`Failed to save: ${result.error}`);
      return;
    }

    setCurrentSeedFileId(id);
    alert("Saved successfully!");
  };

  const handleLoadSeed = async (id: string) => {
    // @ts-ignore
    const seed: SeedFile = await window.api.db.loadSeed(id);
    if (seed) {
      // Ensure there's a root node for legacy seeds
      if (seed.data.nodes.length > 0 && !seed.data.nodes.some(n => n.isRoot)) {
        seed.data.nodes[0].isRoot = true;
      }
      setData(seed.data);
      setSessionStack(seed.sessionStack || []);
      setCurrentSeedFileId(seed.id);
      setCurrentSessionId(generateId()); // Force re-render
      if (seed.sessionStack && seed.sessionStack.length > 0) {
        // Restore deep session name
        // Logic to find current label... simplified:
        setCurrentSessionName("Restored Session");
      } else {
        setCurrentSessionName("Root");
      }
      setShowDashboard(false);
    }
  };

  const handleNewSeed = () => {
    if (confirm("Start a new empty Seed? Unsaved changes will be lost.")) {
      setData({ nodes: [], links: [] });
      setSessionStack([]);
      setCurrentSeedFileId(undefined);
      setCurrentSessionId('root');
      setCurrentSessionName('Root');
      setShowDashboard(false);
      setDiscardedLuckySeeds([]); // Reset AI memory for new session
    }
  };

  // Handling Adding Manual Nodes
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [addingNodeParent, setAddingNodeParent] = useState<GraphNode | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeDescription, setNewNodeDescription] = useState("");
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.CONCEPT);
  const [newNodeRelation, setNewNodeRelation] = useState(RELATION_OPTIONS[0]);

  // --- DISCOVERY AGENT LOOP ---
  const isActiveRef = useRef(discoveryState.isActive);
  const dataRef = useRef(data);
  const settingsRef = useRef(aiSettings);

  useEffect(() => { isActiveRef.current = discoveryState.isActive; }, [discoveryState.isActive]);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { settingsRef.current = aiSettings; }, [aiSettings]);

  useEffect(() => {
    if (!discoveryState.isActive) return;

    let timer: any;
    const runPulse = async () => {
      // LOYAL STOP: Exit immediately if inactive
      if (!isActiveRef.current) return;

      const currentNodes = dataRef.current.nodes.filter(n => !n.isGhost);
      if (currentNodes.length === 0) return;

      const target = currentNodes[Math.floor(Math.random() * currentNodes.length)];
      setDiscoveryState(prev => ({ ...prev, activeNodeId: target.id }));

      const nodesString = dataRef.current.nodes.map(n => `- ${n.label} (${n.type})`).join('\n');
      const linksString = dataRef.current.links.map(l => {
        const sourceLabel = dataRef.current.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as any).id : l.source))?.label;
        const targetLabel = dataRef.current.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as any).id : l.target))?.label;
        return `- ${sourceLabel} --[${l.relation}]--> ${targetLabel}`;
      }).join('\n');
      const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;

      try {
        // AI Thinking delay simulation
        await new Promise(r => setTimeout(r, 2000));

        // LOYAL STOP: Check again before AI call
        if (!isActiveRef.current) return;

        const suggestion = await performDiscoveryPulse(settingsRef.current, fullGraphContext, dataRef.current.nodes);

        // LOYAL STOP: Discard result if user clicked stop while AI was thinking
        if (suggestion && isActiveRef.current) {
          const newNodeId = generateId();
          const newNode: GraphNode = {
            id: newNodeId,
            label: suggestion.label,
            type: suggestion.type,
            description: suggestion.description,
            isGhost: true,
            isNew: true,
            x: (target.x || 0) + (Math.random() - 0.5) * 300,
            y: (target.y || 0) + (Math.random() - 0.5) * 300
          };

          const newLink = {
            source: target.id,
            target: newNodeId,
            relation: suggestion.relationToParent || "hypothesized",
            isGhost: true
          };

          setData(prev => ({
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, newLink]
          }));

          setDiscoveryState(prev => ({
            ...prev,
            history: [`Discovered: ${suggestion.label} (${suggestion.type})`, ...prev.history].slice(0, 10)
          }));
        }
      } catch (e) {
        console.error("Discovery Pulse Error:", e);
      } finally {
        setDiscoveryState(prev => ({ ...prev, activeNodeId: null }));
        if (isActiveRef.current) {
          timer = setTimeout(runPulse, 6000);
        }
      }
    };

    timer = setTimeout(runPulse, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [discoveryState.isActive]);

  const handleAssimilateNode = (nodeId: string) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, isGhost: false, isNew: false } : n),
      links: prev.links.map(l => {
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return targetId === nodeId ? { ...l, isGhost: false } : l;
      })
    }));
  };

  const handlePruneNode = (nodeId: string) => {
    setData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      links: prev.links.filter(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return s !== nodeId && t !== nodeId;
      })
    }));
  };

  // Helpers
  const getSelectedNodes = () => {
    return data.nodes.filter(n => selectedNodeIds.includes(n.id));
  };

  const handleNodeClick = useCallback((node: GraphNode | null, isMultiSelect: boolean) => {
    setContextMenuNode(null); // Close context menu on any interaction

    if (!node) {
      // Clicked background
      setSelectedNodeIds([]);
      return;
    }

    setSelectedNodeIds(prev => {
      if (isMultiSelect) {
        // Toggle
        if (prev.includes(node.id)) {
          return prev.filter(id => id !== node.id);
        } else {
          return [...prev, node.id];
        }
      } else {
        // Single select
        return [node.id];
      }
    });
  }, []);

  const handleNodeContextMenu = useCallback((node: GraphNode | null, x: number, y: number) => {
    if (node) {
      setContextMenuNode(node);
      setContextMenuPos({ x, y });
    } else {
      setContextMenuNode(null);
    }
  }, []);


  const handleCloseSidebar = () => {
    setSelectedNodeIds([]);
  };

  const handleEnterNestedSession = (node: GraphNode) => {
    // 1. Push current state to stack with the triggerNodeId
    const snapshot: SessionSnapshot = {
      id: currentSessionId,
      label: currentSessionName,
      data: JSON.parse(JSON.stringify(data)), // Deep copy current state
      triggerNodeId: node.id
    };

    setSessionStack(prev => [...prev, snapshot]);

    // 2. Prepare new session data
    let newSessionData: GraphData;

    if (node.subGraphData && node.subGraphData.nodes.length > 0) {
      // Resume existing session
      newSessionData = JSON.parse(JSON.stringify(node.subGraphData));
    } else {
      // Start new session with seed
      const seedNode: GraphNode = {
        ...node,
        x: 0,
        y: 0,
        fx: null,
        fy: null,
        subGraphData: undefined // Avoid recursion
      };
      newSessionData = {
        nodes: [seedNode],
        links: []
      };
    }

    // 3. Update State
    setCurrentSessionId(generateId());
    setCurrentSessionName(node.label);
    setData(newSessionData);

    // 4. Clear selections / UI
    setSelectedNodeIds([node.id]);
    setContextMenuNode(null);
  };

  // Logic to roll up changes from current session to parents
  const saveSessionUpwards = (
    currentLevelData: GraphData,
    stack: SessionSnapshot[],
    targetIndex: number
  ): SessionSnapshot[] => {
    // We need to propagate changes from the active session back up to the target index.
    // We start with current data, save it to the trigger node of the top-most snapshot,
    // then take that snapshot's data (now modified) and save it to the next one down, etc.

    let dataToSave = currentLevelData;

    // Iterate backwards from the top of the stack down to (but not including) the target snapshot
    // We are updating the snapshots IN PLACE in a copy of the stack
    const newStack = [...stack];

    for (let i = newStack.length - 1; i >= targetIndex; i--) {
      const snapshot = newStack[i];

      if (snapshot.triggerNodeId) {
        // Find the node in this snapshot that holds the subgraph
        const nodeIndex = snapshot.data.nodes.findIndex(n => n.id === snapshot.triggerNodeId);
        if (nodeIndex !== -1) {
          snapshot.data.nodes[nodeIndex].subGraphData = dataToSave;
        }
        // The data of THIS snapshot becomes the dataToSave for the next level up (which is index i-1)
        dataToSave = snapshot.data;
      }
    }

    return newStack;
  };

  const handleNavigateToSession = (index: number) => {
    if (index < 0 || index >= sessionStack.length) {
      return;
    }

    // 1. Save current state upwards
    const updatedStack = saveSessionUpwards(data, sessionStack, index);

    // 2. The target snapshot is now updated in our temp stack
    const targetSnapshot = updatedStack[index];

    // 3. Update the real stack to be everything UP TO index (exclusive of target's future)
    const newStack = updatedStack.slice(0, index);
    setSessionStack(newStack);

    // 4. Restore state
    setData(targetSnapshot.data);
    setCurrentSessionId(targetSnapshot.id);
    setCurrentSessionName(targetSnapshot.label);

    setSelectedNodeIds([]);
  };

  const handleNavigateRoot = () => {
    if (sessionStack.length === 0) return;

    // Save all the way to root (index 0)
    const updatedStack = saveSessionUpwards(data, sessionStack, 0);
    const root = updatedStack[0];

    setData(root.data);
    setCurrentSessionId(root.id);
    setCurrentSessionName(root.label);
    setSessionStack([]);
    setSelectedNodeIds([]);
  };

  // --- LINEAGE TRACING HELPER ---
  const getNodeLineage = (targetNodeId: string): string => {
    let lineage: string[] = [];
    let currentId = targetNodeId;
    let depth = 0;
    const maxDepth = 4; // Slightly deeper trace for analysis

    while (depth < maxDepth) {
      // Find link where target is currentId
      const link = data.links.find(l => {
        const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return tId === currentId;
      });

      if (!link) break;

      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const sourceNode = data.nodes.find(n => n.id === sourceId);

      if (!sourceNode) break;

      lineage.unshift(sourceNode.label);
      currentId = sourceId;
      depth++;
    }

    return lineage.join(" -> ");
  };


  const handleExpandNode = async (node: GraphNode) => {
    setIsProcessing(true);

    let contextString = undefined;
    if (isContextMode) {
      const ancestry = getNodeLineage(node.id);
      contextString = ancestry ? `${ancestry} -> ${node.label}` : node.label;
    }

    try {
      const suggestions = await expandConcept(aiSettings, node.label, node.description || "", contextString);

      if (suggestions.length > 0) {
        setData(prevData => {
          const newNodes: GraphNode[] = suggestions.map(s => ({
            id: generateId(),
            label: s.label,
            type: s.type,
            description: s.description,
            x: (node.x || 0) + (Math.random() - 0.5) * 100,
            y: (node.y || 0) + (Math.random() - 0.5) * 100
          }));

          const newLinks = newNodes.map((n, index) => ({
            source: node.id,
            target: n.id,
            relation: suggestions[index].relationToParent
          }));

          return {
            nodes: [...prevData.nodes, ...newNodes],
            links: [...prevData.links, ...newLinks]
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Expansion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpandNodeSingle = async (node: GraphNode, relation: string, count: number = 1) => {
    setIsProcessing(true);

    let contextString = undefined;
    if (isContextMode) {
      const ancestry = getNodeLineage(node.id);
      contextString = ancestry ? `${ancestry} -> ${node.label}` : node.label;
    }

    try {
      const suggestions = await expandConceptTargeted(aiSettings, node.label, node.description || "", relation, count, contextString);

      if (suggestions && suggestions.length > 0) {
        setData(prevData => {
          const newNodes = suggestions.map(suggestion => ({
            id: generateId(),
            label: suggestion.label,
            type: suggestion.type,
            description: suggestion.description,
            x: (node.x || 0) + (Math.random() - 0.5) * 100,
            y: (node.y || 0) + (Math.random() - 0.5) * 100
          }));

          const newLinks = newNodes.map((newNode, index) => ({
            source: node.id,
            target: newNode.id,
            relation: suggestions[index].relationToParent
          }));

          return {
            nodes: [...prevData.nodes, ...newNodes],
            links: [...prevData.links, ...newLinks]
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Targeted expansion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTraceLineage = async (node: GraphNode) => {
    setIsProcessing(true);
    const ancestry = getNodeLineage(node.id);
    const fullPath = ancestry ? `${ancestry} -> ${node.label}` : node.label;

    try {
      const analysis = await traceLineageAnalysis(aiSettings, node.label, node.description || "", fullPath);

      if (analysis) {
        const newNodeId = generateId();
        const newNode: GraphNode = {
          id: newNodeId,
          label: analysis.label,
          type: analysis.type,
          description: analysis.description,
          x: (node.x || 0) + 50,
          y: (node.y || 0) + 50
        };

        const newLink = { source: node.id, target: newNodeId, relation: "analyzed by" };

        setData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, newLink]
        }));

        setSelectedNodeIds([newNodeId]);
      }
    } catch (e: any) {
      popError(e.message || "Lineage analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInnovateNode = async (node: GraphNode) => {
    setIsProcessing(true);

    // 1. Prepare Full Graph Context
    const nodesString = data.nodes.map(n => `- ${n.label} (Type: ${n.type}): ${n.description}`).join('\n');
    const linksString = data.links.map(l => {
      const source = data.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source))?.label;
      const target = data.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target))?.label;
      return `- ${source} --[${l.relation}]--> ${target}`;
    }).join('\n');

    const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;

    try {
      const innovation = await generateInnovationOpportunity(
        aiSettings,
        node.label,
        node.description || "",
        node.type,
        fullGraphContext
      );

      if (innovation) {
        const newNodeId = generateId();
        const newNode: GraphNode = {
          id: newNodeId,
          label: innovation.label,
          type: innovation.type,
          description: innovation.description,
          x: (node.x || 0) + 120, // Slightly further away for distinction
          y: (node.y || 0) + 120
        };

        const newLink = { source: node.id, target: newNodeId, relation: "facilitates" };

        setData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, newLink]
        }));

        setSelectedNodeIds([newNodeId]);
      }
    } catch (e: any) {
      popError(e.message || "Innovation request failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSolveProblem = async (node: GraphNode) => {
    setIsProcessing(true);

    const nodesString = data.nodes.map(n => `- ${n.label} (Type: ${n.type}): ${n.description}`).join('\n');
    const linksString = data.links.map(l => {
      const source = data.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source))?.label;
      const target = data.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target))?.label;
      return `- ${source} --[${l.relation}]--> ${target}`;
    }).join('\n');

    const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;

    try {
      const solution = await solveProblem(
        aiSettings,
        node.label,
        node.description || "",
        node.type,
        fullGraphContext
      );

      if (solution) {
        const newNodeId = generateId();
        const newNode: GraphNode = {
          id: newNodeId,
          label: solution.label,
          type: solution.type,
          description: solution.description,
          x: (node.x || 0) + 120,
          y: (node.y || 0) + 120
        };

        const newLink = { source: node.id, target: newNodeId, relation: "solved by" };

        setData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, newLink]
        }));

        setSelectedNodeIds([newNodeId]);
      }
    } catch (e: any) {
      popError(e.message || "Problem solving failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerQuestion = async (node: GraphNode) => {
    setIsProcessing(true);

    const nodesString = data.nodes.map(n => `- ${n.label} (Type: ${n.type}): ${n.description}`).join('\n');
    const linksString = data.links.map(l => {
      const source = data.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source))?.label;
      const target = data.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target))?.label;
      return `- ${source} --[${l.relation}]--> ${target}`;
    }).join('\n');

    const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;

    try {
      const answer = await answerQuestion(
        aiSettings,
        node.label,
        node.description || "",
        node.type,
        fullGraphContext
      );

      if (answer) {
        const newNodeId = generateId();
        const newNode: GraphNode = {
          id: newNodeId,
          label: answer.label,
          type: answer.type,
          description: answer.description,
          x: (node.x || 0) + 120,
          y: (node.y || 0) + 120
        };

        const newLink = { source: node.id, target: newNodeId, relation: "answered by" };

        setData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, newLink]
        }));

        setSelectedNodeIds([newNodeId]);
      }
    } catch (e: any) {
      popError(e.message || "Answer request failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeSynergy = async (nodeA: GraphNode, nodeB: GraphNode) => {
    setIsProcessing(true);

    let contextA = undefined;
    let contextB = undefined;
    if (isContextMode) {
      contextA = getNodeLineage(nodeA.id);
      contextB = getNodeLineage(nodeB.id);
    }

    const suggestion = await generateSynergyNode(
      aiSettings,
      nodeA.label, nodeA.description || "",
      nodeB.label, nodeB.description || "",
      contextA, contextB
    );

    if (suggestion) {
      const newNodeId = generateId();
      const newNode: GraphNode = {
        id: newNodeId,
        label: suggestion.label,
        type: suggestion.type,
        description: suggestion.description,
        x: ((nodeA.x || 0) + (nodeB.x || 0)) / 2,
        y: ((nodeA.y || 0) + (nodeB.y || 0)) / 2
      };

      const linkA = { source: nodeA.id, target: newNodeId, relation: "contributes to" };
      const linkB = { source: nodeB.id, target: newNodeId, relation: "contributes to" };

      setData(prev => ({
        nodes: [...prev.nodes, newNode],
        links: [...prev.links, linkA, linkB]
      }));

      setSelectedNodeIds([newNodeId]);
    }
    setIsProcessing(false);
  };

  const handleConnectNodes = (nodeA: GraphNode, nodeB: GraphNode, relation: string) => {
    setData(prev => ({
      ...prev,
      links: [
        ...prev.links,
        {
          source: nodeA.id,
          target: nodeB.id,
          relation: relation
        }
      ]
    }));
  };

  const handleUpdateNode = (updatedNode: GraphNode) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setData(prev => {
      // Filter links connected to this node
      const newLinks = prev.links.filter(l => {
        // Handle both string IDs (initial) and object references (d3 processed)
        const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return sourceId !== nodeId && targetId !== nodeId;
      });

      return {
        nodes: prev.nodes.filter(n => n.id !== nodeId),
        links: newLinks
      };
    });
    // Remove from selection if present
    setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
  };


  const handleDeleteInternalSpace = (node: GraphNode) => {
    if (window.confirm(`Permanently eliminate internal space of "${node.label}"? All nodes and associations inside it and other nested internal spaces will be eliminated.`)) {
      setData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, subGraphData: undefined } : n)
      }));
      setContextMenuNode(null);
    }
  };

  // Helper for context menu delete to ensure event propagation is handled
  const handleDeleteFromContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (contextMenuNode) {
      if (window.confirm(`Permanently delete "${contextMenuNode.label}"?`)) {
        handleDeleteNode(contextMenuNode.id);
        setContextMenuNode(null);
      }
    }
  };

  const handleAddCustomNode = () => {
    setNewNodeType(NodeType.CONCEPT);
    setAddingNodeParent(null);
    setNewNodeLabel("");
    setNewNodeDescription("");
    setIsAddingNode(true);
  };

  const submitCustomNode = () => {
    if (!newNodeLabel.trim()) return;

    // Determine position
    let x = 0;
    let y = 0;

    if (addingNodeParent) {
      // Place near parent
      x = (addingNodeParent.x || 0) + (Math.random() - 0.5) * 120;
      y = (addingNodeParent.y || 0) + (Math.random() - 0.5) * 120;
    } else {
      // Place random spread
      x = (Math.random() - 0.5) * 100;
      y = (Math.random() - 0.5) * 100;
    }

    const newNode: GraphNode = {
      id: generateId(),
      label: newNodeLabel,
      type: newNodeType,
      description: newNodeDescription.trim() || "User defined node.",
      isRoot: data.nodes.length === 0,
      x,
      y
    };

    const newLink = addingNodeParent ? {
      source: addingNodeParent.id,
      target: newNode.id,
      relation: newNodeRelation
    } : null;

    setData(prev => ({
      nodes: [...prev.nodes, newNode],
      links: newLink ? [...prev.links, newLink] : prev.links
    }));

    setNewNodeLabel("");
    setNewNodeDescription("");
    setIsAddingNode(false);
    setAddingNodeParent(null);
    setSelectedNodeIds([newNode.id]);
  };

  const handleClearGraph = () => {
    if (data.nodes.length === 0) return;
    if (window.confirm("Start fresh? This will clear all nodes and connections from the graph.")) {
      setData({ nodes: [], links: [] });
      setSelectedNodeIds([]);
    }
  };

  const handleImFeelingLucky = async (isRetry: boolean = false) => {
    setIsGeneratingSeed(true);

    try {
      const entropy = Date.now().toString();
      const seed = await generateRandomSeedNode(aiSettings, entropy, isRetry ? discardedLuckySeeds : []);

      let nodeData;
      if (seed) {
        nodeData = seed;
      } else {
        nodeData = NOVEL_SEEDS[Math.floor(Math.random() * NOVEL_SEEDS.length)];
      }

      const newNode: GraphNode = {
        id: generateId(),
        label: nodeData.label,
        type: nodeData.type,
        description: nodeData.description,
        isRoot: true,
        isLuckyResult: true, // Tag for curation UI
        x: 0,
        y: 0
      };
      setData({ nodes: [newNode], links: [] });
      setSelectedNodeIds([newNode.id]);

    } catch (e: any) {
      popError(e.message || "Failed to generate seed");
    } finally {
      setIsGeneratingSeed(false);
    }
  };

  const handleKeepLucky = (nodeId: string) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, isLuckyResult: false } : n)
    }));
    setDiscardedLuckySeeds([]); // Reset cycle
  };

  const handleTryAgainLucky = (node: GraphNode) => {
    setDiscardedLuckySeeds(prev => [...prev, node.label]);
    handleImFeelingLucky(true); // Trigger retry with memory
  };

  const toggleFilter = (type: NodeType) => {
    setHiddenTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const renderBreadcrumbs = () => {
    // We treat the "middle stack" as everything in sessionStack excluding the Root (index 0).
    const middleStack = sessionStack.slice(1);
    const COLLAPSE_THRESHOLD = 3;

    // Render logic helper
    const renderItem = (session: SessionSnapshot, originalIndex: number) => (
      <div key={session.id} className="flex items-center gap-1">
        <ChevronRight size={14} className="text-slate-600" />
        <button
          onClick={() => handleNavigateToSession(originalIndex)}
          className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all truncate max-w-[120px] font-medium text-sm"
        >
          {session.label}
        </button>
      </div>
    );

    if (middleStack.length <= COLLAPSE_THRESHOLD) {
      return middleStack.map((session, i) => renderItem(session, i + 1));
    } else {
      // Deeply nested: Show Root > ... > Last 2 Ancestors > Current
      const itemsToShow = 2;
      const visibleItems = middleStack.slice(-itemsToShow);
      const firstVisibleIndex = 1 + (middleStack.length - itemsToShow);

      return (
        <>
          <div className="flex items-center gap-1">
            <ChevronRight size={14} className="text-slate-600" />
            <div className="px-2 py-1 text-slate-600 select-none flex items-center justify-center">
              <MoreHorizontal size={14} />
            </div>
          </div>
          {visibleItems.map((session, i) => renderItem(session, firstVisibleIndex + i))}
        </>
      );
    }
  };

  // Filter Data passed to Canvas
  const filteredNodes = data.nodes.filter(n => !hiddenTypes.includes(n.type));
  // Filter links if either source or target is hidden
  const filteredLinks = data.links.filter(l => {
    const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
    const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
    const sNode = data.nodes.find(n => n.id === sId);
    const tNode = data.nodes.find(n => n.id === tId);

    if (!sNode || !tNode) return false;
    return !hiddenTypes.includes(sNode.type) && !hiddenTypes.includes(tNode.type);
  });

  return (
    <div className="relative w-full h-full flex flex-col font-sans text-slate-200">
      {/* Header / Nav - Floating Glass Panel - Increased Z-Index */}
      <div className="absolute top-4 left-0 w-full pointer-events-none z-50 flex items-center justify-between px-6">
        <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl max-w-[80vw] overflow-hidden">

          {/* Main Logo & Breadcrumb Hybrid */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden">
              {/* Breadcrumbs */}
              {sessionStack.length === 0 ? (
                <div className="flex items-center gap-3 px-2">
                  <div className="bg-sky-500/20 p-2 rounded-lg border border-sky-500/30">
                    <Share2 className="text-sky-400" size={20} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white leading-none">SEED</h1>
                    <p className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold mt-1">Shared Exploration & Emergent Discovery</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm overflow-hidden whitespace-nowrap">
                  <button
                    onClick={handleNavigateRoot}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all group shrink-0"
                  >
                    <Home size={14} className="group-hover:text-sky-400" />
                    <span className="font-bold">Root</span>
                  </button>

                  {renderBreadcrumbs()}

                  <div className="flex items-center gap-1 shrink-0">
                    <ChevronRight size={14} className="text-slate-600" />
                    <div className="px-3 py-1.5 text-sky-400 font-bold bg-sky-900/20 border border-sky-500/20 rounded-lg flex items-center gap-2 shadow-inner">
                      <Layers size={14} />
                      <span>{currentSessionName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 relative">
        <GraphCanvas
          data={{ nodes: filteredNodes, links: filteredLinks }}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleEnterNestedSession}
          onNodeContextMenu={handleNodeContextMenu}
          selectedNodeIds={selectedNodeIds}
          sessionId={currentSessionId}
          activeDiscoveryNodeId={discoveryState.activeNodeId}
          layoutTrigger={layoutTrigger}
        />

        {/* Filter Menu Overlay */}
        {showFilterMenu && (
          <div className="absolute left-36 bottom-24 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-48 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seed Filters</span>
                <button onClick={() => setShowFilterMenu(false)}><X size={14} className="text-slate-500 hover:text-white" /></button>
              </div>
              <div className="space-y-1.5">
                {Object.values(NodeType).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${hiddenTypes.includes(type)
                      ? 'bg-slate-950/50 text-slate-600 border border-transparent'
                      : 'bg-slate-800/50 text-slate-200 border border-white/5 hover:bg-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${hiddenTypes.includes(type) ? 'bg-slate-700' : ''}`}
                        style={{ backgroundColor: hiddenTypes.includes(type) ? undefined : NODE_COLORS[type] }}
                      />
                      {type}
                    </div>
                    {hiddenTypes.includes(type) ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend / Info Overlay */}
        {showInfo && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
            <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">SEED</h2>
                  <p className="text-sky-400 text-sm font-semibold tracking-wider uppercase">Shared Exploration & Emergent Discovery</p>
                </div>
                <button onClick={() => setShowInfo(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4 border-b border-white/5 pb-2">Seed Ontology</h3>
                  <div className="space-y-3">
                    {Object.values(NodeType).map(type => (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: `${NODE_COLORS[type]}20`, border: `1px solid ${NODE_COLORS[type]}60` }}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }}></div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{type}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            {type === NodeType.CONCEPT && "Abstract ideas & theories"}
                            {type === NodeType.TECHNOLOGY && "Existing tools & platforms"}
                            {type === NodeType.PROBLEM && "Technical bottlenecks & risks"}
                            {type === NodeType.PAIN_POINT && "Real-world friction & needs"}
                            {type === NodeType.INNOVATION && "Breakthrough solutions"}
                            {type === NodeType.ENTITY && "People, companies, orgs"}
                            {type === NodeType.QUESTION && "Research inquiries & unknowns"}
                            {type === NodeType.TRACE && "Historical analysis path"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4 border-b border-white/5 pb-2">Interaction Guide</h3>
                    <ul className="space-y-3 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 bg-slate-800 p-1 rounded"><Sparkles size={12} className="text-sky-400" /></div>
                        <span><b>Right-click</b> any seed to access the AI menu (Expand, Trace, Deepen).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 bg-slate-800 p-1 rounded"><GitMerge size={12} className="text-violet-400" /></div>
                        <span><b>Shift-click</b> to select multiple seeds for synergy analysis.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 bg-slate-800 p-1 rounded"><Layers size={12} className="text-emerald-400" /></div>
                        <span><b>Double-click</b> or use context menu to <b>Seed In</b> and explore internal space.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 border-b border-white/5 pb-2">Power Shortcuts</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Innovate</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-violet-400 font-mono">I</kbd>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Solve Problem</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-emerald-400 font-mono">S</kbd>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Answer Question</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-amber-400 font-mono">A</kbd>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Quick Expand</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-sky-400 font-mono">E</kbd>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Delete Seed</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-red-400 font-mono">DEL</kbd>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                      <h4 className="text-xs font-bold text-white mb-2">About Context Mode</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        When <span className="text-violet-400">Context Lineage</span> is active, the AI is aware of the path you took to reach a node.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-6 border-t border-white/5 text-xs text-slate-600">
                v1.2.0 • Powered by Google Gemini 2.0 Flash • D3.js Force Engine
              </div>
            </div>
          </div>
        )}

        {contextMenuNode && (
          <div
            className="absolute z-50 animate-in fade-in zoom-in duration-200 origin-top-left"
            style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex flex-col bg-slate-950/90 backdrop-blur-3xl rounded-[28px] shadow-2xl border border-white/10 p-2 gap-1 w-[250px] overflow-hidden ring-1 ring-white/10 select-none">

              {/* Core Actions Group */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEnterNestedSession(contextMenuNode); }}
                  className="px-3 py-1.5 hover:bg-sky-500/20 rounded-xl text-slate-300 hover:text-sky-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Layers size={18} className="text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Seed In</span>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleTraceLineage(contextMenuNode); setContextMenuNode(null); }}
                  className="px-3 py-1.5 hover:bg-fuchsia-500/20 rounded-xl text-slate-300 hover:text-fuchsia-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Search size={18} className="text-fuchsia-500 group-hover:rotate-12 transition-transform shrink-0" />
                  <span>Analyze</span>
                </button>

                {(contextMenuNode.type === NodeType.TECHNOLOGY || contextMenuNode.type === NodeType.INNOVATION) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInnovateNode(contextMenuNode); setContextMenuNode(null); }}
                    className="px-3 py-1.5 hover:bg-violet-500/20 rounded-xl text-slate-300 hover:text-violet-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                  >
                    <Cpu size={18} className="text-violet-500 group-hover:animate-pulse shrink-0" />
                    <span>Innovate</span>
                  </button>
                )}

                {(contextMenuNode.type === NodeType.PROBLEM || contextMenuNode.type === NodeType.PAIN_POINT) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSolveProblem(contextMenuNode); setContextMenuNode(null); }}
                    className="px-3 py-1.5 hover:bg-emerald-500/20 rounded-xl text-slate-300 hover:text-emerald-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                  >
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span>Solve</span>
                  </button>
                )}

                {contextMenuNode.type === NodeType.QUESTION && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAnswerQuestion(contextMenuNode); setContextMenuNode(null); }}
                    className="px-3 py-1.5 hover:bg-amber-500/20 rounded-xl text-slate-300 hover:text-amber-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                  >
                    <Zap size={18} className="text-amber-500 shrink-0" />
                    <span>Answer</span>
                  </button>
                )}
              </div>

              <div className="h-px bg-white/5 mx-2 my-0.5"></div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingNodeParent(contextMenuNode);
                  setNewNodeType(NodeType.CONCEPT);
                  setNewNodeRelation("enables");
                  setNewNodeLabel("");
                  setNewNodeDescription("");
                  setIsAddingNode(true);
                  setContextMenuNode(null);
                }}
                className="px-3 py-2.5 hover:bg-white/5 rounded-2xl text-slate-300 hover:text-white transition-all flex items-center gap-3 text-xs font-semibold group"
              >
                <PlusCircle size={18} className="text-slate-400 group-hover:text-white" />
                <span>Add Custom...</span>
              </button>

              <div className="h-px bg-white/5 mx-2 my-0.5"></div>

              {/* Expanders Group */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNode(contextMenuNode); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-sky-500/10 rounded-xl text-sky-400 hover:text-sky-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Quick Expand</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, 'reveals problem', 1); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <AlertCircle size={16} />
                  <span>Identify Problem</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, 'triggers pain point', 1); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-rose-500/10 rounded-xl text-rose-400 hover:text-rose-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Heart size={16} />
                  <span>Identify Pain Point</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, 'leverages technology', 1); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-emerald-500/10 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Cpu size={16} />
                  <span>Explore Tech</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, 'questions', 1); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-amber-500/10 rounded-xl text-amber-400 hover:text-amber-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <MessageCircle size={16} />
                  <span>Ask Question</span>
                </button>
              </div>

              <div className="h-px bg-white/5 mx-2 my-0.5"></div>

              {/* Utility Footer */}
              <div className="flex flex-col gap-0.5">
                {contextMenuNode.isGhost && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAssimilateNode(contextMenuNode.id); setContextMenuNode(null); }}
                    className="px-3 py-2 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition-all flex items-center gap-3 text-xs font-bold"
                  >
                    <CheckCircle2 size={16} />
                    <span>Assimilate</span>
                  </button>
                )}
                {contextMenuNode.subGraphData && contextMenuNode.subGraphData.nodes.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteInternalSpace(contextMenuNode); }}
                    className="px-3 py-2 hover:bg-amber-500/20 rounded-xl text-amber-500 transition-all flex items-center gap-3 text-xs font-bold"
                  >
                    <Minimize2 size={16} />
                    <span>Seed Out</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteFromContextMenu}
                  className="px-3 py-2.5 hover:bg-red-500/20 rounded-2xl text-red-500 hover:text-red-400 transition-all flex items-center gap-3 text-xs font-bold group"
                >
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {data.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-slate-600 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="mb-6 p-6 rounded-full bg-slate-900/50 border border-white/5 shadow-[0_0_50px_rgba(56,189,248,0.1)] backdrop-blur-sm">
                <PlusCircle className="w-12 h-12 text-slate-500" />
              </div>
              <h3 className="text-2xl font-light text-white mb-2 tracking-tight">The canvas is empty</h3>
              <p className="text-base text-slate-400 max-w-xs mb-8">
                Innovation starts with a single seed.
              </p>
              <div className="flex gap-4 pointer-events-auto">
                <button
                  onClick={handleAddCustomNode}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-sky-900/20 hover:shadow-sky-500/40 flex items-center gap-2 hover:-translate-y-1"
                >
                  <PlusCircle size={18} />
                  Add First Seed
                </button>
                <button
                  onClick={() => handleImFeelingLucky(false)}
                  disabled={isGeneratingSeed}
                  className={`px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-900/20 hover:shadow-violet-500/40 flex items-center gap-2 hover:-translate-y-1 ${isGeneratingSeed ? 'opacity-80 cursor-wait' : ''}`}
                >
                  {isGeneratingSeed ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isGeneratingSeed ? 'Generating...' : "I'm feeling lucky"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toolbar
        onAddNode={handleAddCustomNode}
        onStructureView={() => setLayoutTrigger(prev => prev + 1)}
        onToggleSettings={() => setShowSettings(true)}
        onToggleFilterMenu={() => setShowFilterMenu(!showFilterMenu)}
        onToggleInfo={() => setShowInfo(!showInfo)}
        onToggleContextMode={() => setIsContextMode(!isContextMode)}
        onDashboard={() => setShowDashboard(true)}
        onSave={handleSaveSeed}
        onToggleDiscovery={() => setDiscoveryState(prev => ({ ...prev, isActive: !prev.isActive }))}
        isFilterActive={hiddenTypes.length > 0}
        isInfoOpen={showInfo}
        isContextMode={isContextMode}
        isDiscoveryActive={discoveryState.isActive}
        isProcessing={isProcessing}
        activeTypeCount={0}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={aiSettings}
        onSave={handleSaveSettings}
      />

      {
        showDashboard && (
          <SeedsDashboard
            onLoadSeed={handleLoadSeed}
            onSave={handleSaveSeed}
            onNewSeed={handleNewSeed}
            onClose={() => setShowDashboard(false)}
            currentSeedId={currentSeedFileId}
          />
        )
      }

      {/* Sidebar - Now a floating element */}
      <Sidebar
        nodes={getSelectedNodes()}
        onClose={handleCloseSidebar}
        onExpand={handleExpandNode}
        onExpandSingle={handleExpandNodeSingle}
        onAnalyzeSynergy={handleAnalyzeSynergy}
        onConnectNodes={handleConnectNodes}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onKeepLucky={handleKeepLucky}
        onTryAgainLucky={handleTryAgainLucky}
        onInnovate={handleInnovateNode}
        onSolve={handleSolveProblem}
        onAnswer={handleAnswerQuestion}
        isProcessing={isProcessing || isGeneratingSeed}
        onAssimilate={handleAssimilateNode}
        onPrune={handlePruneNode}
      />

      {/* Discovery Console Overlay */}
      {
        discoveryState.isActive && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-sky-500/30 rounded-full px-6 py-2.5 shadow-[0_0_30px_rgba(14,165,233,0.2)] flex items-center gap-6 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-sky-500 rounded-full animate-ping opacity-20"></div>
                  <BrainCircuit className="text-sky-400 relative z-10" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-500/70 leading-none">Autonomous Gardener</span>
                  <span className="text-xs text-white font-medium">Scanning Innovation Fog...</span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                {discoveryState.history.slice(0, 1).map((item, i) => (
                  <span key={i} className="text-xs text-slate-400 animate-in fade-in slide-in-from-right-2 line-clamp-1 max-w-[200px]">
                    {item}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setDiscoveryState(prev => ({ ...prev, isActive: false }))}
                className="ml-2 p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )
      }

      {/* Add Node Modal Overlay - Glass Style */}
      {
        isAddingNode && (
          <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-96 animate-in fade-in zoom-in duration-300 ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-white flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-500/30">
                    <PlusCircle size={20} className="text-sky-400" />
                  </div>
                  {addingNodeParent ? `Add Linked Seed` : `Add New Seed`}
                </h3>
                <button onClick={() => { setIsAddingNode(false); setAddingNodeParent(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Seed Type</label>
                <div className="relative">
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as NodeType)}
                    className="w-full appearance-none bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all cursor-pointer"
                  >
                    {Object.values(NodeType)
                      .filter(t => t !== NodeType.TRACE)
                      .map(t => (
                        <option
                          key={t}
                          value={t}
                          className="bg-slate-900 hover:bg-slate-800 border-none py-2"
                        >
                          {t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ')}
                        </option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Label</label>
                <input
                  autoFocus
                  type="text"
                  placeholder={
                    newNodeType === NodeType.PROBLEM ? "Short description of the bottleneck..." :
                      newNodeType === NodeType.PAIN_POINT ? "Describe the user frustration..." :
                        newNodeType === NodeType.TECHNOLOGY ? "Name of the tech or framework..." :
                          newNodeType === NodeType.QUESTION ? "What do we need to know...?" :
                            newNodeType === NodeType.ENTITY ? "Name of organization or role..." :
                              newNodeType === NodeType.INNOVATION ? "The name of the breakthrough..." :
                                newNodeType === NodeType.CONSTRAINT ? "Boundary or technical limitation..." :
                                  newNodeType === NodeType.FRICTION ? "The specific drag in the process..." :
                                    newNodeType === NodeType.CONCEPT ? "The abstract idea or mental model..." :
                                      "What is this seed called...?"
                  }
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitCustomNode()}
                />
              </div>

              <div className="mb-5">
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Description</label>
                <textarea
                  placeholder={
                    newNodeType === NodeType.PROBLEM ? "Explain the technical friction or blocker in detail..." :
                      newNodeType === NodeType.PAIN_POINT ? "What is the emotional or functional impact on the user?" :
                        newNodeType === NodeType.QUESTION ? "Specify the exact uncertainty we are trying to clear..." :
                          newNodeType === NodeType.TECHNOLOGY ? "What are the core capabilities and limitations?" :
                            newNodeType === NodeType.FRICTION ? "Where exactly is the cognitive or system load happening?" :
                              newNodeType === NodeType.INNOVATION ? "How does this fundamentally move the state of the art forward?" :
                                newNodeType === NodeType.CONSTRAINT ? "What are the physical, systemic, or legal boundaries?" :
                                  newNodeType === NodeType.ENTITY ? "Provide details on the role, history, or scale of this entity..." :
                                    newNodeType === NodeType.CONCEPT ? "Define the core principles and boundaries of this idea..." :
                                      "Provide more context and significance for this seed..."
                  }
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all h-24 text-sm resize-none"
                  value={newNodeDescription}
                  onChange={(e) => setNewNodeDescription(e.target.value)}
                  onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && submitCustomNode()}
                />
              </div>

              {addingNodeParent && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                    Relationship from <span className="text-white">{addingNodeParent.label}</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newNodeRelation}
                      onChange={e => setNewNodeRelation(e.target.value)}
                      className="w-full appearance-none bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all cursor-pointer"
                    >
                      {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => { setIsAddingNode(false); setAddingNodeParent(null); }}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCustomNode}
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-900/20 hover:shadow-sky-500/30 transition-all hover:-translate-y-0.5"
                >
                  Create Seed
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Notification Toast */}
      {
        notification && (
          <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 ring-1 ring-black/20 ${notification.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
              notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
                'bg-slate-800/80 text-white'
              }`}>
              {notification.type === 'error' ? <AlertCircle size={20} className="text-red-400" /> :
                notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> :
                  <Info size={20} className="text-sky-400" />}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-0.5">
                  {notification.type === 'error' ? "System Failure" : "Notification"}
                </span>
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;