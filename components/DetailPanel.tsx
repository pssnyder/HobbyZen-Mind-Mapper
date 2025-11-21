import React, { useState } from 'react';
import { TreeNode, NodeStatus, NodeType } from '../types';
import { X, Trash2, Heart, DollarSign, Gift, Search, Plus, Move, Sparkles, ChevronRight } from 'lucide-react';
import { getPruningAdvice } from '../services/geminiService';

interface DetailPanelProps {
  node: TreeNode;
  onClose: () => void;
  onUpdateStatus: (id: string, status: NodeStatus) => void;
  onAddNode: (parentId: string, newNode: TreeNode) => void;
  onMoveNode: (nodeId: string, newParentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => void;
  potentialParents: {id: string, name: string, type: NodeType}[];
  isProcessing: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ 
    node, 
    onClose, 
    onUpdateStatus, 
    onAddNode, 
    onMoveNode,
    onDeleteNode,
    onExpandNode,
    potentialParents,
    isProcessing
}) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  
  // New Node Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<NodeType>('path');

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getPruningAdvice(node);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const submitAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    
    const newNode: TreeNode = {
        id: `manual-${Math.random().toString(36).substr(2, 9)}`,
        name: newItemName,
        type: newItemType,
        status: 'review',
        description: 'Manually added item',
        children: []
    };
    
    onAddNode(node.id, newNode);
    setNewItemName('');
    setShowAddForm(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl w-full md:w-96 transition-all z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 break-words">{node.name}</h2>
          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-xs font-medium bg-slate-200 text-slate-600 uppercase tracking-wider">
            {node.type}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* BUILDER TOOLS */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Plus size={12} /> Builder Tools
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
                {/* Expand w/ AI */}
                <button
                    onClick={() => onExpandNode(node.id)}
                    disabled={isProcessing}
                    className="col-span-2 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                    <Sparkles size={16} />
                    {isProcessing ? 'Scanning Context...' : `Find Related Items (AI)`}
                </button>

                {/* Add Manual Child */}
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center gap-2 p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                    <Plus size={14} /> Add Child
                </button>

                {/* Move Node */}
                {node.id !== 'root' && (
                    <button
                        onClick={() => setShowMoveForm(!showMoveForm)}
                        className="flex items-center justify-center gap-2 p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                    >
                        <Move size={14} /> Move
                    </button>
                )}
            </div>

            {/* Add Form */}
            {showAddForm && (
                <form onSubmit={submitAddNode} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Macro Lens)" 
                        className="w-full p-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        autoFocus
                    />
                    <select 
                        value={newItemType}
                        onChange={e => setNewItemType(e.target.value as NodeType)}
                        className="w-full p-2 text-sm border border-slate-300 rounded bg-white"
                    >
                        <option value="hobby">Hobby</option>
                        <option value="path">Path / Skill</option>
                        <option value="artifact">Artifact / Gear</option>
                    </select>
                    <button type="submit" className="w-full py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700">
                        Create Node
                    </button>
                </form>
            )}

            {/* Move Form */}
            {showMoveForm && node.id !== 'root' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-slate-500">Select new parent for {node.name}:</p>
                    <select 
                        className="w-full p-2 text-sm border border-slate-300 rounded bg-white"
                        onChange={(e) => {
                            onMoveNode(node.id, e.target.value);
                            setShowMoveForm(false);
                        }}
                        value=""
                    >
                        <option value="" disabled>Choose Parent...</option>
                        {potentialParents
                            .filter(p => p.id !== node.id && !p.id.startsWith(node.id)) // Simple prevention of circular structure
                            .map(p => (
                            <option key={p.id} value={p.id}>
                                {p.type.toUpperCase()} - {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        <hr className="border-slate-100" />

        {/* STATUS & ACTION */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pruning Status</h3>
            <div className="grid grid-cols-1 gap-2">
                {[
                    { id: 'keep', label: 'Keep & Focus', icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'review', label: 'Review Later', icon: Search, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { id: 'sell', label: 'Sell', icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { id: 'donate', label: 'Donate', icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'discard', label: 'Discard', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = node.status === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => onUpdateStatus(node.id, option.id as NodeStatus)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                                isSelected 
                                ? `${option.bg} ${option.color} border-${option.color.split('-')[1]}-200 ring-1 ring-${option.color.split('-')[1]}-400 shadow-sm` 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={18} className="shrink-0" />
                            <span className="font-medium text-sm">{option.label}</span>
                            {isSelected && <ChevronRight size={16} className="ml-auto opacity-50" />}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* AI ADVICE */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Insight</h3>
            </div>
            
            {!advice ? (
                <button 
                    onClick={handleGetAdvice}
                    disabled={loadingAdvice}
                    className="w-full py-3 px-4 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {loadingAdvice ? "Analyzing..." : "Should I keep this?"}
                </button>
            ) : (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-900 leading-relaxed italic">"{advice}"</p>
                    <button 
                        onClick={() => setAdvice(null)}
                        className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                    >
                        Ask again
                    </button>
                </div>
            )}
        </div>

        {/* DANGER ZONE */}
        {node.id !== 'root' && node.id !== 'mind' && node.id !== 'body' && (
             <div className="pt-4 border-t border-slate-100">
                <button 
                    onClick={() => onDeleteNode(node.id)}
                    className="w-full py-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                    <Trash2 size={12} /> Permanently Delete Node
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;