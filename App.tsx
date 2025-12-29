import React, { useState, useCallback, useEffect, useRef } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import SettingsModal from './components/SettingsModal';
import SeedsDashboard from './components/SeedsDashboard';
import { INITIAL_DATA, NODE_ICONS, NODE_COLORS, getModeConfig, getExpansionBlueprints, getRelationOptions, getSeedExamples } from './constants';
import { curateWikiSnippet, expandConcept, expandConceptTargeted, directedDiscovery, generateSynergyNode, generateRandomSeedNode, innovateConcept, solveProblem, answerQuestion, quickExpand, agenticDiscovery, traceLineageAnalysis, researchAssistantChat, optimizeConcept, stressTestConcept, generateImplementation, researchAssistantTextReply, extractKnowledgeMap } from './services/aiService';
import { Share2, PlusCircle, Sparkles, Eye, EyeOff, GitBranch, Zap, MessageCircle, X, Trash2, Layers, ChevronRight, Home, GitMerge, Loader2, Search, CheckCircle2, MoreHorizontal, Minimize2, Cpu, AlertCircle, Heart, BrainCircuit, Info, Lightbulb, MousePointerClick, MessageSquare, Orbit, RefreshCw, Network, SquarePlus, Square } from 'lucide-react';
import NexusAssistant from './components/NexusAssistant';
import NexusConfirmDialog from './components/NexusConfirmDialog';
import ConfirmDialog from './components/ConfirmDialog';
import WormholeSelector from './components/WormholeSelector';
import WelcomeScreen from './components/WelcomeScreen';
import SEEDManual from './components/SEEDManual';
import DiscoveryRecommendation from './components/DiscoveryRecommendation';
import NexusWikiBrowser from './components/NexusWikiBrowser';
import { searchWikipedia } from './services/wikipediaService';
import { ChatMessage, AISuggestion, DiscoveryState, GraphData, GraphNode, NodeType, SessionSnapshot, AISettings, AIProvider, SeedFile, GraphLink, ExplorationMode, WikiBrowserState } from './types';

// Utility to generate UUIDs locally
const generateId = () => Math.random().toString(36).substr(2, 9);

// Utility to clear isNew flag from all nodes to ensure only the latest turn's seeds glow
const clearNewFlags = (nodes: GraphNode[]) => nodes.map(n => n.isNew ? { ...n, isNew: false } : n);

function App() {
  const [data, setData] = useState<GraphData>(JSON.parse(JSON.stringify(INITIAL_DATA)));
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSeed, setIsGeneratingSeed] = useState(false);

  // History State
  const [past, setPast] = useState<GraphData[]>([]);
  const [future, setFuture] = useState<GraphData[]>([]);

  const recordHistory = useCallback(() => {
    try {
      const snapshot = JSON.parse(JSON.stringify(data));
      setPast(prev => {
        const newPast = [...prev, snapshot];
        return newPast.slice(-10); // Keep last 10 turns
      });
      setFuture([]); // Clear redo stack on new action
    } catch (e) {
      console.warn("Failed to record history snapshot:", e);
    }
  }, [data]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(prev => [JSON.parse(JSON.stringify(data)), ...prev]);
    setPast(prev => prev.slice(0, -1));
    setData(previous);
  }, [past, data]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(prev => [...prev, JSON.parse(JSON.stringify(data))]);
    setFuture(prev => prev.slice(1));
    setData(next);
  }, [future, data]);

  // Session / Nested View State
  const [sessionStack, setSessionStack] = useState<SessionSnapshot[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('root'); // Used to force-reset canvas
  const [currentSessionName, setCurrentSessionName] = useState<string>('Root');

  // Persistence State
  const [currentSeedFileId, setCurrentSeedFileId] = useState<string | undefined>(undefined);
  const [currentSeedFileName, setCurrentSeedFileName] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isWormholeSelectorOpen, setIsWormholeSelectorOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Custom Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const askConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning',
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(null);
      },
      type,
      confirmText,
      cancelText
    });
  };

  // Filtering & Info
  const [hiddenTypes, setHiddenTypes] = useState<NodeType[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  // Context / Lineage Mode
  const [isContextMode, setIsContextMode] = useState(true);

  // Context Menu State (Right-click)
  const [contextMenuNode, setContextMenuNode] = useState<GraphNode | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // AI Settings State - Lazy initialized from localStorage
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const defaultSettings: AISettings = {
      provider: AIProvider.GEMINI,
      providers: {
        [AIProvider.GEMINI]: { apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '', model: 'gemini-3-flash-preview' },
        [AIProvider.OPENAI]: { apiKey: '', model: 'gpt-4o' },
        [AIProvider.DEEPSEEK]: { apiKey: '', model: 'deepseek-chat' }
      }
    };

    const stored = localStorage.getItem('seed_ai_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const providers = { ...defaultSettings.providers };
          if (parsed.providers) {
            Object.keys(parsed.providers).forEach(key => {
              providers[key as AIProvider] = {
                ...providers[key as AIProvider],
                ...parsed.providers[key]
              };
            });
          }
          return {
            ...defaultSettings,
            provider: parsed.provider || defaultSettings.provider,
            providers
          };
        }
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return defaultSettings;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Discovery Mode State
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    isActive: false,
    activeNodeId: null,
    history: [],
    stepCount: 0,
    currentPolicy: 'EXPLOIT',
    goalNodeId: null
  });

  const [discardedLuckySeeds, setDiscardedLuckySeeds] = useState<string[]>([]);

  // Exploration Mode State
  const [currentMode, setCurrentMode] = useState<ExplorationMode>(ExplorationMode.INNOVATION);

  // Derived mode-specific constants
  const RELATION_OPTIONS = getRelationOptions(currentMode);
  const EXPANSION_BLUEPRINTS = getExpansionBlueprints(currentMode);
  const NOVEL_SEEDS = getSeedExamples(currentMode);
  const modeConfig = getModeConfig(currentMode);

  // Assistant / Chat State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [proposingSeed, setProposingSeed] = useState<AISuggestion | null>(null);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Welcome Screen State
  const [showWelcome, setShowWelcome] = useState(true);

  // Wiki Browser State
  const [wikiBrowser, setWikiBrowser] = useState<WikiBrowserState>({
    isOpen: false,
    url: '',
    title: '',
    sourceNodeId: null
  });

  // Manual State
  const [showManual, setShowManual] = useState(false);
  const [manualTab, setManualTab] = useState<'welcome' | 'autonomous' | 'protocols' | 'ontology' | 'shortcuts' | 'about'>('welcome');
  const [showDiscoveryRecommendation, setShowDiscoveryRecommendation] = useState(false);

  const handleShowManual = (tab?: string) => {
    if (tab) {
      setManualTab(tab as any);
    } else {
      setManualTab('welcome');
    }
    setShowManual(true);
  };


  // Provide default greeting if skipping welcome
  useEffect(() => {
    if (!showWelcome && chatMessages.length === 0) {
      setChatMessages([{
        id: generateId(),
        role: 'assistant',
        content: `Welcome back. What are we SEED-ing today?`,
        timestamp: Date.now()
      }]);
    }
  }, [showWelcome]);

  // Track if there are any saved seeds
  const [hasSavedSeeds, setHasSavedSeeds] = useState(false);

  useEffect(() => {
    const checkSeeds = async () => {
      try {
        // @ts-ignore
        const list = await window.api.db.listSeeds();
        setHasSavedSeeds(list && list.length > 0);
      } catch (e) {
        console.error("Failed to check saved seeds", e);
      }
    };

    if (showWelcome) {
      checkSeeds();
    }
  }, [showWelcome]);

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

        // 'i' for Innovate / Synthesize
        if (e.key.toLowerCase() === 'i' && (
          node.type === NodeType.TECHNOLOGY ||
          node.type === NodeType.INNOVATION ||
          (currentMode === ExplorationMode.KNOWLEDGE && (node.type === NodeType.THEORY || node.type === NodeType.CONCEPT || node.type === NodeType.DISCOVERY))
        )) {
          handleInnovateNode(node);
        }
        // 's' for Solve / Resolve
        else if (e.key.toLowerCase() === 's' && (
          node.type === NodeType.PROBLEM ||
          node.type === NodeType.PAIN_POINT ||
          (currentMode === ExplorationMode.KNOWLEDGE && node.type === NodeType.EVENT)
        )) {
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
        // 't' for Trace
        else if (e.key.toLowerCase() === 't') {
          handleTraceLineage(node);
        }
      }

      // 'Delete' or 'Backspace' to delete selected nodes
      if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
        if (selectedNodeIds.length > 0) {
          handleDeleteNodes(selectedNodeIds);
        }
      }

      if (e.key === 'k' || e.key === 'K') setIsChatOpen(prev => !prev);
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setContextMenuNode(null);
        setIsChatOpen(false);
        setShowFilterMenu(false);
      }

      // Ctrl+Z for Undo, Ctrl+Y for Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, data, aiSettings, isProcessing]); // Dependencies to ensure handlers have latest state

  // --- PERSISTENCE HANDLERS ---

  const handleSaveSeed = async (silentParam: boolean | any = false) => {
    const isActuallySilent = silentParam === true;
    const id = currentSeedFileId || generateId();
    // IDENTIFY ROOT NAME (Preserve identity even when deep in recursion)
    let rootName = "Untitled Space";
    if (sessionStack.length > 0) {
      // We are deep. The true identity is the bottom of the stack (Root).
      // Try to find the root node in the root snapshot
      const rootSnapshot = sessionStack[0];
      const rootNode = rootSnapshot.data.nodes.find(n => n.isRoot);
      rootName = rootNode ? rootNode.label : (rootSnapshot.label !== 'Root' ? rootSnapshot.label : "Untitled Space");
    } else {
      // We are at the root level
      const rootNode = data.nodes.find(n => n.isRoot);
      // Fallback to first node if no explicit root (legacy/edge case)
      rootName = rootNode ? rootNode.label : (data.nodes.length > 0 ? data.nodes[0].label : "Untitled Space");
    }

    const name = rootName; // data.nodes.length > 0 ? data.nodes[0].label : "Untitled Space";
    const finalName = name;

    const performSave = async () => {
      const seedFile: SeedFile = {
        id: id,
        name: finalName,
        lastModified: Date.now(),
        data: data,
        sessionStack: sessionStack,
        viewport: { x: 0, y: 0, zoom: 1 },
        mode: currentMode
      };

      try {
        // @ts-ignore
        const result = await window.api.db.saveSeed(seedFile);
        if (result.error) {
          console.error("Save failed:", result.error);
          if (!isActuallySilent) popError(`Failed to save: ${result.error}`);
          return;
        }

        setCurrentSeedFileId(id);
        setCurrentSeedFileName(finalName);
        if (!isActuallySilent) {
          setNotification({ message: `Seed Space saved: ${finalName}`, type: 'success' });
          setTimeout(() => setNotification(null), 3000);
        } else {
          setNotification({ message: `Progress auto-saved in ${finalName}`, type: 'success' });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (e) {
        console.error("Save error:", e);
        if (!isActuallySilent) popError("Critical failure during save");
      }
    };

    // Global guard: never save if there are no nodes (prevents empty untitled spaces)
    if (data.nodes.length === 0) return;

    await performSave();
  };

  const handleLoadSeed = async (id: string) => {
    // Auto-save current session before switching
    await handleSaveSeed(true);

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
      setCurrentSeedFileName(seed.name);
      setCurrentSessionId(generateId()); // Force re-render

      // Restore mode (default to INNOVATION for legacy seeds)
      setCurrentMode(seed.mode || ExplorationMode.INNOVATION);

      if (seed.sessionStack && seed.sessionStack.length > 0) {
        // Restore deep session name
        setCurrentSessionName(seed.name || "Seed Space");
      } else {
        setCurrentSessionName("Root");
      }
      setShowDashboard(false);
      setShowWelcome(false);
    }
  };

  const handleNewSeed = async () => {
    // Auto-save current before starting new
    await handleSaveSeed(true);

    // Show welcome screen for mode selection
    setShowWelcome(true);
    setShowDashboard(false);
  };

  const handleWelcomeModeSelect = (mode: ExplorationMode) => {
    setCurrentMode(mode);
    setData({ nodes: [], links: [] });
    setSessionStack([]);
    setCurrentSeedFileId(undefined);
    setCurrentSeedFileName(null);
    setCurrentSessionId('root');
    setCurrentSessionName('Root');
    setShowDashboard(false);
    setShowWelcome(false);
    setDiscardedLuckySeeds([]);

    // Open chat and greet for new space
    setIsChatOpen(true);
    const modeConfig = getModeConfig(mode);
    setChatMessages([{
      id: generateId(),
      role: 'assistant',
      content: `What are we SEED-ing today?`,
      timestamp: Date.now()
    }]);
  };

  const handleGoHome = () => {
    setShowDashboard(false);
    setShowWelcome(true);
  };

  const handleCreateNewSpaceFromNode = async (node: GraphNode) => {
    // 1. Save current session before switching
    await handleSaveSeed(true);

    // 2. Prepare new data with this node as the root
    const rootNodeId = generateId();
    const newId = generateId();

    // Deep clone the node to avoid any shared object issues
    const nodeCopy = JSON.parse(JSON.stringify(node));

    const rootNode: GraphNode = {
      ...nodeCopy,
      id: rootNodeId,
      isRoot: true,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      subGraphData: undefined, // Don't carry over nested subgraphs to the new space's root
      isNew: false,
      isGhost: false,
      isWormhole: false, // In the new space, it's the actual root, not a wormhole
    };

    const newData: GraphData = {
      nodes: [rootNode],
      links: []
    };

    const newSeedFile: SeedFile = {
      id: newId,
      name: node.label,
      lastModified: Date.now(),
      data: newData,
      sessionStack: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      mode: currentMode
    };

    try {
      // @ts-ignore
      const result = await window.api.db.saveSeed(newSeedFile);
      if (result && result.error) {
        throw new Error(result.error);
      }

      // 3. Update state to point to the new space
      setData(newData);
      setSessionStack([]);
      setCurrentSeedFileId(newId);
      setCurrentSeedFileName(node.label);
      setCurrentSessionId('root');
      setCurrentSessionName('Root');

      // Reset history for the new space
      setPast([]);
      setFuture([]);

      setNotification({ message: `New Seed Space created: ${node.label}`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);

      // 4. Open chat to continue the conversation in the new space
      setIsChatOpen(true);
      setChatMessages([{
        id: generateId(),
        role: 'assistant',
        content: `I've successfully branched your research on "${node.label}" into its own dedicated space. \n\nHow should we continue this exploration? We can brainstorm technical implementation, look for adjacent problems, or perform a global trace.`,
        timestamp: Date.now()
      }]);
    } catch (e: any) {
      console.error("Failed to create new seed space from node:", e);
      popError(`Failed to create new seed space: ${e.message || 'Unknown error'}`);
    }

    setContextMenuNode(null);
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
  const discoveryStateRef = useRef(discoveryState);
  const dataRef = useRef(data);
  const settingsRef = useRef(aiSettings);
  const modeRef = useRef(currentMode);

  useEffect(() => { isActiveRef.current = discoveryState.isActive; }, [discoveryState.isActive]);
  useEffect(() => { discoveryStateRef.current = discoveryState; }, [discoveryState]);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { settingsRef.current = aiSettings; }, [aiSettings]);
  useEffect(() => { modeRef.current = currentMode; }, [currentMode]);

  useEffect(() => {
    if (!discoveryState.isActive) return;

    let timer: any;
    const runPulse = async () => {
      // LOYAL STOP: Exit immediately if inactive
      if (!isActiveRef.current) return;

      const currentNodes = dataRef.current.nodes.filter(n => !n.isGhost);
      if (currentNodes.length === 0) return;

      // --- DISCOVERY STEERING LOGIC ---
      const currentState = discoveryStateRef.current;
      const stepCount = currentState.stepCount || 0;
      let nextPolicy = currentState.currentPolicy || 'EXPLOIT';

      // Policy Rotation (Material Discovery Style)
      // Every 5 steps, Re-Anchor to the goal.
      // Otherwise cycle between Exploit, Explore, and Probe.
      if (stepCount > 0 && stepCount % 6 === 0) {
        nextPolicy = 'RE_ANCHOR';
      } else if (stepCount % 3 === 0) {
        nextPolicy = 'EXPLORE';
      } else if (stepCount % 4 === 0) {
        nextPolicy = 'PROBE';
      } else {
        nextPolicy = 'EXPLOIT';
      }

      // FIND ANCHORS
      const goalNode = dataRef.current.nodes.find(n => n.isGoalNode) || dataRef.current.nodes.find(n => n.isRoot) || null;
      const globalConstraints = dataRef.current.nodes.filter(n => n.type === NodeType.CONSTRAINT || n.type === NodeType.FRICTION);

      // --- RE-ANCHOR: CLEANUP GHOSTS ---
      // If re-anchoring, prune ghosts with low novelty/impact or high friction
      if (nextPolicy === 'RE_ANCHOR') {
        const lowValueNodeIds = dataRef.current.nodes
          .filter(n => n.isGhost && n.valueVector && (n.valueVector.impact < 0.3 || n.valueVector.friction > 0.8))
          .map(n => n.id);

        if (lowValueNodeIds.length > 0) {
          setData(prev => ({
            nodes: prev.nodes.filter(n => !lowValueNodeIds.includes(n.id)),
            links: prev.links.filter(l => {
              const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return !lowValueNodeIds.includes(s) && !lowValueNodeIds.includes(t);
            })
          }));
          setDiscoveryState(prev => ({
            ...prev,
            history: [`Cleaned ${lowValueNodeIds.length} low-value paths`, ...prev.history].slice(0, 10)
          }));
        }
      }

      // TARGET SELECTION LOGIC
      // 1. Check if we have a focus node from state
      let targetId = currentState.activeNodeId;
      let target = targetId ? currentNodes.concat(dataRef.current.nodes.filter(n => n.isGhost)).find(n => n.id === targetId) : null;

      // 2. If no target or target is gone, and we are in quest mode, stop quest
      if (!target && currentState.isQuest) {
        setDiscoveryState(prev => ({ ...prev, isQuest: false, activeNodeId: null }));
        return;
      }

      // 3. If no target, pick a purposeful one
      if (!target) {
        if (nextPolicy === 'RE_ANCHOR' && goalNode) {
          target = goalNode;
        } else {
          const priorityNodes = modeRef.current === ExplorationMode.INNOVATION
            ? currentNodes.filter(n => [NodeType.PROBLEM, NodeType.PAIN_POINT, NodeType.QUESTION, NodeType.FRICTION, NodeType.CONSTRAINT, NodeType.ETHICS, NodeType.REGULATION, NodeType.MARKET, NodeType.MENTAL_MODEL].includes(n.type))
            : currentNodes.filter(n => [NodeType.QUESTION, NodeType.CONTRADICTION].includes(n.type));

          if (priorityNodes.length > 0) {
            target = priorityNodes[Math.floor(Math.random() * priorityNodes.length)];
          } else {
            target = currentNodes[Math.floor(Math.random() * currentNodes.length)];
          }
        }
      }

      if (!target) return; // Fallback

      setDiscoveryState(prev => ({
        ...prev,
        activeNodeId: target!.id,
        currentPolicy: nextPolicy,
        stepCount: stepCount + 1
      }));

      const nodesString = dataRef.current.nodes.map(n => `- ${n.label} (${n.type})`).join('\n');
      const linksString = dataRef.current.links.map(l => {
        const sourceLabel = dataRef.current.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as any).id : l.source))?.label;
        const targetLabel = dataRef.current.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as any).id : l.target))?.label;
        return `- ${sourceLabel} --[${l.relation}]--> ${targetLabel}`;
      }).join('\n');

      const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}\n\nCURRENT DISCOVERY SESSION HISTORY:\n${discoveryStateRef.current.history.slice(0, 5).reverse().join(' -> ')}`;

      try {
        // AI Thinking delay simulation
        await new Promise(r => setTimeout(r, 2000));

        // LOYAL STOP: Check again before AI call
        if (!isActiveRef.current) return;

        const suggestion = await agenticDiscovery(
          settingsRef.current,
          fullGraphContext,
          target!,
          goalNode,
          globalConstraints,
          nextPolicy,
          modeRef.current
        );

        if (suggestion && isActiveRef.current) {
          // Check for Duplicates (Smart Match)
          const cleanWords = (str: string) => {
            return str.toLowerCase()
              .replace(/[^a-z0-9 ]/g, '')
              .split(/\s+/)
              .filter(w => !['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for'].includes(w))
              .map(w => w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w);
          };

          const suggestionWords = cleanWords(suggestion.label).join('');
          const existingNode = dataRef.current.nodes.find(n => cleanWords(n.label).join('') === suggestionWords && suggestionWords.length > 0);

          if (existingNode) {
            const alreadyLinked = dataRef.current.links.some(l => {
              const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (s === target!.id && t === existingNode.id) || (s === existingNode.id && t === target!.id);
            });

            if (!alreadyLinked && existingNode.id !== target!.id) {
              const newLink = {
                source: target!.id,
                target: existingNode.id,
                relation: suggestion.relationToParent || "connects to",
                isGhost: true
              };
              setData(prev => ({ ...prev, links: [...prev.links, newLink] }));
              setDiscoveryState(prev => ({
                ...prev,
                history: [`Mapped Link: ${target?.label} -> ${existingNode.label}`, ...prev.history].slice(0, 10)
              }));
            }
          } else {
            // Create New Node
            const newNodeId = generateId();
            const newNode: GraphNode = {
              id: newNodeId,
              label: suggestion.label,
              type: suggestion.type,
              description: suggestion.description,
              isGhost: true,
              isNew: true,
              valueVector: suggestion.valueVector,
              x: (isNaN(target!.x || 0) ? 0 : (target!.x || 0)) + (Math.random() - 0.5) * 400,
              y: (isNaN(target!.y || 0) ? 0 : (target!.y || 0)) + (Math.random() - 0.5) * 400
            };

            const newLink = {
              source: target!.id,
              target: newNodeId,
              relation: suggestion.relationToParent || "hypothesized",
              isGhost: true
            };

            setData(prev => ({
              nodes: [...clearNewFlags(prev.nodes), newNode],
              links: [...prev.links, newLink]
            }));

            setDiscoveryState(prev => ({
              ...prev,
              activeNodeId: prev.isQuest ? newNodeId : prev.activeNodeId,
              history: [`[${nextPolicy}] ${suggestion.label}`, ...prev.history].slice(0, 10)
            }));
          }
        }
      } catch (e) {
        console.error("Discovery Pulse Error:", e);
      } finally {
        if (!isActiveRef.current) {
          setDiscoveryState(prev => ({ ...prev, activeNodeId: null }));
          return;
        }

        if (!discoveryStateRef.current.isQuest) {
          setDiscoveryState(prev => ({ ...prev, activeNodeId: null }));
        }

        timer = setTimeout(runPulse, 6000);
      }
    };

    timer = setTimeout(runPulse, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [discoveryState.isActive]);

  const handleAssimilateNode = (nodeId: string) => {
    recordHistory();
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
    recordHistory();
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

    // Clear isNew flag if it exists
    if (node.isNew) {
      setData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, isNew: false } : n)
      }));
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
      if (node.isNew) {
        setData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === node.id ? { ...n, isNew: false } : n)
        }));
      }
      setContextMenuNode(node);
      setContextMenuPos({ x, y });
    } else {
      setContextMenuNode(null);
    }
  }, []);


  const handleCloseSidebar = () => {
    setSelectedNodeIds([]);
  };

  const handleEnterNestedSession = async (node: GraphNode) => {
    // If it's a wormhole, we teleport instead of seeding in locally
    if (node.isWormhole && node.targetSessionId) {
      handleWormholeTeleport(node.targetSessionId, node.targetNodeId);
      return;
    }

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
        fx: undefined, // Let D3 forceCenter handle positioning
        fy: undefined,
        isRoot: true, // Explicitly mark as root of this new view
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

  const handleWormholeTeleport = async (sessionId: string, targetNodeId?: string) => {
    const performTeleport = async () => {
      // Auto-save before teleport
      await handleSaveSeed(true);

      // @ts-ignore
      const seed: SeedFile = await window.api.db.loadSeed(sessionId);
      if (seed) {
        setData(seed.data);
        setSessionStack(seed.sessionStack || []);
        setCurrentSeedFileId(seed.id);
        setCurrentSessionId(generateId());
        setCurrentSessionName(seed.name);
        setCurrentMode(seed.mode || ExplorationMode.INNOVATION);

        if (targetNodeId) {
          setSelectedNodeIds([targetNodeId]);
        } else {
          setSelectedNodeIds([]);
        }

        setNotification({ message: `Teleported to ${seed.name}`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    };

    askConfirm(
      "Engage Wormhole",
      "You are about to teleport to a different Seed Space. Current progress will be auto-saved. Proceed?",
      performTeleport,
      'info',
      "Engage"
    );
  };

  const handleSelectWormholeTarget = async (targetSessionId: string, targetSessionName: string, targetNodeId: string, targetNodeLabel: string, relation: string, reciprocalRelation?: string) => {
    if (!contextMenuNode) return;

    const sourceSeed = contextMenuNode;
    const currentSpaceId = currentSeedFileId;

    // We need the name of the current space for the inverse link description
    let currentSpaceName = "Current Space";
    try {
      // @ts-ignore
      const seeds = await window.api.db.listSeeds();
      const current = seeds.find((s: any) => s.id === currentSpaceId);
      if (current) currentSpaceName = current.name;
    } catch (e) { }

    // 1. Create Wormhole in CURRENT session
    recordHistory();
    const wormholeId = generateId();
    const newWormholeSeed: GraphNode = {
      id: wormholeId,
      label: `${targetNodeLabel} (Wormhole)`,
      type: NodeType.CONCEPT,
      description: `Persistent link to Seed [${targetNodeLabel}] in Seed Space [${targetSessionName}]`,
      isWormhole: true,
      targetSessionId: targetSessionId,
      targetNodeId: targetNodeId,
      x: sourceSeed.x ? sourceSeed.x + 80 : 80,
      y: sourceSeed.y ? sourceSeed.y + 40 : 40,
      isNew: true
    };

    const newLink: GraphLink = {
      source: sourceSeed.id,
      target: wormholeId,
      relation: relation
    };

    setData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newWormholeSeed],
      links: [...prev.links, newLink]
    }));

    setIsWormholeSelectorOpen(false);
    setContextMenuNode(null);
    setNotification({ message: "Wormhole established", type: 'success' });
    setTimeout(() => setNotification(null), 3000);

    // 2. RECIPROCITY: Create Reverse Wormhole in TARGET session
    if (currentSpaceId) {
      try {
        // @ts-ignore
        const targetSeedFile: SeedFile = await window.api.db.loadSeed(targetSessionId);
        if (targetSeedFile && targetSeedFile.data) {
          const reverseWormholeId = generateId();
          const reverseWormholeSeed: GraphNode = {
            id: reverseWormholeId,
            label: `${sourceSeed.label} (Wormhole)`,
            type: NodeType.CONCEPT,
            description: `Automatic reverse link to Seed [${sourceSeed.label}] in Seed Space [${currentSpaceName}]`,
            isWormhole: true,
            targetSessionId: currentSpaceId,
            targetNodeId: sourceSeed.id,
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            isNew: true
          };

          const REVERSE_RELATIONS: Record<string, string> = {
            "solves": "is solved by",
            "addresses": "is addressed by",
            "innovates": "is innovated by",
            "questions": "is questioned by",
            "answers": "is answered for",
            "enables": "is enabled by",
            "integrates with": "integrates with",
            "leverages": "is leveraged by",
            "conflicts with": "conflicts with",
            "blocks": "is blocked by",
            "creates friction for": "experiences friction from",
            "is limited by": "limits",
            "imposes": "is imposed by",
            "requires": "is required by",
            "explores": "is explored by"
          };

          const reverseRelation = reciprocalRelation || REVERSE_RELATIONS[relation] || `linked by ${relation}`;

          const reverseLink: GraphLink = {
            source: reverseWormholeId,
            target: targetNodeId,
            relation: reverseRelation
          };

          targetSeedFile.data.nodes.push(reverseWormholeSeed);
          targetSeedFile.data.links.push(reverseLink);
          targetSeedFile.lastModified = Date.now();
          // Ensure mode is preserved or defaulted to INNOVATION if legacy
          if (!targetSeedFile.mode) {
            targetSeedFile.mode = ExplorationMode.INNOVATION;
          }

          // @ts-ignore
          await window.api.db.saveSeed(targetSeedFile);
        }
      } catch (err) {
        console.error("Failed to create reciprocal wormhole:", err);
      }
    }
  };

  // Logic to roll up changes from current session to parents
  const saveSessionUpwards = (
    currentLevelData: GraphData,
    stack: SessionSnapshot[],
    targetIndex: number
  ): SessionSnapshot[] => {
    // Deep clone to ensure we aren't modifying state directly and React detects changes
    const newStack = JSON.parse(JSON.stringify(stack)) as SessionSnapshot[];
    let dataToSave = JSON.parse(JSON.stringify(currentLevelData)) as GraphData;

    for (let i = newStack.length - 1; i >= targetIndex; i--) {
      const snapshot = newStack[i];

      if (snapshot.triggerNodeId) {
        // Find the node in this snapshot that holds the subgraph
        const nodeIndex = snapshot.data.nodes.findIndex(n => n.id === snapshot.triggerNodeId);
        if (nodeIndex !== -1) {
          // If the child space is effectively empty (only the seed node triggers exist), remove the subGraphData
          // This prevents "Ghost Floors" where entering a node shows just that node again with no new info.
          if (dataToSave.nodes.length <= 1 && dataToSave.links.length === 0) {
            snapshot.data.nodes[nodeIndex].subGraphData = undefined;
          } else {
            snapshot.data.nodes[nodeIndex].subGraphData = dataToSave;
          }
        }
        // The data of THIS snapshot becomes the dataToSave for the next level up
        dataToSave = JSON.parse(JSON.stringify(snapshot.data));
      }
    }

    return newStack;
  };

  const handleNavigateToSession = (index: number, overrideData?: GraphData) => {
    if (index < 0 || index >= sessionStack.length) {
      return;
    }

    // First, roll up current data (or override) into the snapshots
    const updatedStack = saveSessionUpwards(overrideData || data, sessionStack, index);

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

  const getGraphContext = (currentData: GraphData): string => {
    const nodesString = currentData.nodes.map(n => `- ${n.label} (Type: ${n.type}): ${n.description}`).join('\n');
    const linksString = currentData.links.map(l => {
      const source = currentData.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source))?.label;
      const target = currentData.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target))?.label;
      return `- ${source} --[${l.relation}]--> ${target}`;
    }).join('\n');

    return `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;
  };


  const handleExpandNode = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    let contextString = undefined;
    if (isContextMode) {
      const ancestry = getNodeLineage(node.id);
      contextString = ancestry ? `${ancestry} -> ${node.label}` : node.label;
    }

    try {
      const fullGraphContext = getGraphContext(data);
      const suggestions = await expandConcept(aiSettings, node.label, node.description || "", fullGraphContext, contextString, currentMode);

      if (suggestions.length > 0) {
        setData(prevData => {
          const nextNodes = clearNewFlags(prevData.nodes);
          const nextLinks = [...prevData.links];

          suggestions.forEach(s => {
            const existingNode = nextNodes.find(n => n.label.toLowerCase() === s.label.toLowerCase());
            let targetId: string;

            if (existingNode) {
              targetId = existingNode.id;
            } else {
              targetId = generateId();
              nextNodes.push({
                id: targetId,
                label: s.label,
                type: s.type,
                description: s.description,
                x: (isNaN(node.x || 0) ? 0 : (node.x || 0)) + (Math.random() - 0.5) * 100,
                y: (isNaN(node.y || 0) ? 0 : (node.y || 0)) + (Math.random() - 0.5) * 100,
                isNew: true
              });
            }

            // check for existing link
            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
            });

            if (!linkExists) {
              nextLinks.push({
                source: node.id,
                target: targetId,
                relation: s.relationToParent
              });
            }
          });

          return {
            nodes: nextNodes,
            links: nextLinks
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Expansion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpandNodeSingle = async (node: GraphNode, relation: string, count: number = 1, targetType?: NodeType) => {
    setIsProcessing(true);
    recordHistory();

    let contextString = undefined;
    if (isContextMode) {
      const ancestry = getNodeLineage(node.id);
      contextString = ancestry ? `${ancestry} -> ${node.label}` : node.label;
    }

    try {
      const fullGraphContext = getGraphContext(data);
      const suggestions = await expandConceptTargeted(aiSettings, node.label, node.description || "", relation, fullGraphContext, count, contextString, targetType, currentMode);

      if (suggestions && suggestions.length > 0) {
        setData(prevData => {
          const nextNodes = clearNewFlags(prevData.nodes);
          const nextLinks = [...prevData.links];

          suggestions.forEach(suggestion => {
            const existingNode = nextNodes.find(n => n.label.toLowerCase() === suggestion.label.toLowerCase());
            let targetId: string;

            if (existingNode) {
              targetId = existingNode.id;
            } else {
              targetId = generateId();
              nextNodes.push({
                id: targetId,
                label: suggestion.label,
                type: targetType || suggestion.type,
                description: suggestion.description,
                x: (node.x || 0) + (Math.random() - 0.5) * 100,
                y: (node.y || 0) + (Math.random() - 0.5) * 100,
                isNew: true
              });
            }

            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
            });

            if (!linkExists) {
              nextLinks.push({
                source: node.id,
                target: targetId,
                relation: suggestion.relationToParent || relation
              });
            }
          });

          return {
            nodes: nextNodes,
            links: nextLinks
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Targeted expansion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectedDiscovery = async (node: GraphNode, instruction: string, count: number = 1) => {
    setIsProcessing(true);
    recordHistory();

    let contextString = undefined;
    if (isContextMode) {
      const ancestry = getNodeLineage(node.id);
      contextString = ancestry ? `${ancestry} -> ${node.label}` : node.label;
    }

    try {
      const fullGraphContext = getGraphContext(data);
      const suggestions = await directedDiscovery(aiSettings, node.label, node.description || "", instruction, fullGraphContext, count, contextString, currentMode);

      if (suggestions && suggestions.length > 0) {
        setData(prevData => {
          const nextNodes = clearNewFlags(prevData.nodes);
          const nextLinks = [...prevData.links];

          suggestions.forEach(suggestion => {
            const existingNode = nextNodes.find(n => n.label.toLowerCase() === suggestion.label.toLowerCase());
            let targetId: string;

            if (existingNode) {
              targetId = existingNode.id;
            } else {
              targetId = generateId();
              nextNodes.push({
                id: targetId,
                label: suggestion.label,
                type: suggestion.type || NodeType.CONCEPT,
                description: suggestion.description,
                x: (isNaN(node.x || 0) ? 0 : (node.x || 0)) + (Math.random() - 0.5) * 150,
                y: (isNaN(node.y || 0) ? 0 : (node.y || 0)) + (Math.random() - 0.5) * 150,
                isNew: true
              });
            }

            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
            });

            if (!linkExists) {
              nextLinks.push({
                source: node.id,
                target: targetId,
                relation: suggestion.relationToParent || "discovered"
              });
            }
          });

          return {
            nodes: nextNodes,
            links: nextLinks
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Directed discovery failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTraceLineage = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();
    const ancestry = getNodeLineage(node.id);
    const fullPath = ancestry ? `${ancestry} -> ${node.label}` : node.label;

    try {
      const suggestions = await traceLineageAnalysis(aiSettings, node.label, node.description || "", fullPath, currentMode);

      if (suggestions && suggestions.length > 0) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          suggestions.forEach((s, i) => {
            const existingNode = nextNodes.find(n => n.label.toLowerCase() === s.label.toLowerCase());
            let targetId: string;

            if (existingNode) {
              targetId = existingNode.id;
            } else {
              targetId = generateId();
              nextNodes.push({
                id: targetId,
                label: s.label,
                type: s.type || NodeType.TRACE,
                description: s.description,
                x: (isNaN(node.x || 0) ? 0 : (node.x || 0)) + 100,
                y: (isNaN(node.y || 0) ? 0 : (node.y || 0)) + (i - 1) * 120,
                isNew: true
              });
            }

            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
            });

            if (!linkExists) {
              nextLinks.push({
                source: node.id,
                target: targetId,
                relation: s.relationToParent || "traced to"
              });
            }
          });

          return {
            nodes: nextNodes,
            links: nextLinks
          };
        });
      }
    } catch (e: any) {
      popError(e.message || "Lineage analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInnovateNode = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const fullGraphContext = getGraphContext(data);

    try {
      const innovation = await innovateConcept(
        aiSettings,
        node.label,
        node.description || "",
        node.type,
        fullGraphContext,
        currentMode
      );

      if (innovation) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          const existingNode = nextNodes.find(n => n.label.toLowerCase() === innovation.label.toLowerCase());
          let targetId: string;

          if (existingNode) {
            targetId = existingNode.id;
          } else {
            targetId = generateId();
            nextNodes.push({
              id: targetId,
              label: innovation.label,
              type: innovation.type,
              description: innovation.description,
              x: (node.x || 0) + 120,
              y: (node.y || 0) + 120,
              isNew: true
            });
          }

          const linkExists = nextLinks.some(l => {
            const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
          });

          if (!linkExists) {
            nextLinks.push({ source: node.id, target: targetId, relation: "facilitates" });
          }

          return { nodes: nextNodes, links: nextLinks };
        });
      }
    } catch (e: any) {
      popError(e.message || (currentMode === ExplorationMode.INNOVATION ? "Innovation request failed" : "Synthesis request failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSolveProblem = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const fullGraphContext = getGraphContext(data);

    try {
      const solution = await solveProblem(
        aiSettings,
        node.label,
        node.description || "",
        node.type,
        fullGraphContext,
        currentMode
      );

      if (solution) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          const existingNode = nextNodes.find(n => n.label.toLowerCase() === solution.label.toLowerCase());
          let targetId: string;

          if (existingNode) {
            targetId = existingNode.id;
          } else {
            targetId = generateId();
            nextNodes.push({
              id: targetId,
              label: solution.label,
              type: solution.type,
              description: solution.description,
              x: (node.x || 0) + 120,
              y: (node.y || 0) + 120,
              isNew: true
            });
          }

          const linkExists = nextLinks.some(l => {
            const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
          });

          if (!linkExists) {
            nextLinks.push({ source: node.id, target: targetId, relation: currentMode === ExplorationMode.INNOVATION ? "solved by" : "resolved by" });
          }

          return { nodes: nextNodes, links: nextLinks };
        });
      }
    } catch (e: any) {
      popError(e.message || (currentMode === ExplorationMode.INNOVATION ? "Problem solving failed" : "Resolution failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerQuestion = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const nodesString = data.nodes.map(n => `- ${n.label} (Type: ${n.type}): ${n.description}`).join('\n');
    const linksString = data.links.map(l => {
      const source = data.nodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source))?.label;
      const target = data.nodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target))?.label;
      return `- ${source} --[${l.relation}]--> ${target}`;
    }).join('\n');

    const fullGraphContext = `NODES:\n${nodesString}\n\nRELATIONSHIPS:\n${linksString}`;

    try {
      const fullGraphContext = getGraphContext(data);
      const answer = await answerQuestion(aiSettings, node.label, node.description || "", node.type, fullGraphContext, currentMode);

      if (answer) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          const existingNode = nextNodes.find(n => n.label.toLowerCase() === answer.label.toLowerCase());
          let targetId: string;

          if (existingNode) {
            targetId = existingNode.id;
          } else {
            targetId = generateId();
            nextNodes.push({
              id: targetId,
              label: answer.label,
              type: answer.type,
              description: answer.description,
              x: (node.x || 0) + 120,
              y: (node.y || 0) + 120,
              isNew: true
            });
          }

          const linkExists = nextLinks.some(l => {
            const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
          });

          if (!linkExists) {
            nextLinks.push({ source: node.id, target: targetId, relation: "answered by" });
          }

          return { nodes: nextNodes, links: nextLinks };
        });

        // Set the newNode as high-level selection?
        // setSelectedNodeIds([newNodeId]);
      }
    } catch (e: any) {
      popError(e.message || (currentMode === ExplorationMode.INNOVATION ? "Answer request failed" : "Fact check failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeSynergy = async (nodeA: GraphNode, nodeB: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

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
      contextA, contextB,
      currentMode
    );

    if (suggestion) {
      setData(prev => {
        const nextNodes = clearNewFlags(prev.nodes);
        const nextLinks = [...prev.links];

        const existingNode = nextNodes.find(n => n.label.toLowerCase() === suggestion.label.toLowerCase());
        let targetId: string;

        if (existingNode) {
          targetId = existingNode.id;
        } else {
          targetId = generateId();
          nextNodes.push({
            id: targetId,
            label: suggestion.label,
            type: suggestion.type,
            description: suggestion.description,
            x: ((nodeA.x || 0) + (nodeB.x || 0)) / 2,
            y: ((nodeA.y || 0) + (nodeB.y || 0)) / 2,
            isNew: true
          });
        }

        // Link from A
        const linkAExists = nextLinks.some(l => {
          const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (currS === nodeA.id && currT === targetId) || (currS === targetId && currT === nodeA.id);
        });
        if (!linkAExists) {
          nextLinks.push({ source: nodeA.id, target: targetId, relation: "contributes to" });
        }

        // Link from B
        const linkBExists = nextLinks.some(l => {
          const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (currS === nodeB.id && currT === targetId) || (currS === targetId && currT === nodeB.id);
        });
        if (!linkBExists) {
          nextLinks.push({ source: nodeB.id, target: targetId, relation: "contributes to" });
        }

        return { nodes: nextNodes, links: nextLinks };
      });
    }
    setIsProcessing(false);
  };

  const handleOptimizeNode = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const fullGraphContext = getGraphContext(data);

    try {
      const optimization = await optimizeConcept(aiSettings, node.label, node.description || "", fullGraphContext);
      if (optimization) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          const existingNode = nextNodes.find(n => n.label.toLowerCase() === optimization.label.toLowerCase());
          let targetId: string;

          if (existingNode) {
            targetId = existingNode.id;
          } else {
            targetId = generateId();
            nextNodes.push({
              id: targetId,
              label: optimization.label,
              type: optimization.type,
              description: optimization.description,
              x: (node.x || 0) + 120,
              y: (node.y || 0) - 120,
              isNew: true
            });
          }

          const linkExists = nextLinks.some(l => {
            const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
          });

          if (!linkExists) {
            nextLinks.push({ source: node.id, target: targetId, relation: "optimized as" });
          }

          return { nodes: nextNodes, links: nextLinks };
        });
      }
    } catch (e: any) {
      popError(e.message || "Optimization failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStressTestNode = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const fullGraphContext = getGraphContext(data);

    try {
      const failures = await stressTestConcept(aiSettings, node.label, node.description || "", fullGraphContext);
      if (failures && failures.length > 0) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          failures.forEach((fail, i) => {
            const existingNode = nextNodes.find(n => n.label.toLowerCase() === fail.label.toLowerCase());
            let targetId: string;

            if (existingNode) {
              targetId = existingNode.id;
            } else {
              targetId = generateId();
              nextNodes.push({
                id: targetId,
                label: fail.label,
                type: fail.type,
                description: fail.description,
                x: (node.x || 0) - 150,
                y: (node.y || 0) + (i - 1) * 120,
                isNew: true
              });
            }

            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
            });

            if (!linkExists) {
              nextLinks.push({ source: node.id, target: targetId, relation: fail.relationToParent });
            }
          });

          return { nodes: nextNodes, links: nextLinks };
        });
      }
    } catch (e: any) {
      popError(e.message || "Stress test failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImplementNode = async (node: GraphNode) => {
    setIsProcessing(true);
    recordHistory();

    const fullGraphContext = getGraphContext(data);

    try {
      const impl = await generateImplementation(aiSettings, node.label, node.description || "", fullGraphContext);
      if (impl) {
        setData(prev => {
          const nextNodes = clearNewFlags(prev.nodes);
          const nextLinks = [...prev.links];

          const existingNode = nextNodes.find(n => n.label.toLowerCase() === impl.label.toLowerCase());
          let targetId: string;

          if (existingNode) {
            targetId = existingNode.id;
          } else {
            targetId = generateId();
            nextNodes.push({
              id: targetId,
              label: impl.label,
              type: impl.type,
              description: impl.description,
              x: (node.x || 0) + 150,
              y: (node.y || 0),
              isNew: true
            });
          }

          const linkExists = nextLinks.some(l => {
            const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return (currS === node.id && currT === targetId) || (currS === targetId && currT === node.id);
          });

          if (!linkExists) {
            nextLinks.push({ source: node.id, target: targetId, relation: impl.relationToParent });
          }

          return { nodes: nextNodes, links: nextLinks };
        });
      }
    } catch (e: any) {
      popError(e.message || "Implementation generation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectNodes = (nodeA: GraphNode, nodeB: GraphNode, relation: string) => {
    recordHistory();
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

  const handleSetGoalNode = (nodeId: string) => {
    recordHistory();
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => ({
        ...n,
        isGoalNode: n.id === nodeId ? !n.isGoalNode : false // Only one goal at a time
      }))
    }));
    setDiscoveryState(prev => ({
      ...prev,
      goalNodeId: prev.goalNodeId === nodeId ? null : nodeId,
      stepCount: 0 // Reset steps to prioritize new goal
    }));
  };

  const handleSetConstraintNode = (nodeId: string, strength: 'hard' | 'soft' = 'hard') => {
    recordHistory();
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? {
        ...n,
        type: NodeType.CONSTRAINT,
        constraintProps: {
          strength,
          scope: 'global',
          type: 'technical'
        }
      } : n)
    }));
  };

  const handleUpdateLink = (sourceId: string, targetId: string, relation: string) => {
    recordHistory();
    setData(prev => ({
      ...prev,
      links: prev.links.map(l => {
        const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        // Match in either direction to be robust, but preserve the internal source/target if possible
        if ((sId === sourceId && tId === targetId) || (sId === targetId && tId === sourceId)) {
          return {
            ...l,
            source: sId,
            target: tId,
            relation
          };
        }
        return l;
      })
    }));
  };

  const handleDeleteLink = (sourceId: string, targetId: string) => {
    recordHistory();
    setData(prev => ({
      ...prev,
      links: prev.links.filter(l => {
        const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return !((sId === sourceId && tId === targetId) || (sId === targetId && tId === sourceId));
      })
    }));
  };

  const handleUpdateNode = (updatedNode: GraphNode) => {
    recordHistory();
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
  };

  const performDeleteNodes = (nodeIds: string[]) => {
    recordHistory();
    setData(prev => {
      const remainingNodes = prev.nodes.filter(n => !nodeIds.includes(n.id));
      const newLinks = prev.links.filter(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return !nodeIds.includes(sourceId as string) && !nodeIds.includes(targetId as string);
      });

      // Also check if we just emptied the current session's visible nodes
      // (This is tricky because the session stack stores data too, but we are editing the CURRENT active data)
      if (remainingNodes.length === 0 && sessionStack.length > 0) {
        // Schedule navigation back after this update
        setTimeout(() => handleNavigateToSession(sessionStack.length - 1, { nodes: [], links: [] }), 0);
      }

      return {
        nodes: remainingNodes,
        links: newLinks
      };
    });

    // Remove from selection
    setSelectedNodeIds(prev => prev.filter(id => !nodeIds.includes(id)));
  };

  const handleDeleteNodes = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    if (nodeIds.length === 1) {
      const nodeToDelete = data.nodes.find(n => n.id === nodeIds[0]);
      if (!nodeToDelete) return;

      const hasInternalNodes = nodeToDelete.subGraphData && nodeToDelete.subGraphData.nodes.length > 0;
      const confirmMsg = hasInternalNodes
        ? `Node "${nodeToDelete.label}" contains internal seeds. Deleting it will eliminate its entire internal space.`
        : `Permanently eliminate "${nodeToDelete.label}" and all its research associations?`;

      askConfirm(
        "Eliminate Seed",
        confirmMsg,
        () => performDeleteNodes(nodeIds),
        'danger',
        "Eliminate"
      );
    } else {
      askConfirm(
        "Eliminate Seeds",
        `Are you sure you want to eliminate ${nodeIds.length} selected seeds? This will permanently remove them and all their associations.`,
        () => performDeleteNodes(nodeIds),
        'danger',
        "Eliminate"
      );
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    handleDeleteNodes([nodeId]);
  };


  const handleDeleteInternalSpace = (node: GraphNode) => {
    askConfirm(
      "Eliminate Internal Space",
      `Permanently eliminate the internal research space of "${node.label}"? All seeds and associations inside it will be lost.`,
      () => {
        recordHistory();
        setData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === node.id ? { ...n, subGraphData: undefined } : n)
        }));
        setContextMenuNode(null);
      },
      'danger',
      "Eliminate"
    );
  };

  // Helper for context menu delete to ensure event propagation is handled
  const handleDeleteFromContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (contextMenuNode) {
      handleDeleteNode(contextMenuNode.id);
      setContextMenuNode(null);
    }
  };

  const assimilateMapData = (map: { nodes: AISuggestion[], links: Array<{ sourceLabel: string, targetLabel: string, relation: string }> }) => {
    if ((map.nodes && map.nodes.length > 0) || (map.links && map.links.length > 0)) {
      recordHistory();
      setData(prev => {
        const nextNodes = clearNewFlags(prev.nodes);
        const nextLinks = [...prev.links];
        const labelToIdMap: Record<string, string> = {};
        prev.nodes.forEach(n => { labelToIdMap[n.label.toLowerCase()] = n.id; });

        // 1. Process New Nodes
        map.nodes.forEach((suggestion) => {
          const existingNode = nextNodes.find(n => n.label.toLowerCase() === suggestion.label.toLowerCase());
          if (!existingNode) {
            const newNodeId = generateId();
            labelToIdMap[suggestion.label.toLowerCase()] = newNodeId;
            const selectedNodes = prev.nodes.filter(n => selectedNodeIds.includes(n.id));
            const baseX = selectedNodes.length > 0 ? (selectedNodes[0].x || 0) : 0;
            const baseY = selectedNodes.length > 0 ? (selectedNodes[0].y || 0) : 0;
            const safeX = isNaN(baseX) ? 0 : baseX;
            const safeY = isNaN(baseY) ? 0 : baseY;
            nextNodes.push({
              id: newNodeId,
              label: suggestion.label,
              type: suggestion.type,
              description: suggestion.description,
              x: safeX + (Math.random() - 0.5) * 400,
              y: safeY + (Math.random() - 0.5) * 400,
              isNew: true
            });
          } else {
            labelToIdMap[suggestion.label.toLowerCase()] = existingNode.id;
          }
        });

        // 2. Process New Links
        map.links.forEach(link => {
          const sId = labelToIdMap[link.sourceLabel.toLowerCase()];
          const tId = labelToIdMap[link.targetLabel.toLowerCase()];
          if (sId && tId) {
            const linkExists = nextLinks.some(l => {
              const currS = typeof l.source === 'object' ? (l.source as any).id : l.source;
              const currT = typeof l.target === 'object' ? (l.target as any).id : l.target;
              return (currS === sId && currT === tId) || (currS === tId && currT === sId);
            });
            if (!linkExists) {
              nextLinks.push({ source: sId, target: tId, relation: link.relation });
            }
          }
        });

        // 3. FORCE CONNECTION (Anti-Island Logic)
        // Ensure every newly created node is connected to *something* in the existing graph (not just other new nodes).
        // If a new node is part of a new cluster that is totally floating, we anchor the whole cluster or the node to the current context.
        const prevNodeIds = prev.nodes.map(n => n.id);
        const selectedNodes = prev.nodes.filter(n => selectedNodeIds.includes(n.id));
        const anchorNodeId = selectedNodes.length > 0 ? selectedNodes[0].id : (prevNodeIds.length > 0 ? prevNodeIds[prevNodeIds.length - 1] : null);

        if (anchorNodeId) {
          // Identify "Floating Roots": Nodes that are part of the new batch, have no connection to the main graph,
          // and arguably serve as the entry points for their own little new clusters.
          // Strategy:
          // 1. Build an adjacency graph of just the NEW nodes/links.
          // 2. Find Connected Components (clusters) within the new nodes.
          // 3. For each cluster, check if ANY node in it connects to the Main Graph.
          // 4. If a cluster is totally floating, pick ONE node from it (e.g. the one with the most edges, or just the first) and link it to the Anchor.

          const newIds = map.nodes.map(n => labelToIdMap[n.label.toLowerCase()]).filter(id => id);

          // Build adjacency for new nodes
          const adj: Record<string, string[]> = {};
          newIds.forEach(id => adj[id] = []);

          nextLinks.forEach(l => {
            const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
            if (newIds.includes(s) && newIds.includes(t)) {
              adj[s].push(t);
              adj[t].push(s);
            }
          });

          // Find clusters (Connected Components)
          const visited = new Set<string>();
          const clusters: string[][] = [];

          newIds.forEach(id => {
            if (!visited.has(id)) {
              const cluster: string[] = [];
              const queue = [id];
              visited.add(id);
              while (queue.length > 0) {
                const curr = queue.shift()!;
                cluster.push(curr);
                adj[curr].forEach(neighbor => {
                  if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                  }
                });
              }
              clusters.push(cluster);
            }
          });

          // Process each cluster
          clusters.forEach(cluster => {
            // Check if this cluster is connected to Main Graph
            const isAnchored = cluster.some(cId => {
              return nextLinks.some(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                // Link connects (Cluster Node) <-> (Main Graph Node)
                return (s === cId && prevNodeIds.includes(t)) || (t === cId && prevNodeIds.includes(s));
              });
            });

            if (!isAnchored) {
              // Cluster is floating! Link its "Root" to the Anchor.
              // Heuristic for Root: The node with the most connections? Or just the first one?
              // Using first one is usually fine as it's often the "primary" extracted concept.
              const rootId = cluster[0];

              const newLink = {
                source: anchorNodeId,
                target: rootId,
                relation: currentMode === ExplorationMode.INNOVATION ? "context" : "related"
              };

              nextLinks.push(newLink);
            }
          });
        }

        return { nodes: nextNodes, links: nextLinks };
      });
      setNotification({ message: "Knowledge map updated", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleChatSendMessage = async (content: string) => {
    if (!content.trim() || isChatProcessing) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setIsChatProcessing(true);

    try {
      const selectedNodes = data.nodes.filter(n => selectedNodeIds.includes(n.id));

      // --- PARALLEL EXECUTION ---
      const fullGraphContext = getGraphContext(data);

      // Task 1: Persona Reply (The visible part)
      const replyPromise = researchAssistantTextReply(aiSettings, newMessages, selectedNodes, data.nodes, currentMode);

      // Task 3: Background Mapping (Extract from USER input)
      const userMapPromise = extractKnowledgeMap(aiSettings, content, fullGraphContext, currentMode);

      // Task 2: Wait for Text Reply
      const aiResponseText = await replyPromise;

      // Update UI with AI reply immediately
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: Date.now(),
        wasAssimilated: true // We'll handle assimilation separately in background
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsChatProcessing(false); // Stop typing animation immediately


      // Process User-driven mapping in background
      const userMapData = await userMapPromise;
      assimilateMapData(userMapData);

      // Task 4: Background Mapping (Extract from AI reply)
      const aiMapData = await extractKnowledgeMap(aiSettings, aiResponseText, fullGraphContext, currentMode);
      assimilateMapData(aiMapData);

    } catch (e: any) {
      popError(e.message || "Nexus chat failed");
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleConfirmNexusSeed = (suggestion: AISuggestion, parentId: string) => {
    recordHistory();
    const parentNode = data.nodes.find(n => n.id === parentId);

    const newNodeId = generateId();
    const newNode: GraphNode = {
      id: newNodeId,
      label: suggestion.label,
      type: suggestion.type,
      description: suggestion.description,
      x: parentNode ? (parentNode.x || 0) + 100 : 0,
      y: parentNode ? (parentNode.y || 0) + 100 : 0,
      isNew: true
    };

    const newLink = {
      source: parentId,
      target: newNodeId,
      relation: suggestion.relationToParent
    };

    setData(prev => ({
      nodes: [...clearNewFlags(prev.nodes), newNode],
      links: [...prev.links, newLink]
    }));

    setSelectedNodeIds([newNodeId]);
    setProposingSeed(null);
    setNotification({ message: "Seed assimilated successfully", type: 'success' });
    setTimeout(() => setNotification(null), 3000);
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
    recordHistory();

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
      description: newNodeDescription.trim() || "User defined seed.",
      isRoot: data.nodes.length === 0,
      x,
      y,
      isNew: true
    };

    const newLink = addingNodeParent ? {
      source: addingNodeParent.id,
      target: newNode.id,
      relation: newNodeRelation
    } : null;

    setData(prev => ({
      nodes: [...clearNewFlags(prev.nodes), newNode],
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
    askConfirm(
      "Reset Exploration",
      "Start fresh? This will clear all seeds and connections from the current workspace. This action cannot be undone.",
      () => {
        recordHistory();
        setData({ nodes: [], links: [] });
        setSelectedNodeIds([]);
      },
      'danger',
      "Reset Workspace"
    );
  };

  const handleImFeelingLucky = async (isRetry: boolean = false) => {
    setIsGeneratingSeed(true);
    recordHistory();

    try {
      const entropy = Date.now().toString();
      const seed = await generateRandomSeedNode(aiSettings, entropy, isRetry ? discardedLuckySeeds : [], currentMode);

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
        y: 0,
        isNew: true
      };
      setData({ nodes: clearNewFlags([]), links: [] }); // Clear existing nodes and their 'isNew' flags
      setData(prev => ({ nodes: [...clearNewFlags(prev.nodes), newNode], links: [] }));
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

  // --- WIKI INTEGRATION HANDLERS ---
  const handleOpenWikiBrowser = async (node: GraphNode) => {
    // Attempt to find a matching page if it's just a search request
    setIsProcessing(true);
    try {
      const results = await searchWikipedia(node.label);
      const match = results.length > 0 ? results[0].title : node.label;
      setWikiBrowser({
        isOpen: true,
        title: match,
        url: '', // Loaded by browser component
        sourceNodeId: node.id
      });
    } catch (e) {
      popError("Failed to reach Wikipedia Nexus");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWikiHarvest = async (snippet: string, pageTitle: string) => {
    if (!wikiBrowser.sourceNodeId) return;
    const truncatedSnippet = snippet.length > 300 ? snippet.slice(0, 300) + "..." : snippet;
    const sourceNode = data.nodes.find(n => n.id === wikiBrowser.sourceNodeId);
    if (!sourceNode) return;

    setIsProcessing(true);
    recordHistory();

    try {
      const suggestion = await curateWikiSnippet(
        aiSettings,
        truncatedSnippet,
        pageTitle,
        { label: sourceNode.label, description: sourceNode.description || "" },
        currentMode
      );

      if (suggestion) {
        const newNodeId = generateId();
        const newNode: GraphNode = {
          id: newNodeId,
          label: suggestion.label,
          type: suggestion.type,
          description: suggestion.description,
          x: (sourceNode.x || 0) + 200,
          y: (sourceNode.y || 0) + (Math.random() - 0.5) * 100,
          isNew: true,
          isWikipediaSource: true,
          wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
        };

        const newLink: GraphLink = {
          source: sourceNode.id,
          target: newNodeId,
          relation: suggestion.relationToParent
        };

        setData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, newLink]
        }));

        setNotification({ message: `Grown "${suggestion.label}" from Wikipedia`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e: any) {
      popError(e.message || "Wiki harvesting failed");
    } finally {
      setIsProcessing(false);
    }
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
        <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl max-w-[60vw] overflow-hidden transition-all duration-500">

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
                    {data.nodes.length === 0 && !currentSeedFileId ? (
                      <>
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none">SEED</h1>
                        <p className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold mt-1">Shared Exploration & Emergent Discovery</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none truncate max-w-[300px]">
                          {currentSeedFileName || (data.nodes.length > 0 ? data.nodes[0].label : "Untethered Seed")}
                        </h1>
                        <p className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold mt-1 inline-flex items-center gap-1.5">
                          <Orbit size={10} className="animate-spin-slow" />
                          Seed Space
                        </p>
                      </>
                    )}
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

        {/* Discovery Monitor Pill - Integrated into Header Row */}
        {discoveryState.isActive && (
          <div className="pointer-events-auto animate-in slide-in-from-right-10 duration-700">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3 shadow-2xl flex items-center gap-5 ring-1 ring-white/10">
              <div className="flex items-center gap-3 border-r border-white/5 pr-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-sky-500 rounded-full animate-ping opacity-20"></div>
                  <BrainCircuit className="text-sky-400 relative z-10" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-sky-500/70 leading-none">{currentMode === ExplorationMode.INNOVATION ? 'Autonomous Gardener' : 'Knowledge Curator'}</span>
                  <span className="text-[11px] text-white font-medium truncate max-w-[150px]">{currentMode === ExplorationMode.INNOVATION ? 'Scanning Innovation Fog...' : 'Exploring Knowledge Horizon...'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-hidden">
                {discoveryState.history.slice(0, 1).map((item, i) => (
                  <span key={i} className="text-xs text-slate-400 animate-in fade-in slide-in-from-right-5 line-clamp-1 max-w-[180px] italic">
                    {item}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setDiscoveryState(prev => ({ ...prev, isActive: false }))}
                className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                title="Stop Discovery"
              >
                <Square size={14} fill="currentColor" className="opacity-80" />
              </button>
            </div>
          </div>
        )}

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
          <div className="absolute left-1/2 -translate-x-1/2 bottom-28 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  onClick={(e) => { e.stopPropagation(); handleCreateNewSpaceFromNode(contextMenuNode); }}
                  className="px-3 py-1.5 hover:bg-emerald-500/20 rounded-xl text-slate-300 hover:text-emerald-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <SquarePlus size={18} className="text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                  <span>New Seed Space</span>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleTraceLineage(contextMenuNode); setContextMenuNode(null); }}
                  className="px-3 py-1.5 hover:bg-fuchsia-500/20 rounded-xl text-slate-300 hover:text-fuchsia-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Search size={18} className="text-fuchsia-500 group-hover:rotate-12 transition-transform shrink-0" />
                  <span>Trace Seed</span>
                </button>

                {(contextMenuNode.type === NodeType.TECHNOLOGY ||
                  contextMenuNode.type === NodeType.INNOVATION ||
                  contextMenuNode.type === NodeType.IMPLEMENTATION ||
                  (currentMode === ExplorationMode.KNOWLEDGE && (
                    contextMenuNode.type === NodeType.THEORY ||
                    contextMenuNode.type === NodeType.CONCEPT ||
                    contextMenuNode.type === NodeType.DISCOVERY
                  ))) && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleInnovateNode(contextMenuNode); setContextMenuNode(null); }}
                        className="px-3 py-1.5 hover:bg-violet-500/20 rounded-xl text-slate-300 hover:text-violet-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                      >
                        <Cpu size={18} className="text-violet-500 group-hover:animate-pulse shrink-0" />
                        <span>{currentMode === ExplorationMode.INNOVATION ? 'Innovate' : 'Synthesize'}</span>
                      </button>

                      {currentMode === ExplorationMode.INNOVATION && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOptimizeNode(contextMenuNode); setContextMenuNode(null); }}
                            className="px-3 py-1.5 hover:bg-indigo-500/20 rounded-xl text-slate-300 hover:text-indigo-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                          >
                            <RefreshCw size={18} className="text-indigo-400 shrink-0" />
                            <span>Optimize</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStressTestNode(contextMenuNode); setContextMenuNode(null); }}
                            className="px-3 py-1.5 hover:bg-red-500/20 rounded-xl text-slate-300 hover:text-red-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                          >
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <span>Stress Test</span>
                          </button>
                          {currentMode === ExplorationMode.INNOVATION && contextMenuNode.type !== NodeType.IMPLEMENTATION && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleImplementNode(contextMenuNode); setContextMenuNode(null); }}
                              className="px-3 py-1.5 hover:bg-emerald-500/20 rounded-xl text-slate-300 hover:text-emerald-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                            >
                              <Network size={18} className="text-emerald-400 shrink-0" />
                              <span>Implement</span>
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                {(contextMenuNode.type === NodeType.PROBLEM || contextMenuNode.type === NodeType.PAIN_POINT || (currentMode === ExplorationMode.KNOWLEDGE && (contextMenuNode.type === NodeType.QUESTION || contextMenuNode.type === NodeType.EVENT))) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSolveProblem(contextMenuNode); setContextMenuNode(null); }}
                    className="px-3 py-1.5 hover:bg-emerald-500/20 rounded-xl text-slate-300 hover:text-emerald-200 transition-all flex items-center gap-3 text-xs font-semibold group"
                  >
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span>{currentMode === ExplorationMode.INNOVATION ? 'Solve' : 'Resolve'}</span>
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
                  setNewNodeRelation(currentMode === ExplorationMode.INNOVATION ? "enables" : "related to");
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
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, currentMode === ExplorationMode.INNOVATION ? 'reveals problem' : 'leads to event', 1, currentMode === ExplorationMode.INNOVATION ? NodeType.PROBLEM : NodeType.EVENT); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <AlertCircle size={16} />
                  <span>{currentMode === ExplorationMode.INNOVATION ? 'Identify Problem' : 'Identify Event'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, currentMode === ExplorationMode.INNOVATION ? 'triggers pain point' : 'involves person', 1, currentMode === ExplorationMode.INNOVATION ? NodeType.PAIN_POINT : NodeType.PERSON); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-rose-500/10 rounded-xl text-rose-400 hover:text-rose-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Heart size={16} />
                  <span>{currentMode === ExplorationMode.INNOVATION ? 'Identify Pain Point' : 'Find People'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, currentMode === ExplorationMode.INNOVATION ? 'leverages technology' : 'related location', 1, currentMode === ExplorationMode.INNOVATION ? NodeType.TECHNOLOGY : NodeType.PLACE); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-emerald-500/10 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <Cpu size={16} />
                  <span>{currentMode === ExplorationMode.INNOVATION ? 'Explore Tech' : 'Explore Places'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpandNodeSingle(contextMenuNode, 'questions', 1, NodeType.QUESTION); setContextMenuNode(null); }}
                  className="px-3 py-2 hover:bg-amber-500/10 rounded-xl text-amber-400 hover:text-amber-300 transition-all flex items-center gap-3 text-xs font-semibold group"
                >
                  <MessageCircle size={16} />
                  <span>Ask Question</span>
                </button>
              </div>

              <div className="h-px bg-white/5 mx-2 my-0.5"></div>

              {/* Advanced / Meta Tools */}
              <div className="flex flex-col gap-0.5 px-1 py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsWormholeSelectorOpen(true); setContextMenuNode(contextMenuNode); }}
                  className="px-3 py-2 hover:bg-indigo-500/10 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-3 text-xs font-semibold group active:scale-95"
                >
                  <Orbit size={16} className="group-hover:rotate-45 transition-transform" />
                  <span>Establish Wormhole</span>
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
                {currentMode === ExplorationMode.INNOVATION ? "Innovation starts with a single seed." : "Knowledge starts with a single seed."}
              </p>
              <div className="flex flex-col md:flex-row gap-4 pointer-events-auto">
                <button
                  onClick={handleAddCustomNode}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl border border-white/5 transition-all flex items-center gap-2 hover:-translate-y-1"
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
                  {isGeneratingSeed ? 'Generating...' : (currentMode === ExplorationMode.KNOWLEDGE ? "I'm feeling curious" : "I'm feeling lucky")}
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
        onToggleContextMode={() => setIsContextMode(!isContextMode)}
        onDashboard={() => setShowDashboard(true)}
        onSave={() => handleSaveSeed()}
        onToggleDiscovery={() => {
          if (!discoveryState.isActive) {
            const shouldSkipCheck = localStorage.getItem('skipDiscoveryRecommendation') === 'true';
            if (!shouldSkipCheck) {
              setShowDiscoveryRecommendation(true);
              return;
            }
          }

          setDiscoveryState(prev => {
            const isActivating = !prev.isActive;
            const selectedNodes = getSelectedNodes();
            const shouldBeQuest = isActivating && selectedNodes.length === 1;

            return {
              ...prev,
              isActive: isActivating,
              isQuest: shouldBeQuest,
              activeNodeId: shouldBeQuest ? selectedNodes[0].id : null,
              stepCount: 0
            };
          });
        }}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleManual={() => handleShowManual()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onHome={handleGoHome}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        isFilterActive={hiddenTypes.length > 0}
        isContextMode={isContextMode}
        isDiscoveryActive={discoveryState.isActive}
        isChatOpen={isChatOpen}
        isProcessing={isProcessing}
      />

      <SEEDManual
        isOpen={showManual}
        onClose={() => setShowManual(false)}
        mode={currentMode}
        isPreSelection={showWelcome}
        aiSettings={aiSettings}
        initialTab={manualTab}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={aiSettings}
        onSave={handleSaveSettings}
      />

      {/* Welcome Screen */}
      {showWelcome && (
        <WelcomeScreen
          onSelectMode={handleWelcomeModeSelect}
          settings={aiSettings}
          onUpdateSettings={handleSaveSettings}
          onShowManual={handleShowManual}
          onShowDashboard={() => {
            setShowDashboard(true);
            setShowWelcome(false);
          }}
          hasSavedSeeds={hasSavedSeeds}
        />
      )}

      {
        showDashboard && (
          <SeedsDashboard
            onLoadSeed={handleLoadSeed}
            onNewSeed={handleNewSeed}
            onClose={() => {
              setShowDashboard(false);
              if (data.nodes.length === 0) {
                setShowWelcome(true);
              }
            }}
            currentSeedId={currentSeedFileId}
            askConfirm={askConfirm}
            onSelectMode={handleWelcomeModeSelect}
            initialMode={currentMode}
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
        onUpdateLink={handleUpdateLink}
        onDeleteLink={handleDeleteLink}
        onUpdateNode={handleUpdateNode}
        onDeleteNodes={handleDeleteNodes}
        onKeepLucky={handleKeepLucky}
        onTryAgainLucky={handleTryAgainLucky}
        onInnovate={handleInnovateNode}
        onOptimize={handleOptimizeNode}
        onStressTest={handleStressTestNode}
        onImplement={handleImplementNode}
        onSolve={handleSolveProblem}
        onAnswer={handleAnswerQuestion}
        onDirectedDiscovery={handleDirectedDiscovery}
        onCreateNewSpace={handleCreateNewSpaceFromNode}
        isProcessing={isProcessing || isGeneratingSeed}
        onAssimilate={handleAssimilateNode}
        onPrune={handlePruneNode}
        onOpenWiki={handleOpenWikiBrowser}
        onSetGoalNode={handleSetGoalNode}
        onSetConstraintNode={handleSetConstraintNode}
        allLinks={data.links}
        relationOptions={RELATION_OPTIONS}
        expansionBlueprints={EXPANSION_BLUEPRINTS}
        mode={currentMode}
      />

      {/* Nexus Research Assistant */}
      <NexusAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleChatSendMessage}
        isProcessing={isChatProcessing}
        selectedNodes={getSelectedNodes()}
        onProposeSeed={(suggestion) => setProposingSeed(suggestion)}
        onClearChat={() => setChatMessages([])}
      />

      <NexusWikiBrowser
        isOpen={wikiBrowser.isOpen}
        initialTitle={wikiBrowser.title}
        onClose={() => setWikiBrowser(prev => ({ ...prev, isOpen: false }))}
        onAddSeed={handleWikiHarvest}
        isProcessing={isProcessing}
      />

      {/* Seed Proposal Confirmation */}
      {
        proposingSeed && (
          <NexusConfirmDialog
            suggestion={proposingSeed}
            parentNodes={getSelectedNodes().length > 0 ? getSelectedNodes() : [data.nodes[0]]}
            onConfirm={handleConfirmNexusSeed}
            onCancel={() => setProposingSeed(null)}
          />
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
                    {modeConfig.nodeTypes
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
                    currentMode === ExplorationMode.INNOVATION ? (
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
                    ) : (
                      newNodeType === NodeType.EVENT ? "Name of the historical event..." :
                        newNodeType === NodeType.PERSON ? "Name of the person..." :
                          newNodeType === NodeType.PLACE ? "Name of the location or civilization..." :
                            newNodeType === NodeType.THEORY ? "Name of the theory or idea..." :
                              newNodeType === NodeType.ARTIFACT ? "Name of the object or creation..." :
                                newNodeType === NodeType.MOVEMENT ? "Name of the movement..." :
                                  newNodeType === NodeType.DISCOVERY ? "What was discovered..." :
                                    newNodeType === NodeType.RELATIONSHIP ? "Nature of the connection..." :
                                      newNodeType === NodeType.CONCEPT ? "The abstract idea or concept..." :
                                        newNodeType === NodeType.ENTITY ? "Name of the entity..." :
                                          newNodeType === NodeType.QUESTION ? "What do you want to explore...?" :
                                            "What is this about...?"
                    )
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
                    currentMode === ExplorationMode.INNOVATION ? (
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
                    ) : (
                      newNodeType === NodeType.EVENT ? "When did it happen? What were the key outcomes?" :
                        newNodeType === NodeType.PERSON ? "Who were they? What were their key contributions?" :
                          newNodeType === NodeType.PLACE ? "Where is it? What is its historical or cultural significance?" :
                            newNodeType === NodeType.THEORY ? "What are the core principles? Who developed it?" :
                              newNodeType === NodeType.ARTIFACT ? "What is it? When was it created? What is its significance?" :
                                newNodeType === NodeType.MOVEMENT ? "What were the goals? Who were the key figures?" :
                                  newNodeType === NodeType.DISCOVERY ? "What was discovered? When and by whom?" :
                                    newNodeType === NodeType.RELATIONSHIP ? "How are these entities connected?" :
                                      newNodeType === NodeType.CONCEPT ? "What are the key ideas and principles?" :
                                        newNodeType === NodeType.ENTITY ? "Provide details about this entity..." :
                                          newNodeType === NodeType.QUESTION ? "What are you trying to understand?" :
                                            "Provide more context..."
                    )
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
      <WormholeSelector
        isOpen={isWormholeSelectorOpen}
        onClose={() => setIsWormholeSelectorOpen(false)}
        onSelect={handleSelectWormholeTarget}
        currentSeedId={currentSeedFileId}
        relationOptions={RELATION_OPTIONS}
      />

      {notification && (
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
      )}
      {/* Custom Confirmation Dialog */}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          type={confirmState.type}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
        />
      )}
      {/* Discovery Recommendation Dialog */}
      <DiscoveryRecommendation
        isOpen={showDiscoveryRecommendation}
        onClose={() => setShowDiscoveryRecommendation(false)}
        onConfirm={() => {
          setShowDiscoveryRecommendation(false);
          setDiscoveryState(prev => {
            const selectedNodes = getSelectedNodes();
            const shouldBeQuest = true && selectedNodes.length === 1; // Logic mirrored from direct toggle

            return {
              ...prev,
              isActive: true,
              isQuest: shouldBeQuest,
              activeNodeId: shouldBeQuest ? selectedNodes[0].id : null,
              stepCount: 0
            };
          });
        }}
        onReadDocs={() => {
          setShowDiscoveryRecommendation(false);
          handleShowManual('autonomous');
        }}
      />
    </div>
  );
}

export default App;