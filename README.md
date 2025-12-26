# SEED: Shared Exploration & Emergent Discovery

**SEED** is an Electron-based conceptual exploration tool powered by AI. It uses a force-directed graph interface to help users brainstorm, visualize, and expand upon complex ideas.

## Features

### 🧠 AI-Powered Exploration
- **Concept Expansion**: Automatically generate related concepts, technologies, and problems from any node.
- **Contextual Lineage**: The AI understands the path you took (e.g., *Biology -> Computing*) and generates context-aware suggestions.
- **Deep Synergy**: Select two nodes to have the AI find a novel intersection or "Synergy" between them.
- **Trace Analysis**: Generate a narrative history or theoretical trace of a specific concept path.

### 🌐 Graph Visualization
- **Dynamic Interface**: physics-based force-directed graph (D3.js).
- **Interactive**: Drag nodes, zoom/pan, and explore connections intuitively.
- **Smart Filtering**: Toggle visibility of Concepts, Technologies, Problems, Entities, etc.

### 💾 Session Management
- **Persistence**: Save and Load your "Seeds" (exploration graphs) to your local machine.
- **Dashboard**: Manage multiple innovation sessions via a built-in dashboard.
- **Privacy**: All data is stored locally in your user data folder.

### 🤖 Multi-Provider Support
- **Google Gemini**: Optimized for fast, creative reasoning.
- **OpenAI**: Support for GPT models.
- **DeepSeek**: Specialized integration with entropy injection to ensure high variety and bypass caching.

## Getting Started

### Prerequisites
- Node.js (v18+)
- API Key (Gemini, OpenAI, or DeepSeek)

### Installation

1.  **Clone and Install**
    ```bash
    git clone https://github.com/your/repo.git
    cd SEED
    npm install
    ```

2.  **Run Development Mode**
    ```bash
    npm run electron:dev
    ```

3.  **Build for Production**
    ```bash
    npm run electron:build
    ```

## Usage

1.  **Start**: Click "I'm feeling lucky" or "Add Custom Seed" to begin.
2.  **Expand**: Right-click any node to Expand connections.
3.  **Deepen**: Double-click a node to enter a focused "Nested Session".
4.  **Save**: Use the Save icon in the toolbar to persist your work.

## Technology Stack
- **Frontend**: React, D3.js, TailwindCSS
- **Backend**: Electron (IPC), Node.js fs/promises
- **AI**: Google Generative AI SDK, OpenAI SDK

---
*Innovation starts with a single seed.*
