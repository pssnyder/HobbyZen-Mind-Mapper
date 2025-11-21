import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode, NodeStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface MindMapTreeProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  selectedNodeId: string | null;
}

const MindMapTree: React.FC<MindMapTreeProps> = ({ data, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Tree Layout
    // Use a cluster layout for a radial dendrogram or tidy tree. 
    // Horizontal Tidy Tree is usually best for readable mind maps
    const root = d3.hierarchy<TreeNode>(data);
    
    // Dynamic sizing based on node count
    const nodeCount = root.descendants().length;
    const dynamicHeight = Math.max(height, nodeCount * 30); 
    const dynamicWidth = Math.max(width, root.height * 250);

    const treeLayout = d3.tree<TreeNode>()
      .size([dynamicHeight, dynamicWidth - 200]) // Swap width/height for horizontal
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    treeLayout(root);

    // Center the tree initially
    const initialTransform = d3.zoomIdentity.translate(100, height / 2 - (root.x || 0)).scale(0.8);
    svg.call(zoom.transform, initialTransform);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1") // slate-300
      .attr("stroke-width", 1.5);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      });

    // Node Circles
    node.append("circle")
      .attr("r", d => d.data.id === 'root' ? 12 : d.data.type === 'realm' ? 10 : 6)
      .attr("fill", d => STATUS_COLORS[d.data.status as NodeStatus])
      .attr("stroke", d => d.data.id === selectedNodeId ? "#0f172a" : "#fff")
      .attr("stroke-width", d => d.data.id === selectedNodeId ? 3 : 2)
      .attr("class", "transition-all duration-300");

    // Node Labels
    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -15 : 15)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

  }, [data, dimensions, selectedNodeId, onNodeClick]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden relative">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="touch-pan-x touch-pan-y" />
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-2 rounded-lg text-xs text-slate-500 shadow border border-slate-200">
        <p>Pan: Drag empty space</p>
        <p>Zoom: Scroll / Pinch</p>
        <p>Select: Click Node</p>
      </div>
    </div>
  );
};

export default MindMapTree;
