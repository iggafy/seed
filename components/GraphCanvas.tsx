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
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ data, onNodeClick, onNodeDoubleClick, onNodeContextMenu, selectedNodeIds, sessionId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs to maintain D3 state across React renders
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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

    // Arrow Marker
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 32) // Pushed back a bit to sit outside the node glow
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b")
      .attr("opacity", 0.6);

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

  // Reset Zoom/Center when Session Changes
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    
    if (simulationRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2));
        simulationRef.current.alpha(1).restart();
    }
  }, [sessionId]);


  // Update Data and Simulation
  useEffect(() => {
    if (!simulationRef.current || !gRef.current) return;

    const simulation = simulationRef.current;
    const g = gRef.current;

    const currentNodes = simulation.nodes();
    const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

    const nodes = data.nodes.map(n => {
      const existing = nodeMap.get(n.id);
      if (existing) {
        return Object.assign(existing, n); 
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
      .attr("stroke-opacity", 0.3) // More subtle
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrow)");
    
    linkSelection.exit().remove();
    const allLinks = linkEnter.merge(linkSelection)
        .attr("stroke-dasharray", d => (d.target as GraphNode).type === NodeType.TRACE ? "4 3" : "none"); // Dotted for Trace

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
    
    // Nested Session Indicator (Outer Pulse)
    // We add this BEFORE the body so it sits behind
    nodeEnter.append("circle")
        .attr("class", "node-nested-glow")
        .attr("r", 0) // Animate to larger
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 0)
        .attr("opacity", 0);

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
      .style("pointer-events", "none")
      .attr("opacity", 0.9);

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

    nodeSelection.exit().transition().duration(300).attr("opacity", 0).remove();

    const allNodes = nodeEnter.merge(nodeSelection);

    // Update Nested Glow Indicator
    allNodes.select("circle.node-nested-glow")
      .attr("r", d => d.type === NodeType.TRACE ? 24 : 40)
      .attr("opacity", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? 0.7 : 0) // Increased base opacity
      .attr("stroke", d => NODE_COLORS[d.type])
      .attr("stroke-width", d => (d.subGraphData && d.subGraphData.nodes.length > 0) ? 2.5 : 0) // Thicker stroke
      .style("filter", "url(#nested-glow)");

    // Add simple animation for the glow if it exists
    allNodes.each(function(d) {
        const el = d3.select(this).select("circle.node-nested-glow");
        if (d.subGraphData && d.subGraphData.nodes.length > 0) {
            // Pulse animation manually with D3 since CSS keyframes are annoying to inject dynamically
            function pulse() {
                el.transition()
                  .duration(1500)
                  .attr("r", d.type === NodeType.TRACE ? 28 : 46) // Larger expansion
                  .attr("opacity", 0.3)
                  .attr("stroke-width", 1.5)
                  .transition()
                  .duration(1500)
                  .attr("r", d.type === NodeType.TRACE ? 24 : 40) // Back to base
                  .attr("opacity", 0.8) // Brighter peak
                  .attr("stroke-width", 2.5)
                  .on("end", pulse);
            }
            pulse();
        } else {
            el.interrupt(); // Stop animation if no longer nested
            el.attr("opacity", 0);
        }
    });


    // Update Node Visuals
    allNodes.select("circle.node-body")
      .attr("r", d => d.type === NodeType.TRACE ? 16 : 28)
      .attr("fill", d => `url(#grad-${d.type})`)
      // Apply glow filter if selected
      .attr("filter", d => selectedNodeIds.includes(d.id) ? "url(#glow)" : null)
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

    // Update Selection Ring
    allNodes.select("circle.node-ring")
      .attr("r", d => d.type === NodeType.TRACE ? 20 : 32)
      .attr("stroke", d => selectedNodeIds.includes(d.id) ? "rgba(255,255,255,0.6)" : "transparent")
      .attr("stroke-dasharray", d => selectedNodeIds.includes(d.id) ? "4 2" : "none");

    // Update Icon
    allNodes.select("path")
       .attr("transform", d => d.type === NodeType.TRACE ? "translate(-8, -8) scale(0.66)" : "translate(-12, -12) scale(1)")
       .attr("d", d => NODE_ICONS[d.type])
       .attr("fill", "#ffffff"); 
    
    // Update Text & Pill
    allNodes.select("text")
       .attr("x", 0)
       .attr("y", d => d.type === NodeType.TRACE ? 32 : 47)
       .text(d => d.label)
       .each(function(d) {
           // Dynamic pill sizing based on text width
           const bbox = this.getBBox();
           const padding = 12;
           d3.select(this.parentNode as Element).select("rect.label-bg")
             .attr("width", bbox.width + padding)
             .attr("x", -(bbox.width + padding) / 2)
             .attr("y", d.type === NodeType.TRACE ? 20 : 35);
       });


    // Tick Function
    simulation.on("tick", () => {
      allLinks
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      allLabels
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      allNodes
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    simulation.alpha(0.3).restart();

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