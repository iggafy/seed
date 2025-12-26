# SEED Multi-Mode Implementation Plan

## Overview
Transform SEED from an innovation-focused tool into a flexible knowledge discovery platform with two distinct modes:
1. **Innovation Mode** - Original functionality for exploring technologies, problems, and solutions
2. **Knowledge Discovery Mode** - New mode for exploring topics, events, people, and historical connections

## Architecture Changes

### ✅ Completed
1. **types.ts** - Extended with:
   - `ExplorationMode` enum (INNOVATION, KNOWLEDGE)
   - `ModeConfig` interface for mode-specific configurations
   - New `NodeType` values for Knowledge mode (EVENT, PERSON, PLACE, THEORY, ARTIFACT, MOVEMENT, DISCOVERY, RELATIONSHIP)
   - Added `mode` field to `SeedFile` interface

2. **constants.ts** - Comprehensive mode system:
   - `MODE_CONFIGS` with full configuration for both modes
   - Separate expansion blueprints for each mode
   - Mode-specific colors and icons for all node types
   - Helper functions: `getModeConfig()`, `getExpansionBlueprints()`, `getRelationOptions()`, `getSeedExamples()`

3. **services/aiService.ts** - Mode-aware AI service:
   - All functions now accept optional `mode` parameter
   - Prompts adapt based on mode (different personas, guidance, constraints)
   - Innovation mode: "innovation engine and product architect"
   - Knowledge mode: "knowledge curator and educational guide"

### 🔄 In Progress - App.tsx Updates

#### State Management
Add mode state to App.tsx:
```typescript
const [currentMode, setCurrentMode] = useState<ExplorationMode>(ExplorationMode.INNOVATION);
```

#### Mode Switching
- Add mode selector to Toolbar or Settings
- When switching modes:
  - Update available node types in UI
  - Update relation options
  - Update expansion blueprints
  - Optionally clear graph or warn user
  - Update AI persona context

#### AI Function Calls
Update all AI service calls to pass current mode:
- `expandConcept(..., currentMode)`
- `expandConceptTargeted(..., currentMode)`
- `generateSynergyNode(..., currentMode)`
- `traceLineageAnalysis(..., currentMode)`
- `innovateConcept(..., currentMode)`
- `solveProblem(..., currentMode)`
- `answerQuestion(..., currentMode)`
- `quickExpand(..., currentMode)`
- `autonomousDiscovery(..., currentMode)`
- `agenticDiscovery(..., currentMode)`
- `generateRandomSeedNode(..., currentMode)`
- `researchAssistantChat(..., currentMode)`

#### Persistence
- Save mode with seed files
- Load mode when opening seed files
- Prevent mixing modes (warn if trying to open Knowledge seed in Innovation mode)

### 📋 Remaining Components

#### 1. Toolbar.tsx
- Add mode switcher toggle/dropdown
- Show current mode indicator
- Update "I'm Feeling Lucky" to use mode-specific seed examples

#### 2. Sidebar.tsx
- Display mode-appropriate expansion blueprints
- Filter node type options based on current mode
- Show mode-specific relation options
- Update action buttons based on node type and mode:
  - Innovation mode: "Innovate" for TECHNOLOGY, "Solve" for PROBLEM
  - Knowledge mode: "Explore Deeper" for any node type

#### 3. SettingsModal.tsx
- Add mode selection (default mode for new seeds)
- Optionally add mode-specific AI settings

#### 4. SeedsDashboard.tsx
- Show mode badge on each seed card
- Filter seeds by mode
- Display mode-appropriate icons

#### 5. GraphCanvas.tsx
- No changes needed (already uses NODE_COLORS and NODE_ICONS from constants)

#### 6. NexusAssistant.tsx
- Pass current mode to `researchAssistantChat`
- Update UI to show mode-appropriate suggestions

## User Experience Flow

### Starting a New Seed
1. User opens dashboard
2. Clicks "New Seed"
3. Modal appears: "Choose Exploration Mode"
   - Innovation Mode: "Explore technologies, problems, and breakthrough solutions"
   - Knowledge Discovery: "Explore topics, events, people, and their interconnections"
4. User selects mode
5. Graph initializes with mode-specific context

### Switching Modes (Optional Feature)
Option A: **Prevent switching** - Mode is locked per seed file
Option B: **Allow switching** - Warn user that node types may not align, offer to convert compatible nodes

Recommendation: **Option A** for simplicity and data integrity

### Mode-Specific Features

#### Innovation Mode
- Node types: TECHNOLOGY, PROBLEM, INNOVATION, CONSTRAINT, etc.
- Actions: Innovate, Solve, Trace Lineage
- AI Persona: Technical, solution-focused
- Seed examples: Tech problems, pain points

#### Knowledge Discovery Mode
- Node types: EVENT, PERSON, PLACE, THEORY, DISCOVERY, etc.
- Actions: Explore Context, Find Connections, Timeline View
- AI Persona: Educational, contextual
- Seed examples: Historical events, influential people, theories

## Implementation Priority

### Phase 1: Core Mode Integration (Current)
1. ✅ Update types.ts
2. ✅ Update constants.ts
3. ✅ Update aiService.ts
4. 🔄 Update App.tsx state and AI calls
5. Update Toolbar.tsx with mode switcher

### Phase 2: UI Refinement
6. Update Sidebar.tsx for mode-aware actions
7. Update SeedsDashboard.tsx with mode badges
8. Update NexusAssistant.tsx

### Phase 3: Polish & Testing
9. Add mode selection modal for new seeds
10. Test all AI functions in both modes
11. Verify persistence works correctly
12. Add user documentation

## Testing Checklist

### Innovation Mode
- [ ] Create new innovation seed
- [ ] Expand TECHNOLOGY node
- [ ] Solve PROBLEM node
- [ ] Generate synergy between nodes
- [ ] Use Discovery Mode
- [ ] Save and reload seed
- [ ] Chat assistant suggests INNOVATION nodes

### Knowledge Discovery Mode
- [ ] Create new knowledge seed
- [ ] Expand EVENT node
- [ ] Explore PERSON node
- [ ] Connect THEORY to DISCOVERY
- [ ] Use Discovery Mode
- [ ] Save and reload seed
- [ ] Chat assistant suggests historical connections

## Notes
- All mode-specific logic is centralized in constants.ts
- AI service is fully mode-aware
- Backward compatibility: Existing seeds default to INNOVATION mode
- Future modes can be added by extending MODE_CONFIGS
