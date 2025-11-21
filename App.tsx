import React, { useState, useCallback, useEffect, useRef } from 'react';
import MindMapTree from './components/MindMapTree';
import DetailPanel from './components/DetailPanel';
import PruningStats from './components/PruningStats';
import { generateTreeStructure, expandNodeChildren } from './services/geminiService';
import { TreeNode, NodeStatus, NodeType } from './types';
import { INITIAL_DATA, USER_CONTEXT } from './constants';
import { Activity, Wand2, Leaf, Download, Upload, Save } from 'lucide-react';

const STORAGE_KEY = 'hobbyZenData';

function App() {
  // Initialize state from LocalStorage if available, else use INITIAL_DATA
  const [treeData, setTreeData] = useState<TreeNode>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
        console.error("Failed to load from storage", e);
        return INITIAL_DATA;
    }
  });

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save to LocalStorage whenever treeData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));
  }, [treeData]);

  // Helper: Flatten tree to get list of potential parents for the Move dropdown
  const getAllNodes = (node: TreeNode): {id: string, name: string, type: NodeType}[] => {
    let list: {id: string, name: string, type: NodeType}[] = [{id: node.id, name: node.name, type: node.type}];
    if (node.children) {
        node.children.forEach(child => {
            list = [...list, ...getAllNodes(child)];
        });
    }
    return list;
  };

  // 1. Update Status
  const updateNodeStatus = useCallback((id: string, status: NodeStatus) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === id) {
        const updated = { ...node, status };
        if (selectedNode?.id === id) setSelectedNode(updated);
        return updated;
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateRecursive) };
      }
      return node;
    };
    setTreeData(prev => updateRecursive(prev));
  }, [selectedNode]);

  // 2. Add Child Node (Manual)
  const handleAddNode = useCallback((parentId: string, newNode: TreeNode) => {
    const addRecursive = (node: TreeNode): TreeNode => {
      if (node.id === parentId) {
        const updated = {
            ...node,
            children: [...(node.children || []), newNode]
        };
        if (selectedNode?.id === parentId) setSelectedNode(updated);
        return updated;
      }
      if (node.children) {
        return { ...node, children: node.children.map(addRecursive) };
      }
      return node;
    };
    setTreeData(prev => addRecursive(prev));
  }, [selectedNode]);

  // 3. Delete Node
  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'root') return; // Prevent deleting root
    
    const deleteRecursive = (node: TreeNode): TreeNode => {
      if (!node.children) return node;
      return {
        ...node,
        children: node.children
            .filter(child => child.id !== nodeId)
            .map(deleteRecursive)
      };
    };

    setTreeData(prev => deleteRecursive(prev));
    setSelectedNode(null);
  }, []);

  // 4. Move Node (Re-parent)
  const handleMoveNode = useCallback((nodeId: string, newParentId: string) => {
    if (nodeId === newParentId) return;
    if (nodeId === 'root') return;

    let nodeToMove: TreeNode | null = null;

    // First pass: find and extract the node
    const findAndRemove = (node: TreeNode): TreeNode => {
        if (node.children) {
            const found = node.children.find(c => c.id === nodeId);
            if (found) {
                nodeToMove = found;
                return { ...node, children: node.children.filter(c => c.id !== nodeId) };
            }
            return { ...node, children: node.children.map(findAndRemove) };
        }
        return node;
    };

    // Second pass: insert into new parent
    const insertNode = (node: TreeNode): TreeNode => {
        if (node.id === newParentId && nodeToMove) {
            return { ...node, children: [...(node.children || []), nodeToMove] };
        }
        if (node.children) {
            return { ...node, children: node.children.map(insertNode) };
        }
        return node;
    };

    setTreeData(prev => {
        const treeWithoutNode = findAndRemove(prev);
        if (!nodeToMove) return prev; // Failed to find node
        return insertNode(treeWithoutNode);
    });
  }, []);

  // 5. AI Expand (Auto-find children)
  const handleExpandNode = async (nodeId: string) => {
    if (!selectedNode) return;
    setIsGenerating(true);
    try {
        const children = await expandNodeChildren(selectedNode.name, selectedNode.type, USER_CONTEXT);
        children.forEach(child => handleAddNode(nodeId, child));
    } catch (e) {
        alert("Failed to expand node.");
    } finally {
        setIsGenerating(false);
    }
  };

  // Full Tree Gen (Keep existing)
  const handleGenerateTree = async () => {
    if (!window.confirm("This will overwrite your current tree structure. Are you sure?")) return;
    setIsGenerating(true);
    try {
        const newTree = await generateTreeStructure(USER_CONTEXT);
        setTreeData(newTree);
    } catch (e) {
        alert("Failed to generate tree from AI.");
    } finally {
        setIsGenerating(false);
    }
  };

  // EXPORT
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `hobby-zen-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // IMPORT
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            // Basic validation
            if (json.id === 'root' && json.children) {
                setTreeData(json);
                alert("Import successful!");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Failed to parse JSON file.");
        }
    };
    reader.readAsText(fileObj);
    // Reset input
    if (event.target) event.target.value = "";
  };

  const potentialParents = getAllNodes(treeData);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar / Navigation */}
      <div className="w-16 md:w-20 flex flex-col items-center py-6 bg-white border-r border-slate-200 z-10 shadow-sm">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-8">
           <Leaf className="text-white" size={20} />
        </div>
        
        <div className="flex flex-col gap-6">
            <button 
                onClick={() => setViewMode('map')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'map' ? 'bg-slate-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Mind Map"
            >
                <Activity size={24} />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 absolute top-0 left-0 right-0 z-10">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">HobbyZen <span className="text-slate-400 font-normal">/ Visualizer</span></h1>
            
            <div className="flex items-center gap-2">
                {/* Hidden Input for Upload */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{display: 'none'}} 
                    accept=".json"
                />

                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                    title="Download Backup"
                >
                    <Download size={16} />
                    Export
                </button>

                <button 
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                    title="Upload Backup"
                >
                    <Upload size={16} />
                    Import
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <button 
                    onClick={handleGenerateTree}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-all disabled:opacity-70 shadow-md"
                >
                    <Wand2 size={16} />
                    {isGenerating ? "Analyzing..." : "Reset & Auto-Organize All"}
                </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-50 pt-16 relative">
            {/* Stats Overlay */}
            <div className="absolute top-20 left-6 z-0 opacity-90 pointer-events-none">
                <PruningStats data={treeData} />
            </div>

            {/* D3 Visualization */}
            <MindMapTree 
                data={treeData} 
                onNodeClick={setSelectedNode}
                selectedNodeId={selectedNode?.id || null}
            />
        </div>
      </div>

      {/* Right Panel (Details) */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 z-20 md:relative">
            <DetailPanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)}
                onUpdateStatus={updateNodeStatus}
                onAddNode={handleAddNode}
                onMoveNode={handleMoveNode}
                onDeleteNode={handleDeleteNode}
                onExpandNode={handleExpandNode}
                potentialParents={potentialParents}
                isProcessing={isGenerating}
            />
        </div>
      )}
    </div>
  );
}

export default App;