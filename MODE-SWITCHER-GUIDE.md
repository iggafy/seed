# Adding Mode Switcher UI - Quick Guide

## Overview
This guide shows how to add a visual mode switcher to SEED's interface.

## Option 1: Simple Toggle in Toolbar (Recommended)

Add this to `Toolbar.tsx`:

```typescript
import { Brain, Book } from 'lucide-react';
import { ExplorationMode } from '../types';

// Add to ToolbarProps interface:
interface ToolbarProps {
  // ... existing props
  currentMode: ExplorationMode;
  onModeChange: (mode: ExplorationMode) => void;
}

// Add to Toolbar component (after the "I'm Feeling Lucky" button):
<div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/10">
  <button
    onClick={() => onModeChange(ExplorationMode.INNOVATION)}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
      currentMode === ExplorationMode.INNOVATION
        ? 'bg-violet-600 text-white shadow-lg'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
    title="Innovation Mode"
  >
    <Brain size={14} />
    Innovation
  </button>
  <button
    onClick={() => onModeChange(ExplorationMode.KNOWLEDGE)}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
      currentMode === ExplorationMode.KNOWLEDGE
        ? 'bg-emerald-600 text-white shadow-lg'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
    title="Knowledge Discovery Mode"
  >
    <Book size={14} />
    Knowledge
  </button>
</div>
```

Then in `App.tsx`, pass the props:

```typescript
<Toolbar
  // ... existing props
  currentMode={currentMode}
  onModeChange={setCurrentMode}
/>
```

## Option 2: Mode Selection Modal for New Seeds

Create a new component `components/ModeSelector.tsx`:

```typescript
import React from 'react';
import { Brain, Book, X } from 'lucide-react';
import { ExplorationMode } from '../types';

interface ModeSelectorProps {
  isOpen: boolean;
  onSelect: (mode: ExplorationMode) => void;
  onClose: () => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Exploration Mode</h2>
            <p className="text-sm text-slate-400 mt-1">Select how you want to explore</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Innovation Mode */}
          <button
            onClick={() => onSelect(ExplorationMode.INNOVATION)}
            className="group p-6 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 rounded-2xl hover:border-violet-500/50 transition-all hover:scale-[1.02]"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-violet-600/20 rounded-2xl flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
              <Brain size={32} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Innovation Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore technologies, problems, and breakthrough solutions. Perfect for product development and technical innovation.
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-[10px] font-bold">TECHNOLOGY</span>
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-[10px] font-bold">PROBLEM</span>
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-[10px] font-bold">INNOVATION</span>
            </div>
          </button>

          {/* Knowledge Mode */}
          <button
            onClick={() => onSelect(ExplorationMode.KNOWLEDGE)}
            className="group p-6 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-600/20 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
              <Book size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Knowledge Discovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore topics, events, people, and their interconnections. Perfect for learning and research.
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded text-[10px] font-bold">EVENT</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded text-[10px] font-bold">PERSON</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded text-[10px] font-bold">THEORY</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
```

Then in `App.tsx`:

```typescript
import ModeSelector from './components/ModeSelector';

// Add state
const [showModeSelector, setShowModeSelector] = useState(false);

// Update handleNewSeed
const handleNewSeed = async () => {
  await handleSaveSeed(true);
  setShowModeSelector(true); // Show mode selector instead of immediately creating
};

const handleModeSelect = (mode: ExplorationMode) => {
  setCurrentMode(mode);
  setData({ nodes: [], links: [] });
  setSessionStack([]);
  setCurrentSeedFileId(undefined);
  setCurrentSeedFileName(null);
  setCurrentSessionId('root');
  setCurrentSessionName('Root');
  setShowDashboard(false);
  setDiscardedLuckySeeds([]);
  setShowModeSelector(false);
};

// Add to JSX
<ModeSelector
  isOpen={showModeSelector}
  onSelect={handleModeSelect}
  onClose={() => setShowModeSelector(false)}
/>
```

## Option 3: Mode Badge in Dashboard

Add to `SeedsDashboard.tsx`:

```typescript
import { Brain, Book } from 'lucide-react';
import { ExplorationMode } from '../types';

// In the seed card rendering:
<div className="absolute top-3 right-3">
  {seed.mode === ExplorationMode.KNOWLEDGE ? (
    <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1">
      <Book size={10} className="text-emerald-400" />
      <span className="text-[9px] font-bold text-emerald-300 uppercase">Knowledge</span>
    </div>
  ) : (
    <div className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center gap-1">
      <Brain size={10} className="text-violet-400" />
      <span className="text-[9px] font-bold text-violet-300 uppercase">Innovation</span>
    </div>
  )}
</div>
```

## Option 4: Current Mode Indicator

Add a subtle indicator in the top-right of the main view:

```typescript
// In App.tsx, add to the main container:
<div className="absolute top-4 right-4 z-10">
  <div className={`px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 ${
    currentMode === ExplorationMode.INNOVATION
      ? 'bg-violet-900/30 border-violet-500/30'
      : 'bg-emerald-900/30 border-emerald-500/30'
  }`}>
    {currentMode === ExplorationMode.INNOVATION ? (
      <>
        <Brain size={12} className="text-violet-400" />
        <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Innovation Mode</span>
      </>
    ) : (
      <>
        <Book size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Knowledge Mode</span>
      </>
    )}
  </div>
</div>
```

## Recommended Approach

**Start with Option 1 (Simple Toggle)** for immediate functionality, then add:
- Option 2 for new seed creation
- Option 3 for dashboard organization
- Option 4 for constant awareness

## Mode Switching Behavior

### Safe Approach (Recommended)
- Lock mode per seed file
- Show warning if user tries to switch with existing nodes
- Require creating a new seed to change modes

### Advanced Approach
- Allow mode switching
- Convert compatible node types (CONCEPT, ENTITY, QUESTION work in both)
- Warn about incompatible nodes
- Offer to remove or convert incompatible nodes

## Example Warning Dialog

```typescript
const handleModeChange = (newMode: ExplorationMode) => {
  if (data.nodes.length > 0) {
    askConfirm(
      "Switch Exploration Mode?",
      `Switching from ${currentMode} to ${newMode} mode with existing nodes may cause compatibility issues. Consider creating a new seed instead.`,
      () => {
        setCurrentMode(newMode);
      },
      'warning',
      "Switch Anyway"
    );
  } else {
    setCurrentMode(newMode);
  }
};
```

## Testing Your UI

1. Add the mode switcher
2. Create a new seed in Innovation Mode
3. Add some TECHNOLOGY nodes
4. Try switching to Knowledge Mode (should warn)
5. Create a new seed in Knowledge Mode
6. Add EVENT and PERSON nodes
7. Verify AI responses use appropriate language
8. Save and reload - mode should persist

## Next Steps

After adding the UI:
1. Test both modes thoroughly
2. Gather user feedback
3. Consider adding mode-specific features
4. Explore additional modes (Business, Creative, etc.)

Happy exploring! 🚀📚
