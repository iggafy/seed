import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, NodeType } from '../types';
import { NODE_COLORS, NODE_ICONS } from '../constants';

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick: (node: GraphNode | null, isMultiSelect: boolean) => void;
  onNodeDoubleClick: (node: GraphNode) => void;
  onNodeContextMenu: (node: GraphNode | null, x: number, y: number) => void;
  selectedNodeIds: string[];
  sessionId: string; // Used to trigger reset on level change
  activeDiscoveryNodeId?: string | null;
  layoutTrigger?: number;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ data, onNodeClick, onNodeDoubleClick, onNodeContextMenu,
  selectedNodeIds,
  sessionId,
  activeDiscoveryNodeId,
  layoutTrigger
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to maintain D3 state across React renders
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const lastStructureRef = useRef<string>(""); // JSON fingerprint
  const lastTriggerRef = useRef<number>(0);
  const lastSessionRef = useRef<string>("");

  // Memoize structure to detect adds/deletes
  const structureFingerprint = React.useMemo(() => {
    return JSON.stringify({
      nodes: data.nodes.map(n => ({ id: n.id, type: n.type })),
      links: data.links.map(l => {
        const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return `${s}-${t}-${l.relation}`;
      })
    });
  }, [data.nodes, data.links]);

  // Initialize graph structure once
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear mostly for HMR or remounts

    // --- DEFS (Filters & Gradients) ---
    const defs = svg.append("defs");

    // Glow Filter for selected nodes
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Inner Glow/Pulse for Nested Nodes
    const nestedGlow = defs.append("filter")
      .attr("id", "nested-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    nestedGlow.append("feGaussianBlur")
      .attr("stdDeviation", "6") // Sharper glow
      .attr("result", "blur");

    // Gradients for each Node Type (Sphere effect)
    Object.keys(NODE_COLORS).forEach((key) => {
      const type = key as NodeType;
      const color = NODE_COLORS[type];

      const grad = defs.append("radialGradient")
        .attr("id", `grad-${type}`)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");

      // Highlight
      grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(color)?.brighter(1.5).formatHex() || "#fff")
        .attr("stop-opacity", 0.8);

      // Main Body
      grad.append("stop")
        .attr("offset", "40%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.6);

      // Shadow/Edge
      grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(color)?.darker(2).formatHex() || "#000")
        .attr("stop-opacity", 0.4);
    });

    // Wormhole Gradient
    const wormholeGrad = defs.append("radialGradient")
      .attr("id", "wormhole-grad")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    wormholeGrad.append("stop").attr("offset", "0%").attr("stop-color", "#8b5cf6").attr("stop-opacity", 0.9);
    wormholeGrad.append("stop").attr("offset", "70%").attr("stop-color", "#4c1d95").attr("stop-opacity", 0.5);
    wormholeGrad.append("stop").attr("offset", "100%").attr("stop-color", "#1e1b4b").attr("stop-opacity", 0);

    // Arrow Marker (Standard)
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10) // Exactly at the tip
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8")
      .attr("opacity", 0.4);

    // Flow Marker (Bright)
    defs.append("marker")
      .attr("id", "arrow-flow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ffffff")
      .attr("opacity", 0.8);

    // Trace Marker (Closer to node)
    defs.append("marker")
      .attr("id", "arrow-trace")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8")
      .attr("opacity", 0.4);

    // Main Group
    const g = svg.append("g");
    gRef.current = g;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        onNodeContextMenu(null, 0, 0); // Close menu on zoom
      });

    svg.call(zoom).on("dblclick.zoom", null);

    zoomRef.current = zoom;

    // Initialize Simulation
    const simulation = d3.forceSimulation<GraphNode, GraphLink>()
      .force("link", d3.forceLink<GraphNode, GraphLink>()
        .id(d => d.id)
        .distance(d => (d.target as GraphNode).type === NodeType.TRACE ? 50 : 180) // Shorter distance for Trace
      )
      .force("charge", d3.forceManyBody().strength(-500)) // Stronger repulsion for clarity
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(d => (d.type === NodeType.TRACE ? 35 : 60))); // Dynamic collision radius

    simulationRef.current = simulation;

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, []); // Run once on mount

  // Handle Structure View (Relayout) and Session Transitions
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const isManualTrigger = layoutTrigger !== lastTriggerRef.current;
    const isSessionChange = sessionId !== lastSessionRef.current;
    const isStructuralChange = structureFingerprint !== lastStructureRef.current;

    // 1. Reset Zoom on manual trigger or session change
    if (isManualTrigger || isSessionChange) {
      svg.transition().duration(sessionId === 'root' && !isManualTrigger ? 0 : 1000).call(zoomRef.current.transform, d3.zoomIdentity);
    }

    // 2. Restart simulation with fresh energy for any structural or layout event
    if (simulationRef.current && (isManualTrigger || isSessionChange || isStructuralChange)) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2));

      // Temporarily boost repulsion/collision to "un-entangle"
      const charge = simulationRef.current.force("charge") as d3.ForceManyBody<GraphNode>;
      if (charge) charge.strength(-1500);

      simulationRef.current.alpha(1).restart();

      // Restore normal repulsion after a delay
      setTimeout(() => {
        if (simulationRef.current) {
          const normalCharge = simulationRef.current.force("charge") as d3.ForceManyBody<GraphNode>;
          if (normalCharge) normalCharge.strength(-500);
          simulationRef.current.alphaTarget(0);
        }
      }, 1000);
    }

    // Sync refs
    lastTriggerRef.current = layoutTrigger || 0;
    lastSessionRef.current = sessionId;
    lastStructureRef.current = structureFingerprint;

  }, [layoutTrigger, sessionId, structureFingerprint]);


  // Update Data and Simulation
  useEffect(() => {
    if (!simulationRef.current || !gRef.current) return;

    const simulation = simulationRef.current;
    const g = gRef.current;

    const currentNodes = simulation.nodes() as GraphNode[];
    const nodeMap = new Map<string, GraphNode>(currentNodes.map(n => [n.id, n]));

    const nodes = data.nodes.map(n => {
      const existing = nodeMap.get(n.id) as GraphNode | undefined;
      if (existing) {
        // Capture current simulation state to avoid snapping to stale positions in React data.nodes
        const { x, y, vx, vy, fx, fy } = existing;
        // Merge newest properties from props
        Object.assign(existing, n);
        // Restore simulation state
        existing.x = x;
        existing.y = y;
        existing.vx = vx;
        existing.vy = vy;
        existing.fx = fx;
        existing.fy = fy;

        if (!n.hasOwnProperty('subGraphData')) {
          existing.subGraphData = undefined;
        }
        return existing;
      }
      return { ...n };
    });

    const links = data.links.map(l => ({ ...l }));

    simulation.nodes(nodes);
    const linkForce = simulation.force<d3.ForceLink<GraphNode, GraphLink>>("link");
    if (linkForce) {
      linkForce.links(links);
      // Re-apply distance based on updated links
      linkForce.distance(d => (d.target as GraphNode).type === NodeType.TRACE ? 50 : 180);
    }

    // Update collision force for new nodes
    simulation.force("collide", d3.forceCollide(d => (d.type === NodeType.TRACE ? 35 : 60)));


    // --- D3 UPDATE PATTERN ---

    // 1. LINKS
    const getLinkId = (d: GraphLink) => {
      const s = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
      const t = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
      return `${s}-${t}-${d.relation}`;
    };

    const linkSelection = g.selectAll<SVGLineElement, GraphLink>("line.link")
      .data(links, getLinkId);

    const linkEnter = linkSelection.enter().append("line")
      .attr("class", "link")
      .attr("stroke", "#64748b") // Slate 500
      .attr("stroke-opacity", 0.2) // Very subtle base
      .attr("stroke-width", 1.5);

    linkSelection.exit().remove();
    const allLinks = linkEnter.merge(linkSelection)
      .attr("stroke-dasharray", d => (d.target as GraphNode).type === NodeType.TRACE ? "4 3" : "none") // Dotted for Trace
      .attr("marker-end", d => (d.target as GraphNode).type === NodeType.TRACE ? "url(#arrow-trace)" : "url(#arrow)");

    // 1.5 FLOW LINES (Animated)
    const flowSelection = g.selectAll<SVGLineElement, GraphLink>("line.link-flow-line")
      .data(links, getLinkId);

    const flowEnter = flowSelection.enter().append("line")
      .attr("class", "link-flow-line link-flow")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5)
      .style("pointer-events", "none");

    flowSelection.exit().remove();
    const allFlows = flowEnter.merge(flowSelection)
      .attr("stroke", d => NODE_COLORS[(d.target as GraphNode).type] || "#3b82f6")
      .style("display", d => (d.target as GraphNode).type === NodeType.TRACE ? "none" : "block"); // No flow on traces

    // 2. LINK LABELS
    const labelSelection = g.selectAll<SVGTextElement, GraphLink>("text.link-label")
      .data(links, getLinkId);

    const labelEnter = labelSelection.enter().append("text")
      .attr("class", "link-label")
      .attr("font-size", "9px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", 0.8)
      .style("font-family", "sans-serif");

    labelSelection.exit().remove();
    const allLabels = labelEnter.merge(labelSelection)
      .text(d => (d.target as GraphNode).type === NodeType.TRACE ? "" : d.relation); // Hide label for short trace links


    // 3. NODES
    const nodeSelection = g.selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes, d => d.id);

    const nodeEnter = nodeSelection.enter().append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Wormhole Effect (Behind the node)
    nodeEnter.append("circle")
      .attr("class", "node-wormhole-vortex")
      .attr("r", 0)
      .attr("fill", "url(#wormhole-grad)")
      .attr("opacity", 0)
      .style("pointer-events", "none");

    // Nested Session Indicator (Outer Pulse)
    // We add this BEFORE the body so it sits behind
    nodeEnter.append("circle")
      .attr("class", "node-nested-glow")
      .attr("r", 0) // Animate to larger
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 0)
      .attr("opacity", 0);

    // Discovery Scanner (for active discovery node)
    nodeEnter.append("circle")
      .attr("class", "node-discovery-scanner")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6") // Blue 500
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .style("pointer-events", "none");

    // Node Body (The "Orb")
    // Use function for attributes to handle different node sizes immediately
    nodeEnter.append("circle")
      .attr("class", "node-body")
      .attr("r", d => d.type === NodeType.TRACE ? 16 : 28)
      .style("cursor", "pointer")
      // We set fill in the merge step to handle updates
      .attr("stroke", "transparent")
      .attr("stroke-width", 0);

    // Node Ring (Selection Indicator)
    nodeEnter.append("circle")
      .attr("class", "node-ring")
      .attr("r", d => d.type === NodeType.TRACE ? 20 : 32)
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("stroke-width", 1.5)
      .style("pointer-events", "none");

    // Icon
    nodeEnter.append("path")
      .attr("class", "node-icon")
      .style("pointer-events", "none")
      .attr("opacity", 0.9);

    // Tesseract Indicator (for nodes with internal spaces)
    const tesseract = nodeEnter.append("g")
      .attr("class", "tesseract-indicator")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick(d); // Trigger "Seed In" logic
      })
      .on("mouseenter", function () {
        d3.select(this).select("circle").transition().duration(200).attr("fill", "#3b82f6").attr("r", 14);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").transition().duration(200).attr("fill", "#0f172a").attr("r", 12);
      });

    tesseract.append("circle")
      .attr("r", 12)
      .attr("fill", "#0f172a")
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 1)
      .attr("opacity", 0.9)
      .style("filter", "url(#glow)");

    // The Tesseract Geometry (Cube within a Cube)
    tesseract.append("path")
      .attr("d", "M-5,-5 L5,-5 L5,5 L-5,5 Z M-2.5,-2.5 L2.5,-2.5 L2.5,2.5 L-2.5,2.5 Z M-5,-5 L-2.5,-2.5 M5,-5 L2.5,-2.5 M5,5 L2.5,2.5 M-5,5 L-2.5,2.5")
      .attr("stroke", "white")
      .attr("stroke-width", 1.25)
      .attr("fill", "none")
      .style("pointer-events", "none");


    // Text Label Background (Pill)
    nodeEnter.append("rect")
      .attr("class", "label-bg")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("height", 18)
      .attr("fill", "#0f172a") // Dark background for text
      .attr("opacity", 0.8)
      .style("pointer-events", "none");

    // Text Label
    nodeEnter.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#e2e8f0")
      .style("pointer-events", "none")
      .style("font-family", "sans-serif")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,1)");

    // Wikipedia Source Indicator
    const wikiBadge = nodeEnter.append("g")
      .attr("class", "wiki-source-badge")
      .style("pointer-events", "none")
      .attr("opacity", 0);

    wikiBadge.append("circle")
      .attr("r", 7)
      .attr("fill", "#ffffff")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1);

    wikiBadge.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3px")
      .attr("font-size", "8px")
      .attr("font-weight", "900")
      .attr("fill", "#0f172a")
      .text("W");


    nodeSelection.exit().transition().duration(300).attr("opacity", 0).remove();

    const allNodes = nodeEnter.merge(nodeSelection);

    // Update Wormhole Vortex
    allNodes.select("circle.node-wormhole-vortex")
      .attr("r", d => d.isWormhole ? (d.type === NodeType.TRACE ? 35 : 55) : 0)
      .attr("opacity", d => d.isWormhole ? 0.8 : 0)
      .each(function (d) {
        if (d.isWormhole) {
          d3.select(this)
            .append("animateTransform")
            .attr("attributeName", "transform")
            .attr("type", "rotate")
            .attr("from", "0 0 0")
            .attr("to", "360 0 0")
            .attr("dur", "4s")
            .attr("repeatCount", "indefinite");
        }
      });

    // Update Nested Glow Indicator
    allNodes.select("circle.node-nested-glow")
      .attr("r", d => {
        const r = d.type === NodeType.TRACE ? 24 : 40;
        return d.isRoot ? r * 1.2 : r;
      })
      .attr("opacity", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? 0.7 : 0)
      .attr("stroke", d => NODE_COLORS[d.type])
      .attr("stroke-width", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? 2.5 : 0)
      .style("filter", "url(#nested-glow)");

    // Update Discovery Scanner
    allNodes.select(".node-discovery-scanner")
      .attr("opacity", d => (d.id === activeDiscoveryNodeId) ? 0.6 : 0)
      .attr("r", d => (d.id === activeDiscoveryNodeId) ? 55 : 45);

    // Dash ghost links
    allLinks
      .attr("stroke-dasharray", (l: any) => l.isGhost ? "5,5" : "none")
      .attr("opacity", (l: any) => l.isGhost ? 0.4 : 1);

    // Dash ghost nodes
    allNodes.select("circle.node-body")
      .attr("stroke-dasharray", d => d.isGhost ? "4,4" : "none")
      .attr("stroke-width", d => d.isGhost ? 2 : 0) // Ghost nodes have a dashed stroke, normal nodes have 0
      .attr("opacity", d => d.isGhost ? 0.7 : 1);

    // Add simple animation for the glow if it exists
    allNodes.each(function (d) {
      const glow = d3.select(this).select("circle.node-nested-glow");
      const scanner = d3.select(this).select("circle.node-discovery-scanner");

      // 1. Nested Pulse (Existing)
      if (d.subGraphData && d.subGraphData.nodes.length > 0) {
        if (glow.attr("data-pulsing") !== "true") {
          glow.attr("data-pulsing", "true");
          const pulse = () => {
            glow.transition()
              .duration(1500)
              .attr("r", d => d.type === NodeType.TRACE ? (d.isRoot ? 28 * 1.2 : 28) : (d.isRoot ? 46 * 1.2 : 46))
              .attr("opacity", 0.3)
              .attr("stroke-width", 1.5)
              .transition()
              .duration(1500)
              .attr("r", d => d.type === NodeType.TRACE ? (d.isRoot ? 24 * 1.2 : 24) : (d.isRoot ? 40 * 1.2 : 40))
              .attr("opacity", 0.8)
              .attr("stroke-width", 2.5)
              .on("end", pulse);
          };
          pulse();
        }
      } else {
        glow.interrupt();
        glow.attr("data-pulsing", "false");
        glow.attr("opacity", 0);
      }
    });


    // Update Node Visuals
    // Interaction Handlers (Attached to group for better hit area)
    allNodes
      .on("contextmenu", (event, d) => {
        event.preventDefault();
        onNodeContextMenu(d, event.clientX, event.clientY);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        const isMultiSelect = event.shiftKey || event.metaKey || event.ctrlKey;
        onNodeClick(d, isMultiSelect);
      })
      .on("dblclick", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        onNodeDoubleClick(d);
      });

    allNodes.select("circle.node-body")
      .attr("r", d => {
        const r = d.type === NodeType.TRACE ? 16 : 28;
        return d.isRoot ? r * 1.2 : r;
      })
      .attr("fill", d => `url(#grad-${d.type})`)
      .attr("stroke", "transparent")
      .attr("stroke-width", 0)
      // Apply glow filter if selected or root
      .attr("filter", d => (selectedNodeIds.includes(d.id) || d.isRoot) ? "url(#glow)" : null);

    // Update Selection Ring
    allNodes.select("circle.node-ring")
      .attr("r", d => {
        const r = d.type === NodeType.TRACE ? 20 : 32;
        return d.isRoot ? r * 1.2 : r;
      })
      .attr("stroke", d => {
        if (d.isRoot) return "#a855f7"; // Persistent Purple for Root
        return selectedNodeIds.includes(d.id) ? "rgba(255,255,255,0.6)" : "transparent";
      })
      .attr("stroke-width", d => d.isRoot ? 3 : 1.5)
      .attr("stroke-dasharray", d => (selectedNodeIds.includes(d.id) && !d.isRoot) ? "4 2" : "none");

    // Update Icon
    allNodes.select("path.node-icon")
      .attr("transform", d => {
        const scale = d.isRoot ? 1.2 : 1;
        return d.type === NodeType.TRACE
          ? `translate(${-8 * scale}, ${-8 * scale}) scale(${0.66 * scale})`
          : `translate(${-12 * scale}, ${-12 * scale}) scale(${1 * scale})`;
      })
      .attr("d", d => NODE_ICONS[d.type])
      .attr("fill", "#ffffff");

    // Update Tesseract Indicator
    allNodes.select("g.tesseract-indicator")
      .attr("transform", d => {
        const offset = d.type === NodeType.TRACE ? (d.isRoot ? 18 : 16) : (d.isRoot ? 38 : 34);
        return `translate(${offset}, -${offset})`;
      })
      .style("opacity", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? 1 : 0)
      .style("pointer-events", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? "auto" : "none");

    // Update Wikipedia Source Badge
    allNodes.select("g.wiki-source-badge")
      .attr("transform", d => {
        const offset = d.type === NodeType.TRACE ? (d.isRoot ? 14 : 12) : (d.isRoot ? 26 : 22);
        return `translate(${offset}, ${offset})`;
      })
      .attr("opacity", d => d.isWikipediaSource ? 1 : 0);

    // Update Text & Pill
    allNodes.select("text")
      .attr("x", 0)
      .attr("y", d => {
        const base = d.type === NodeType.TRACE ? 32 : 47;
        return d.isRoot ? base + 8 : base;
      })
      .text(d => d.label)
      .each(function (d) {
        // Dynamic pill sizing based on text width
        const bbox = this.getBBox();
        const padding = 12;
        d3.select(this.parentNode as Element).select("rect.label-bg")
          .attr("width", bbox.width + padding)
          .attr("x", -(bbox.width + padding) / 2)
          .attr("y", d.type === NodeType.TRACE ? (d.isRoot ? 28 : 20) : (d.isRoot ? 43 : 35));
      });


    // Tick Function
    simulation.on("tick", () => {
      const getNodeRadius = (d: GraphNode) => {
        const baseR = d.type === NodeType.TRACE ? 16 : 28;
        return d.isRoot ? baseR * 1.2 : baseR;
      };

      allLinks
        .each(function (d) {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist === 0) return;

          const sourceR = getNodeRadius(source);
          const targetR = getNodeRadius(target);

          d3.select(this)
            .attr("x1", source.x! + (dx * sourceR) / dist)
            .attr("y1", source.y! + (dy * sourceR) / dist)
            .attr("x2", target.x! - (dx * targetR) / dist)
            .attr("y2", target.y! - (dy * targetR) / dist);
        });

      allFlows
        .each(function (d) {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist === 0) return;

          const sourceR = getNodeRadius(source);
          const targetR = getNodeRadius(target);

          d3.select(this)
            .attr("x1", source.x! + (dx * sourceR) / dist)
            .attr("y1", source.y! + (dy * sourceR) / dist)
            .attr("x2", target.x! - (dx * targetR) / dist)
            .attr("y2", target.y! - (dy * targetR) / dist);
        });

      allLabels
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      allNodes
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Structural change check is now handled in the layout effect

    // Drag Handlers
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      onNodeContextMenu(null, 0, 0);
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [data, selectedNodeIds]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
      <svg ref={svgRef} className="w-full h-full relative z-10" onClick={(e) => {
        if (e.target === svgRef.current) {
          onNodeClick(null, false);
          onNodeContextMenu(null, 0, 0);
        }
      }} />
    </div>
  );
};

export default GraphCanvas;