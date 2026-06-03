import React, { useState, useMemo } from 'react';
import { DecisionTreeModel, DTNode, Patient, DISEASE_CLASSES, RandomForestModel } from '../types';
import { translateFeatureName } from '../utils/mlEngine';
import { Trees, Info, ChevronLeft, ChevronRight, HelpCircle, GitFork } from 'lucide-react';

interface TreeVisualizerProps {
  dtModel: DecisionTreeModel | null;
  rfModel: RandomForestModel | null;
  selectedPatient: Patient | null;
  activePathIds: string[]; // List of node IDs currently traversed by selected patient
}

interface RenderNode {
  node: DTNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
  isLeftChild?: boolean;
}

export default function TreeVisualizer({
  dtModel,
  rfModel,
  selectedPatient,
  activePathIds
}: TreeVisualizerProps) {
  const [selectedTreeType, setSelectedTreeType] = useState<'dt' | 'rf'>('dt');
  const [activeForestTreeIdx, setActiveForestTreeIdx] = useState<number>(0);

  // Active tree model we represent visually
  const activeTreeModel = useMemo(() => {
    if (selectedTreeType === 'dt') return dtModel;
    if (rfModel && rfModel.trees.length > activeForestTreeIdx) {
      return rfModel.trees[activeForestTreeIdx];
    }
    return null;
  }, [dtModel, rfModel, selectedTreeType, activeForestTreeIdx]);

  // Layout parameters for tree SVG mapping
  const svgWidth = 840;
  const svgHeight = 440;
  
  // Calculate spatial coordinates for all nodes in the tree recursively to plot perfectly
  const renderedNodes = useMemo(() => {
    if (!activeTreeModel || !activeTreeModel.root) return [];
    
    const list: RenderNode[] = [];
    const initialSpread = 280; // Starting width difference between branches at level 0

    const traverse = (
      node: DTNode, 
      x: number, 
      y: number, 
      spreadX: number, 
      parentX?: number, 
      parentY?: number,
      isLeft?: boolean
    ) => {
      list.push({ node, x, y, parentX, parentY, isLeftChild: isLeft });

      if (!node.isLeaf) {
        const nextY = y + 75; // vertical level spacing
        const nextSpread = spreadX * 0.52; // bisection decrement

        if (node.left) {
          traverse(node.left, x - spreadX, nextY, nextSpread, x, y, true);
        }
        if (node.right) {
          traverse(node.right, x + spreadX, nextY, nextSpread, x, y, false);
        }
      }
    };

    // Begin from root center
    traverse(activeTreeModel.root, svgWidth / 2, 40, initialSpread);
    return list;
  }, [activeTreeModel]);

  // Set default description for hover tips
  const [hoverNode, setHoverNode] = useState<DTNode | null>(null);

  // Helper: check if a node or edge resides inside the highlighting diagnostic route
  const isNodeInPath = (nodeId: string) => activePathIds.includes(nodeId);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col" id="tree_visualizer">
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Trees className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-medium text-slate-900 leading-tight">Interactive Tree Structure Drawer</h2>
            <p className="text-xs font-sans text-slate-500 mt-1">
              Select and visualize fitted split boundaries. Follow the highlighted green path for current parameters.
            </p>
          </div>
        </div>

        {/* Tree selectors */}
        <div className="flex items-center gap-2">
          {/* DT vs RF Toggles */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <button 
              onClick={() => setSelectedTreeType('dt')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                selectedTreeType === 'dt' 
                  ? 'bg-indigo-600 font-semibold text-white' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Single Tree
            </button>
            <button 
              onClick={() => {
                if (rfModel && rfModel.trees.length > 0) {
                  setSelectedTreeType('rf');
                } else {
                  alert('Please fit models first.');
                }
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                selectedTreeType === 'rf' 
                  ? 'bg-emerald-600 font-semibold text-white' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Forest Ensembles
            </button>
          </div>

          {/* Individual Tree cycler (if forest) */}
          {selectedTreeType === 'rf' && rfModel && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setActiveForestTreeIdx(idx => Math.max(0, idx - 1))}
                className="p-1 hover:bg-slate-150 rounded"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-700 px-1">
                Tree {activeForestTreeIdx + 1}/{rfModel.trees.length}
              </span>
              <button 
                onClick={() => setActiveForestTreeIdx(idx => Math.min(rfModel.trees.length - 1, idx + 1))}
                className="p-1 hover:bg-slate-150 rounded"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Traversal Info Bar */}
      <div className="bg-slate-50/80 border-b border-slate-100 flex items-center justify-between px-6 py-2">
        <span className="text-[11px] font-sans text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          {selectedPatient ? (
            <span>traversing paths for current user inputs... <strong className="font-semibold text-indigo-700">Traversed {activePathIds.length} split branches.</strong></span>
          ) : (
            <span>Highlighting is inactive. Select/Modify patient details below to trace tree parameters.</span>
          )}
        </span>
        <span className="text-[10px] font-mono font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-150">
          Ensemble Feature Subsampling: {rfModel ? `${rfModel.featureSubsamplingRatio * 100}%` : 'N/A'}
        </span>
      </div>

      {/* Tree SVG Board */}
      <div className="relative flex-1 bg-slate-50/20 p-4 border-b border-slate-100 flex items-center justify-center overflow-auto min-h-[460px]">
        {activeTreeModel ? (
          <div className="w-full max-w-[840px] aspect-[84/44] relative select-none">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full"
              id="tree_renderer_svg"
            >
              <defs>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="shadow" />
                  <feComposite in="SourceGraphic" in2="shadow" operator="over" />
                </filter>
              </defs>

              {/* Draw Connections */}
              {renderedNodes.map(({ node, x, y, parentX, parentY }) => {
                if (parentX === undefined || parentY === undefined) return null;
                const pathHighlighted = isNodeInPath(node.id) && isNodeInPath((dtModel?.root?.id === node.id || activeTreeModel?.root?.id === node.id) ? '' : activePathIds[activePathIds.indexOf(node.id) - 1]);
                const edgeSelectedColor = selectedTreeType === 'dt' ? '#6366f1' : '#10b981';
                return (
                  <g key={`edge-${node.id}`}>
                    <line
                      x1={parentX}
                      y1={parentY}
                      x2={x}
                      y2={y}
                      stroke={pathHighlighted ? edgeSelectedColor : '#e2e8f0'}
                      strokeWidth={pathHighlighted ? 3.5 : 1.5}
                      strokeDasharray={pathHighlighted ? undefined : '2 2'}
                      filter={pathHighlighted ? 'url(#glow-green)' : undefined}
                      className="transition-all duration-300"
                    />
                    {/* Tiny text labeling split condition (e.g. Yes/No or <= thresh / > thresh) */}
                    <rect 
                      x={(parentX + x) / 2 - 16} 
                      y={(parentY + y) / 2 - 8} 
                      width={32} 
                      height={16} 
                      rx={3} 
                      fill="#ffffff" 
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <text
                      x={(parentX + x) / 2}
                      y={(parentY + y) / 2 + 4}
                      textAnchor="middle"
                      className="font-mono font-semibold"
                      fontSize={8}
                      fill={pathHighlighted ? edgeSelectedColor : '#64748b'}
                    >
                      {activePathIds[activePathIds.indexOf(node.id) - 1] ? (
                        // Left branches contain lower/equality splits
                        x < parentX ? (typeof node.threshold === 'number' ? '≤' : 'Yes') : (typeof node.threshold === 'number' ? '>' : 'No')
                      ) : (
                        x < parentX ? 'Left' : 'Right'
                      )}
                    </text>
                  </g>
                );
              })}

              {/* Draw Split Nodes & Leaf Cards */}
              {renderedNodes.map(({ node, x, y }) => {
                const nodeHighlighted = isNodeInPath(node.id);
                const borderHighlight = selectedTreeType === 'dt' ? 'stroke-indigo-600' : 'stroke-emerald-600';
                
                if (node.isLeaf) {
                  // Leaf node card
                  const resClass = DISEASE_CLASSES[node.predictionClassId ?? 0];
                  return (
                    <g 
                      key={`node-${node.id}`} 
                      transform={`translate(${x - 45}, ${y - 20})`}
                      onMouseEnter={() => setHoverNode(node)}
                      onMouseLeave={() => setHoverNode(null)}
                      className="cursor-help transition-all duration-300 hover:scale-105"
                    >
                      <rect 
                        width={90} 
                        height={40} 
                        rx={6} 
                        fill="#ffffff" 
                        stroke={nodeHighlighted ? resClass.color : '#e2e8f0'} 
                        strokeWidth={nodeHighlighted ? 3 : 1}
                        filter={nodeHighlighted ? 'url(#glow-purple)' : undefined}
                        className="shadow-xs"
                      />
                      {/* Leaf color bar */}
                      <path d="M 0,6 c 0,-3.3 2.7,-6 6,-6 l 0,40 c -3.3,0 -6,-2.7 -6,-6 Z" fill={resClass.color} />
                      
                      <text 
                        x={48} 
                        y={18} 
                        textAnchor="middle" 
                        fontSize={8.5} 
                        fontWeight="700" 
                        fill={resClass.color}
                        fontFamily="sans-serif"
                      >
                        {resClass.shortName}
                      </text>
                      <text 
                        x={48} 
                        y={30} 
                        textAnchor="middle" 
                        fontSize={7.5} 
                        fill="#64748b"
                        fontFamily="monospace"
                      >
                        n = {node.samplesCount} cases
                      </text>
                    </g>
                  );
                } else {
                  // Split / decision node
                  const isNum = typeof node.threshold === 'number';
                  const displaySplitExpr = isNum 
                    ? `${translateFeatureName(node.feature || '')} ≤ ${node.threshold}`
                    : `${translateFeatureName(node.feature || '')} == '${node.threshold}'`;
                  
                  return (
                    <g 
                      key={`node-${node.id}`} 
                      transform={`translate(${x}, ${y})`}
                      onMouseEnter={() => setHoverNode(node)}
                      onMouseLeave={() => setHoverNode(null)}
                      className="cursor-help transition-all duration-300 hover:scale-105"
                    >
                      {/* Node circle */}
                      <circle 
                        r={22} 
                        fill="#ffffff" 
                        stroke={nodeHighlighted ? (selectedTreeType === 'dt' ? '#6366f1' : '#10b981') : '#cbd5e1'} 
                        strokeWidth={nodeHighlighted ? 3.5 : 1.5}
                        filter={nodeHighlighted ? 'url(#glow-purple)' : undefined}
                        className="shadow-sm"
                      />
                      
                      {/* Visual icon for split */}
                      <g transform="translate(-8, -14)">
                        <GitFork className={`w-4 h-4 ${nodeHighlighted ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </g>

                      {/* Split criteria shortened text inside node */}
                      <text 
                        y={10} 
                        textAnchor="middle" 
                        fontSize={6.5} 
                        fontWeight="700" 
                        fill="#1e293b"
                        fontFamily="monospace"
                        className="truncate max-w-[40px]"
                      >
                        {node.feature ? translateFeatureName(node.feature).split(' ')[0] : ''}
                      </text>

                      {/* Display criteria floated text on top */}
                      <rect 
                        x={-55} 
                        y={-37} 
                        width={110} 
                        height={13} 
                        rx={3} 
                        fill="#0f172a" 
                        className="opacity-95"
                      />
                      <text 
                        y={-28} 
                        textAnchor="middle" 
                        fontSize={7} 
                        fontWeight="bold" 
                        fill="#f8fafc"
                        fontFamily="monospace"
                      >
                        {displaySplitExpr}
                      </text>
                    </g>
                  );
                }
              })}
            </svg>

            {/* Hover Node Tooltip Box absolute overlays */}
            {hoverNode && (
              <div 
                className="absolute bg-slate-900 border border-slate-800 text-white rounded-xl p-3.5 shadow-2xl z-50 max-w-[240px]"
                style={{ 
                  left: `${Math.min(svgWidth - 250, (renderedNodes.find(n => n.node.id === hoverNode.id)?.x ?? 200) - 20)}px`, 
                  top: `${Math.min(svgHeight - 140, (renderedNodes.find(n => n.node.id === hoverNode.id)?.y ?? 100) + 30)}px` 
                }}
              >
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800 mb-2">
                  <span className={`w-2 h-2 rounded-full ${hoverNode.isLeaf ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    {hoverNode.isLeaf ? 'Leaf Outcome' : 'Split Node Node'}
                  </span>
                </div>
                
                <p className="text-[10px] font-sans text-slate-400">
                  Samples in branch: <strong className="text-slate-100">{hoverNode.samplesCount}</strong>
                </p>
                <p className="text-[10px] font-sans text-slate-400">
                  Impurity Gini: <strong className="text-slate-100">
                    {hoverNode.classDistribution ? (1 - (Object.values(hoverNode.classDistribution) as number[]).reduce((sum: number, v: number) => sum + Math.pow(v / (hoverNode.samplesCount || 1), 2), 0)).toFixed(3) : 'Perfect'}
                  </strong>
                </p>

                {/* Subclass ratios */}
                <div className="mt-2 space-y-1 text-[9px] font-mono border-t border-slate-800 pt-1.5">
                  <h5 className="font-semibold text-slate-500 mb-1">Class Dist (Ratio):</h5>
                  {DISEASE_CLASSES.map(cls => {
                    const count = hoverNode.classDistribution ? (hoverNode.classDistribution[cls.classId] || 0) : 0;
                    const percent = Math.round((count / (hoverNode.samplesCount || 1)) * 100);
                    return count > 0 ? (
                      <div key={cls.classId} className="flex justify-between text-slate-300">
                        <span className="truncate max-w-[110px]" style={{ color: cls.color }}>{cls.shortName}:</span>
                        <span>{percent}% ({count})</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 text-xs py-16 flex flex-col items-center gap-2">
            <GitFork className="w-8 h-8 text-slate-300 animate-bounce" />
            <span>Click RETRAIN above to calculate nodes & draw decision paths.</span>
          </div>
        )}
      </div>

      {/* SVG Footer Guide */}
      {activeTreeModel && (
        <div className="p-4 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 font-sans gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-slate-700">Guide:</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white inline-block text-center text-[9px] font-bold line-clamp-1 leading-none">○</span>
              <span>Splitting Node (Checks condition)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block shrink-0" />
              <span>Leaves (Predicts specific target subclass)</span>
            </div>
          </div>
          <p className="italic">
            Tip: Hover over any node circular or cards to study diagnostic subset distributions.
          </p>
        </div>
      )}
    </div>
  );
}
