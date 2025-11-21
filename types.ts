export type NodeType = 'root' | 'realm' | 'hobby' | 'path' | 'artifact';
export type NodeStatus = 'keep' | 'review' | 'discard' | 'sell' | 'donate';

export interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  value?: number; // For D3 sizing
  description?: string;
  fulfillmentScore?: number; // 0-10
  children?: TreeNode[];
  collapsed?: boolean;
}

export interface GeminiAnalysisResult {
  tree: TreeNode;
  suggestions: string[];
}
