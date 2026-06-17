'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Background, 
  useNodesState, 
  useEdgesState, 
  Panel, 
  BackgroundVariant,
  MarkerType,
  Position,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Play, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  Send, 
  MessageSquare, 
  Shield, 
  Code, 
  Zap, 
  FileText, 
  Maximize2, 
  Grid, 
  Map, 
  Loader2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Globe,
  Settings,
  Compass,
  Cpu,
  RefreshCw
} from 'lucide-react';

// Custom Node Component to render workflow agents, triggers, conditions, and outputs with high legibility
const CustomNode = React.memo(({ data, selected }: any) => {
  const { 
    type = 'agent', 
    label, 
    role, 
    status = 'idle', 
    fields = [], 
    collapsed = false, 
    onToggleCollapse,
    actions = []
  } = data;

  // Determine styling color tokens based on type
  let headerBg = 'bg-gray-50';
  let headerText = 'text-gray-600 border-gray-200';
  let leftBorderColor = 'border-gray-400';
  let badgeLabel = 'AGENT';
  let badgeClass = 'bg-gray-100 text-gray-800';

  if (type === 'trigger') {
    headerBg = 'bg-[#EFF6FF]';
    headerText = 'text-[#2563EB] border-[#EFF6FF]';
    leftBorderColor = 'border-[#2563EB]';
    badgeLabel = 'TRIGGER';
    badgeClass = 'bg-blue-100 text-blue-800';
  } else if (type === 'condition') {
    headerBg = 'bg-[#FFF4ED]';
    headerText = 'text-[#F97316] border-[#FFF4ED]';
    leftBorderColor = 'border-[#F97316]';
    badgeLabel = 'COND';
    badgeClass = 'bg-orange-100 text-orange-800';
  } else if (type === 'agent') {
    headerBg = 'bg-[#F5F3FF]';
    headerText = 'text-[#7C3AED] border-[#F5F3FF]';
    leftBorderColor = 'border-[#7C3AED]';
    badgeLabel = 'AGENT';
    badgeClass = 'bg-purple-100 text-purple-800';
  } else if (type === 'tool') {
    headerBg = 'bg-[#F0FDF4]';
    headerText = 'text-[#16A34A] border-[#F0FDF4]';
    leftBorderColor = 'border-[#16A34A]';
    badgeLabel = 'TOOL';
    badgeClass = 'bg-green-100 text-green-800';
  } else if (type === 'output') {
    headerBg = 'bg-[#FDF2F8]';
    headerText = 'text-[#DB2777] border-[#FDF2F8]';
    leftBorderColor = 'border-[#DB2777]';
    badgeLabel = 'OUTPUT';
    badgeClass = 'bg-pink-100 text-pink-800';
  }

  let leftBorderStyled = leftBorderColor;
  let containerClass = 'bg-white border border-gray-200';
  let opacityClass = 'opacity-100';

  if (status === 'disabled') {
    opacityClass = 'opacity-60 grayscale-[15%]';
    containerClass = 'bg-white border border-dashed border-gray-200';
  } else if (status === 'running') {
    containerClass = 'bg-white border border-blue-400 ring-4 ring-blue-100';
  } else if (status === 'success') {
    leftBorderStyled = 'border-[#22C55E]';
  } else if (status === 'error') {
    leftBorderStyled = 'border-[#EF4444]';
    badgeClass = 'bg-red-100 text-red-800';
  }

  if (selected) {
    containerClass = 'bg-white border-2 border-[#2563EB] shadow-[0_0_0_4px_#BFDBFE]';
  }

  const getHeaderIcon = () => {
    if (status === 'running') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
    if (status === 'success') {
      return <Check className="w-4 h-4 text-[#22C55E]" />;
    }
    if (status === 'error') {
      return <X className="w-4 h-4 text-[#EF4444]" />;
    }
    if (type === 'trigger') return <Zap className="w-4 h-4" />;
    if (type === 'condition') return <Shield className="w-4 h-4" />;
    if (type === 'agent') {
      if (label.toLowerCase().includes('devin')) return <Code className="w-4 h-4" />;
      if (label.toLowerCase().includes('priscilla')) return <Shield className="w-4 h-4" />;
      if (label.toLowerCase().includes('gigi')) return <MessageSquare className="w-4 h-4" />;
      return <MessageSquare className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden min-w-[320px] max-w-[365px] transition-all duration-150 relative ${containerClass} ${opacityClass}`} 
      style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: leftBorderStyled }}
    >
      {/* Running Pulsing Overlay */}
      {status === 'running' && (
        <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#3B82F6] animate-pulse" />
      )}

      {/* React Flow Connection Handles */}
      {type !== 'trigger' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3.5 h-3.5 bg-[#2563EB] border-2 border-white rounded-full -left-2"
          style={{ top: '50%' }}
        />
      )}
      {type !== 'output' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3.5 h-3.5 bg-[#2563EB] border-2 border-white rounded-full -right-2"
          style={{ top: '50%' }}
        />
      )}

      {/* Special handles for the rejection loop */}
      {label.toLowerCase().includes('gigi') && (
        <Handle 
          type="target"
          position={Position.Bottom}
          id="rejection-target"
          className="w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full -bottom-2"
        />
      )}
      {label.toLowerCase().includes('compliance') && (
        <Handle 
          type="source"
          position={Position.Top}
          id="rejection-source"
          className="w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full -top-2"
        />
      )}

      {/* Header */}
      <div 
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${headerBg} ${headerText}`}
        style={{ padding: '10px 14px' }}
      >
        <div className="flex items-center gap-2">
          {getHeaderIcon()}
          <span className="text-xs font-bold tracking-wider uppercase font-mono">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className={`text-[9px] font-bold uppercase tracking-wider rounded-full ${badgeClass}`}
            style={{ padding: '3px 8px' }}
          >
            {badgeLabel}
          </span>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }} 
            className="p-1 rounded hover:bg-black/5"
          >
            <MoreHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 flex flex-col gap-3" style={{ padding: '14px' }}>
          {role && (
            <div className="text-[11px] font-mono text-gray-500 font-semibold">{role}</div>
          )}

          {/* Running agent speaking message */}
          {status === 'running' && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700 leading-relaxed font-mono flex items-start gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[10px] uppercase tracking-wider text-blue-800">Department Status</strong>
                Agent is actively processing this milestone subtask...
              </div>
            </div>
          )}
          
          {fields.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {fields.map((f: any, idx: number) => {
                if (f.value === null || f.value === undefined || f.value === '') return null;
                return (
                  <div 
                    key={idx} 
                    className="flex flex-col border-b border-gray-50 pb-2.5 last:border-0 last:pb-0"
                    style={{ paddingBottom: '8px' }}
                  >
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider font-mono">{f.label}</span>
                    <span className="text-xs font-medium text-gray-800 break-words mt-1 max-h-[120px] overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">{f.value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-100">
              {actions.map((act: any, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); act.onClick(); }}
                  disabled={act.disabled}
                  className={`w-full text-xs font-bold text-center transition-all ${
                    act.variant === 'primary' 
                      ? 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                  {act.loading ? 'Processing...' : act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
CustomNode.displayName = 'CustomNode';

// Simple custom helper for more horizontal icon
function MoreHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

// React Flow edge types mapping
const nodeTypes = {
  custom: CustomNode,
};

// Initial preset layout coordinates for DAG graph
const initialNodes: any[] = [
  {
    id: 'trigger',
    type: 'custom',
    position: { x: 50, y: 220 },
    data: {
      type: 'trigger',
      label: 'GitHub Webhook',
      role: 'commit ingress',
      status: 'idle',
      collapsed: false,
      fields: [
        { label: 'Source', value: 'GITHUB_COMMIT' },
        { label: 'Message', value: 'Manual Trigger' }
      ]
    }
  },
  {
    id: 'devin',
    type: 'custom',
    position: { x: 420, y: 50 },
    data: {
      type: 'agent',
      label: 'Devin Engineering',
      role: 'Lead Software Engineer',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Technical Summary', value: 'Awaiting codebase commit changes...' }
      ]
    }
  },
  {
    id: 'priscilla',
    type: 'custom',
    position: { x: 420, y: 380 },
    data: {
      type: 'agent',
      label: 'Priscilla Product',
      role: 'Product Manager',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Importance Score', value: 'Pending engineering review' }
      ]
    }
  },
  {
    id: 'gigi',
    type: 'custom',
    position: { x: 800, y: 50 },
    data: {
      type: 'agent',
      label: 'Gigi Marketing',
      role: 'Creative Copywriter',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Twitter Draft', value: 'Waiting for product score approval' }
      ]
    }
  },
  {
    id: 'compliance',
    type: 'custom',
    position: { x: 800, y: 380 },
    data: {
      type: 'agent',
      label: 'Priscilla Compliance',
      role: 'Compliance Officer',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Audit Result', value: 'No staged copy drafts submitted' }
      ]
    }
  },
  {
    id: 'connie',
    type: 'custom',
    position: { x: 1180, y: 50 },
    data: {
      type: 'agent',
      label: 'Connie Assistant',
      role: 'Chief of Staff',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Status Report', value: 'Aligned on roadmap milestones' }
      ]
    }
  },
  {
    id: 'ship_deck',
    type: 'custom',
    position: { x: 1180, y: 380 },
    data: {
      type: 'output',
      label: 'Ship Deck',
      role: 'Distribution Hub',
      status: 'disabled',
      collapsed: false,
      fields: [
        { label: 'Deployment Copy', value: 'Staged copy drafts wait' }
      ]
    }
  }
];

// Initial preset connections
const initialEdges: any[] = [
  {
    id: 'e-trigger-devin',
    source: 'trigger',
    target: 'devin',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  },
  {
    id: 'e-trigger-priscilla',
    source: 'trigger',
    target: 'priscilla',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  },
  {
    id: 'e-devin-gigi',
    source: 'devin',
    target: 'gigi',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  },
  {
    id: 'e-priscilla-gigi',
    source: 'priscilla',
    target: 'gigi',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  },
  {
    id: 'e-gigi-compliance',
    source: 'gigi',
    target: 'compliance',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  },
  {
    id: 'e-compliance-gigi-rejection',
    source: 'compliance',
    sourceHandle: 'rejection-source',
    target: 'gigi',
    targetHandle: 'rejection-target',
    type: 'default',
    style: { stroke: '#EF4444', strokeWidth: 3.5, strokeDasharray: '4 4' }
  },
  {
    id: 'e-compliance-ship',
    source: 'compliance',
    target: 'ship_deck',
    type: 'default',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93C5FD' },
    style: { stroke: '#93C5FD', strokeWidth: 3.5 }
  }
];

// Sidebar agent profiles registry (well-arranged data cards)
const SIDEBAR_AGENTS = [
  {
    id: 'devin',
    name: 'Devin',
    role: 'Lead Software Engineer',
    goal: 'Summarize codebases',
    desc: 'Listens to raw webhook commits and translates structural changes into readable, concise business value summaries.',
    avatar: 'D',
    avatarBg: 'bg-blue-600',
  },
  {
    id: 'priscilla',
    name: 'Priscilla',
    role: 'PM & Compliance Officer',
    goal: 'Audit and validation',
    desc: 'Grades engineering commits on strategic value, audits staged campaign content, and enforces compliance voice safety.',
    avatar: 'P',
    avatarBg: 'bg-orange-600',
  },
  {
    id: 'gigi',
    name: 'Gigi',
    role: 'Creative Copywriter',
    goal: 'Write copy drafts',
    desc: 'Translates technical summaries and product values into multi-channel marketing campaigns (Twitter, Changelogs, Newsletters).',
    avatar: 'G',
    avatarBg: 'bg-green-600',
  },
  {
    id: 'connie',
    name: 'Connie',
    role: 'Chief of Staff',
    goal: 'Coordinate department',
    desc: 'Interfaces with human operators to answer questions about progress, milestones, and stages staged announcements.',
    avatar: 'C',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'marshall',
    name: 'Marshall',
    role: 'Strategic Researcher',
    goal: 'Generate recommendations',
    desc: 'Gathers community sentiment and competitor pivots to formulate strategic recommendations for the product milestones.',
    avatar: 'M',
    avatarBg: 'bg-cyan-600',
  },
  {
    id: 'vinci',
    name: 'Vinci',
    role: 'Asset Designer',
    goal: 'Design visual mockups',
    desc: 'Designs UI prototypes and visual assets conforming to Nexus brand voice and vector note-taking interfaces.',
    avatar: 'V',
    avatarBg: 'bg-pink-600',
  }
];

export default function Dashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [approvingRec, setApprovingRec] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);

  // Layout View Switcher
  const [view, setView] = useState<'canvas' | 'startup' | 'outputs'>('canvas');

  // Left Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSidebarSections, setOpenSidebarSections] = useState<Record<string, boolean>>({
    navigation: true,
    agents: true,
  });

  // Right Chat Sidebar State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<'chat' | 'inspector'>('chat');

  // Selected Node (rendered as floating inspector card)
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Connie Chat Box State
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Toolbar settings
  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Tracking collapsed nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Prevent NextJS Hydration mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll state every 1.5 seconds
  const fetchState = async () => {
    try {
      const res = await fetch('/api/brain');
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const data = await res.json();
      setState(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching brain state:', err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat box
  useEffect(() => {
    // chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.current_session?.chat_history]);

  // Synchronize React Flow nodes with backend DB state
  useEffect(() => {
    if (!state) return;

    const session = state.current_session || {};
    const outputs = session.agent_outputs || {};
    const rejections = session.rejections_and_memos || [];
    const status = session.status || 'IDLE';

    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        const isCollapsed = collapsedNodes[node.id] || false;
        let nodeStatus = 'disabled';
        let fields: any[] = [];
        let actions: any[] = [];

        // 1. Webhook Trigger Node
        if (node.id === 'trigger') {
          nodeStatus = status === 'PROCESSING' ? 'running' : 'success';
          fields = [
            { label: 'Source', value: session.trigger_source || 'MANUAL' },
            { label: 'Message', value: session.raw_inputs?.commit_message || 'No commits' },
            { label: 'Files', value: session.raw_inputs?.changed_files?.join(', ') || 'None' }
          ];
        }

        // 2. Devin Node
        else if (node.id === 'devin') {
          if (status === 'PROCESSING') {
            nodeStatus = outputs.devin_technical_summary ? 'success' : 'running';
          } else if (outputs.devin_technical_summary) {
            nodeStatus = 'success';
          }
          fields = [
            { label: 'Technical Summary', value: outputs.devin_technical_summary || (nodeStatus === 'running' ? 'Compiling commits...' : 'Awaiting commit ingress...') }
          ];
        }

        // 3. Priscilla Product Node
        else if (node.id === 'priscilla') {
          if (status === 'PROCESSING') {
            if (outputs.devin_technical_summary) {
              nodeStatus = outputs.priscilla_importance_score !== null ? 'success' : 'running';
            }
          } else if (outputs.priscilla_importance_score !== null) {
            nodeStatus = 'success';
          }
          fields = [
            { label: 'Impact Score', value: outputs.priscilla_importance_score !== null ? `${outputs.priscilla_importance_score}/10` : (nodeStatus === 'running' ? 'Rating milestone...' : 'Waiting for summary...') },
            { label: 'Active Milestone', value: state.operational_assets?.active_milestones?.[0] || 'No milestone active' }
          ];
        }

        // 4. Gigi Node
        else if (node.id === 'gigi') {
          if (status === 'PROCESSING') {
            if (outputs.priscilla_importance_score !== null) {
              const hasDrafts = outputs.gigi_content_drafts?.twitter;
              const lastRejection = rejections.length > 0 ? rejections[rejections.length - 1] : null;
              const hasComplianceRejected = lastRejection && outputs.approval_status === 'PENDING' && !hasDrafts;
              
              if (hasComplianceRejected) {
                nodeStatus = 'running';
              } else {
                nodeStatus = hasDrafts ? 'success' : 'running';
              }
            }
          } else if (outputs.gigi_content_drafts?.twitter) {
            nodeStatus = 'success';
          }
          fields = [
            { label: 'Twitter Draft', value: outputs.gigi_content_drafts?.twitter || (nodeStatus === 'running' ? 'Drafting announcement...' : 'Waiting for score...') },
            { label: 'Changelog', value: outputs.gigi_content_drafts?.changelog || '' }
          ];
        }

        // 5. Priscilla Compliance Node
        else if (node.id === 'compliance') {
          if (status === 'PROCESSING') {
            if (outputs.gigi_content_drafts?.twitter) {
              if (outputs.approval_status === 'APPROVED' || outputs.approval_status === 'SHIPPED') {
                nodeStatus = 'success';
              } else {
                nodeStatus = rejections.length > 0 ? 'error' : 'running';
              }
            }
          } else if (outputs.approval_status === 'APPROVED' || outputs.approval_status === 'SHIPPED') {
            nodeStatus = 'success';
          }
          fields = [
            { label: 'Compliance Status', value: outputs.approval_status || 'PENDING' },
            { label: 'Audit Critique', value: rejections.length > 0 ? rejections[rejections.length - 1].reason : 'Safe style checks passed.' }
          ];
        }

        // 6. Connie Node
        else if (node.id === 'connie') {
          if (status === 'PROCESSING') {
            nodeStatus = outputs.approval_status === 'APPROVED' ? 'success' : 'running';
          } else if (outputs.approval_status === 'APPROVED' || outputs.approval_status === 'SHIPPED') {
            nodeStatus = 'success';
          }
          fields = [
            { label: 'Operations status', value: nodeStatus === 'success' ? 'Staged drafts validated.' : 'Monitoring room collaboration...' }
          ];
        }

        // 7. Ship Deck Node
        else if (node.id === 'ship_deck') {
          if (outputs.approval_status === 'SHIPPED') {
            nodeStatus = 'success';
          } else if (outputs.approval_status === 'APPROVED') {
            nodeStatus = 'running';
          }
          fields = [
            { label: 'Ship Status', value: outputs.approval_status === 'SHIPPED' ? 'SHIPPED & PUBLISHED' : (outputs.approval_status === 'APPROVED' ? 'STAGED & WAITING' : 'INACTIVE') },
            { label: 'Twitter Publish', value: outputs.gigi_content_drafts?.twitter || '' }
          ];

          if (outputs.approval_status === 'APPROVED') {
            actions = [
              {
                label: 'Approve & Ship Campaign',
                variant: 'primary',
                onClick: handleShipCopy,
                disabled: shipping,
                loading: shipping
              }
            ];
          }
        }

        // Keep inspector synced in details if the selected node was updated
        if (selectedNode && selectedNode.id === node.id) {
          setSelectedNode((prev: any) => ({
            ...prev,
            data: {
              ...prev.data,
              status: nodeStatus,
              fields,
              actions
            }
          }));
        }

        return {
          ...node,
          data: {
            ...node.data,
            status: nodeStatus,
            collapsed: isCollapsed,
            fields,
            actions,
            onToggleCollapse: () => {
              setCollapsedNodes((prev) => ({
                ...prev,
                [node.id]: !prev[node.id],
              }));
            },
          },
        };
      });
    });

    // Animate edges when the flow is processing
    setEdges((prevEdges) => {
      return prevEdges.map((edge) => {
        let isAnimated = false;
        let strokeColor = '#93C5FD'; // blue-300 default

        if (status === 'PROCESSING') {
          if (edge.id === 'e-trigger-devin' || edge.id === 'e-trigger-priscilla') {
            isAnimated = true;
            strokeColor = '#3B82F6';
          }
          if (edge.id === 'e-devin-gigi') {
            isAnimated = outputs.devin_technical_summary && !outputs.gigi_content_drafts?.twitter;
            strokeColor = isAnimated ? '#7C3AED' : (outputs.devin_technical_summary ? '#22C55E' : '#93C5FD');
          }
          if (edge.id === 'e-priscilla-gigi') {
            isAnimated = outputs.priscilla_importance_score !== null && !outputs.gigi_content_drafts?.twitter;
            strokeColor = isAnimated ? '#F97316' : (outputs.priscilla_importance_score !== null ? '#22C55E' : '#93C5FD');
          }
          if (edge.id === 'e-gigi-compliance') {
            isAnimated = outputs.gigi_content_drafts?.twitter && outputs.approval_status === 'PENDING';
            strokeColor = isAnimated ? '#16A34A' : (outputs.gigi_content_drafts?.twitter ? '#22C55E' : '#93C5FD');
          }
          if (edge.id === 'e-compliance-gigi-rejection') {
            const lastRejection = rejections.length > 0;
            isAnimated = lastRejection && outputs.approval_status === 'PENDING' && !outputs.gigi_content_drafts?.twitter;
            strokeColor = isAnimated ? '#EF4444' : '#FCA5A5';
          }
          if (edge.id === 'e-compliance-connie') {
            isAnimated = outputs.approval_status === 'APPROVED';
            strokeColor = isAnimated ? '#22C55E' : '#93C5FD';
          }
          if (edge.id === 'e-connie-ship') {
            isAnimated = outputs.approval_status === 'APPROVED';
            strokeColor = isAnimated ? '#7C3AED' : '#93C5FD';
          }
        } else {
          if (outputs.approval_status === 'SHIPPED') {
            strokeColor = '#22C55E';
          }
        }

        return {
          ...edge,
          animated: isAnimated,
          style: {
            ...edge.style,
            stroke: strokeColor,
          },
        };
      });
    });

  }, [state, collapsedNodes]);

  // Handle Drag-over and drop onto canvas
  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      // Drop handler is clean and supports nodes instantiations
    },
    [setNodes]
  );

  // Node selection triggers float card
  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
    setRightSidebarTab('inspector');
    setIsRightSidebarOpen(true);
  }, []);

  // Webhook manual trigger
  const handleSimulateWebhook = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'GITHUB_COMMIT',
          commit_message: 'perf(db): implement connection pooling and redis caching layer',
          changed_files: ['db.go', 'cache.go', 'main.go'],
        }),
      });
      await fetchState();
    } catch (err) {
      console.error('Error triggering webhook:', err);
    } finally {
      setTriggering(false);
    }
  };

  // Strategic roadmap pivot approval
  const handleApproveRec = async (recId: string) => {
    setApprovingRec(recId);
    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_recommendation', recommendation_id: recId }),
      });
      await fetchState();
    } catch (err) {
      console.error('Error approving recommendation:', err);
    } finally {
      setApprovingRec(null);
    }
  };

  // Social publish trigger
  const handleShipCopy = async () => {
    setShipping(true);
    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ship_marketing' }),
      });
      await fetchState();
    } catch (err) {
      console.error('Error shipping content:', err);
    } finally {
      setShipping(false);
    }
  };

  // Submit Connie Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || sendingChat) return;

    const messageToSend = chatMessage;
    setChatMessage('');
    setSendingChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchState();
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    } finally {
      setSendingChat(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading || !state) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F5F6F8] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-mono text-sm text-gray-500">Connecting to ShipStory Platform...</p>
      </div>
    );
  }

  const session = state.current_session || {};
  const metadata = state.company_metadata || {};
  const assets = state.operational_assets || {};
  const feedback = state.evolutionary_feedback_loop || {};
  const outputs = session.agent_outputs || {};
  const rejections = session.rejections_and_memos || [];
  const chatHistory = session.chat_history || [];

  const toggleSection = (section: string) => {
    setOpenSidebarSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F5F6F8] text-[#111827]">
      
      {/* Top Header Bar */}
      <header 
        className="flex h-14 items-center justify-between border-b border-gray-200 bg-white shrink-0" 
        style={{ paddingLeft: '24px', paddingRight: '24px' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base">S</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-gray-900">ShipStory /</span>
            <span 
              className="text-xs font-mono font-bold bg-gray-100 text-gray-600 rounded uppercase"
              style={{ padding: '3px 10px' }}
            >
              {metadata.name || 'Startup'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs rounded-full border border-green-100" style={{ padding: '4px 12px' }}>
            <span className="status-dot active"></span>
            <span className="font-mono">Workspace Sync Active</span>
          </div>

          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`flex items-center gap-1.5 h-9 border rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
              isRightSidebarOpen 
                ? 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF] hover:bg-[#E9D5FF]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            style={{ padding: '8px 12px' }}
            title={isRightSidebarOpen ? "Close Assistant Panel" : "Open Assistant Panel"}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRightSidebarOpen ? 'Hide Assistant' : 'Show Assistant'}</span>
          </button>
          
          <button
            onClick={handleSimulateWebhook}
            disabled={triggering || session.status === 'PROCESSING'}
            className="flex items-center gap-1.5 h-9 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-semibold text-xs transition-colors"
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            {triggering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {session.status === 'PROCESSING' ? 'Agents Debating...' : 'Simulate GitHub Push'}
          </button>
        </div>
      </header>

      {/* Main Core Layout: Sidebar + Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Layout (Navigation & Agent cards) */}
        <aside 
          className={`flex flex-col border-r border-[#1e1e24] bg-[#0A0A0B] text-gray-300 transition-all duration-300 shrink-0 select-none ${
            isSidebarOpen ? 'w-[280px]' : 'w-12'
          }`}
        >
          {/* Collapse/Expand Sidebar Toggle */}
          <div className="flex h-12 items-center justify-end px-3 border-b border-[#1e1e24] shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-[#1A1A1E]"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>

          {isSidebarOpen ? (
            <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-3.5">
              
              {/* NAVIGATION / VIEWS Section */}
              <div className="flex flex-col gap-1">
                <div 
                  onClick={() => toggleSection('navigation')}
                  className="flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-[#1A1A1E] text-gray-500 hover:text-gray-300"
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Operations Views</span>
                  {openSidebarSections.navigation ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>

                {openSidebarSections.navigation && (
                  <div className="flex flex-col gap-1 mt-1 pl-1">
                    <button
                      onClick={() => setView('canvas')}
                      className={`flex items-center gap-2.5 w-full text-left rounded-lg text-xs font-semibold px-3 py-2 transition-colors hover:bg-[#1A1A1E] ${
                        view === 'canvas' ? 'bg-[#2563EB]/15 text-blue-400 border border-blue-500/20' : 'text-gray-300 border border-transparent'
                      }`}
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>Workflow Visualizer</span>
                    </button>

                    <button
                      onClick={() => setView('startup')}
                      className={`flex items-center gap-2.5 w-full text-left rounded-lg text-xs font-semibold px-3 py-2 transition-colors hover:bg-[#1A1A1E] ${
                        view === 'startup' ? 'bg-[#2563EB]/15 text-blue-400 border border-blue-500/20' : 'text-gray-300 border border-transparent'
                      }`}
                    >
                      <Cpu className="w-4 h-4 shrink-0" />
                      <span>Startup Details</span>
                    </button>

                    <button
                      onClick={() => setView('outputs')}
                      className={`flex items-center gap-2.5 w-full text-left rounded-lg text-xs font-semibold px-3 py-2 transition-colors hover:bg-[#1A1A1E] ${
                        view === 'outputs' ? 'bg-[#2563EB]/15 text-blue-400 border border-blue-500/20' : 'text-gray-300 border border-transparent'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Campaign Outputs</span>
                    </button>
                  </div>
                )}
              </div>

              {/* AGENT REGISTRY Section */}
              <div className="flex flex-col gap-1">
                <div 
                  onClick={() => toggleSection('agents')}
                  className="flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-[#1A1A1E] text-gray-500 hover:text-gray-300"
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Startup Agent Roles</span>
                  {openSidebarSections.agents ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>

                {openSidebarSections.agents && (
                  <div className="flex flex-col gap-2 mt-2">
                    {SIDEBAR_AGENTS.map((agent) => (
                      <div 
                        key={agent.id}
                        className="bg-[#111113] border border-[#1e1e24] rounded-lg flex flex-col gap-1.5 p-3 transition-all duration-200 hover:border-gray-700 hover:bg-[#151518]"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-sm ${agent.avatarBg} text-white flex items-center justify-center font-bold text-[10px]`}>
                            {agent.avatar}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-200 leading-tight">{agent.name}</span>
                            <span className="text-[9px] font-mono text-gray-400 font-semibold">{agent.role}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed font-mono mt-0.5">{agent.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            // Collapsed rail display
            <div className="flex-1 flex flex-col items-center gap-5 pt-5">
              <button onClick={() => setView('canvas')} title="Workflow Canvas" className={`p-1.5 rounded hover:bg-[#1A1A1E] ${view === 'canvas' ? 'text-blue-500' : ''}`}><Globe className="w-5 h-5" /></button>
              <button onClick={() => setView('startup')} title="Startup Details" className={`p-1.5 rounded hover:bg-[#1A1A1E] ${view === 'startup' ? 'text-blue-500' : ''}`}><Cpu className="w-5 h-5" /></button>
              <button onClick={() => setView('outputs')} title="Campaign Outputs" className={`p-1.5 rounded hover:bg-[#1A1A1E] ${view === 'outputs' ? 'text-blue-500' : ''}`}><FileText className="w-5 h-5" /></button>
            </div>
          )}
        </aside>

        {/* Center Panel Content area (View dependant) */}
        <main className="flex-1 relative overflow-hidden bg-[#F5F6F8]">
          
          {/* A. CANVAS VIEW */}
          {view === 'canvas' && (
            <div className="w-full h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                minZoom={0.2}
                maxZoom={2}
              >
                {showGrid && <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#373f4cff" />}
                {showMiniMap && <MiniMap style={{ height: 90, width: 140 }} nodeStrokeColor="#E2E8F0" />}
                
                {/* Canvas Toolbar Panel */}
                <Panel position="top-center" className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm mt-3">
                  <button 
                    onClick={() => setShowGrid(!showGrid)} 
                    className={`p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors ${showGrid ? 'bg-gray-100 text-blue-600 font-semibold' : ''}`}
                    title="Toggle Grid"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowMiniMap(!showMiniMap)} 
                    className={`p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors ${showMiniMap ? 'bg-gray-100 text-blue-600 font-semibold' : ''}`}
                    title="Toggle Mini-map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-gray-200 mx-1"></div>
                  <button 
                    onClick={() => {
                      setNodes(initialNodes);
                      setEdges(initialEdges);
                    }} 
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    title="Reset DAG Layout"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Layout</span>
                  </button>
                </Panel>
              </ReactFlow>
            </div>
          )}

          {/* B. STARTUP PROFILE VIEW (Replaces canvas view) */}
          {view === 'startup' && (
            <div className="w-full h-full overflow-y-auto bg-gray-50/50 p-6 flex flex-col gap-6" style={{ padding: '24px' }}>
              
              {/* Overview Header */}
              <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 font-mono">Startup Brain Overview</h2>
                  <p className="text-xs text-gray-500 mt-1">Direct representation of metadata loaded from company_brain_db.json</p>
                </div>
                <button 
                  onClick={() => setView('canvas')} 
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <span>Go to Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Identity & Pitch profile cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                  <span className="text-[10px] uppercase font-bold text-blue-600 font-mono tracking-widest">Startup Identity</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{metadata.name || 'Nexus Labs'}</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">Value Proposition</span>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed font-mono">{metadata.value_proposition || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">Target Customer Persona</span>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed font-mono">{metadata.target_persona || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                  <span className="text-[10px] uppercase font-bold text-purple-600 font-mono tracking-widest">Investor Deck Abstract</span>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono mt-3 whitespace-pre-wrap">{assets.pitch_deck_summary || 'N/A'}</p>
                </div>
              </div>

              {/* Milestones & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Active Milestones list */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                  <span className="text-[10px] uppercase font-bold text-orange-600 font-mono tracking-widest">Active Roadmap Milestones</span>
                  <ul className="mt-3 flex flex-col gap-2">
                    {assets.active_milestones?.length > 0 ? (
                      assets.active_milestones.map((milestone: string, idx: number) => (
                        <li 
                          key={idx} 
                          className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-700 font-semibold font-mono"
                          style={{ padding: '10px 14px' }}
                        >
                          <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</span>
                          <span>{milestone}</span>
                        </li>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 font-mono py-2">No active milestones configured in database.</div>
                    )}
                  </ul>
                </div>

                {/* Progress Indicators */}
                <div className="bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                  <span className="text-[10px] uppercase font-bold text-green-600 font-mono tracking-widest">Epic Progress Percentages</span>
                  <div className="mt-4 flex flex-col gap-4">
                    {Object.entries(assets.epic_progress_percentages || {}).map(([epicName, progress]: any) => (
                      <div key={epicName} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-mono text-gray-700">
                          <span>{epicName}</span>
                          <span className="font-bold text-gray-950">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Style Guide Controls */}
              <div className="bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                <span className="text-[10px] uppercase font-bold text-red-600 font-mono tracking-widest">Brand Voice Style Guide & Safety Rules</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">Writing Restrictions</span>
                    <ul className="list-disc list-inside text-xs font-mono text-gray-700 flex flex-col gap-1">
                      {metadata.style_guide?.restrictions?.map((rule: string, idx: number) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">Restricted Keywords (Compliance Blocked)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {metadata.security_filters?.restricted_keywords?.map((word: string) => (
                        <span 
                          key={word} 
                          className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-mono rounded-md"
                          style={{ padding: '3px 8px' }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* C. CAMPAIGN OUTPUTS & DRAFTS VIEW (Replaces canvas view) */}
          {view === 'outputs' && (
            <div className="w-full h-full overflow-y-auto bg-gray-50/50 p-6 flex flex-col gap-6" style={{ padding: '24px' }}>
              
              {/* Header */}
              <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 font-mono">Campaign Deliverables</h2>
                  <p className="text-xs text-gray-500 mt-1">Review staged copy drafts and execute campaign distribution</p>
                </div>
                <button 
                  onClick={() => setView('canvas')} 
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <span>Go to Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Marketing Copy Stage Cards */}
              <div className="flex flex-col gap-5">
                <span className="text-[10px] uppercase font-bold text-green-600 font-mono tracking-widest">Staged Copy drafts</span>
                
                {outputs.gigi_content_drafts && outputs.gigi_content_drafts.twitter ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Twitter Post Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-blue-500 font-mono">Twitter Announcement</span>
                        <span className="text-[9px] font-mono bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 font-bold">STAGED</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3 flex-1">
                        {outputs.gigi_content_drafts.twitter}
                      </p>
                    </div>

                    {/* Changelog Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-green-600 font-mono">Changelog Entry</span>
                        <span className="text-[9px] font-mono bg-green-50 text-green-600 rounded px-1.5 py-0.5 font-bold">STAGED</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3 flex-1">
                        {outputs.gigi_content_drafts.changelog}
                      </p>
                    </div>

                    {/* Newsletter Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-purple-600 font-mono">Newsletter Draft</span>
                        <span className="text-[9px] font-mono bg-purple-50 text-purple-600 rounded px-1.5 py-0.5 font-bold">STAGED</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3 flex-1">
                        {outputs.gigi_content_drafts.newsletter}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 font-mono text-xs">
                    No marketing drafts generated. Please simulate a commit push to start agent copywriting.
                  </div>
                )}
              </div>

              {/* Delivery Actions & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Strategic Pivots list */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5" style={{ padding: '20px' }}>
                  <span className="text-[10px] uppercase font-bold text-purple-600 font-mono tracking-widest">Roadmap Pivot Recommendations</span>
                  
                  <div className="flex flex-col gap-3 mt-3">
                    {feedback.active_recommendations?.length > 0 ? (
                      feedback.active_recommendations.map((rec: any, idx: number) => (
                        <div 
                          key={idx}
                          className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono"
                        >
                          <div className="flex-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">ROADMAP_PIVOT</span>
                            <h4 className="text-xs font-bold text-gray-900 mt-1">{rec.summary}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{rec.rationale}</p>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-center">
                            <span className="text-[10px] font-bold text-purple-700">Impact: {rec.strategic_impact_score}/10</span>
                            {rec.audit_status === 'APPROVED' ? (
                              <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                                <Check className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveRec(rec.recommendation_id)}
                                disabled={approvingRec === rec.recommendation_id}
                                className="bg-purple-600 text-white font-bold text-[10px] rounded hover:bg-purple-700 disabled:opacity-50"
                                style={{ padding: '5px 10px' }}
                              >
                                {approvingRec === rec.recommendation_id ? 'Mutating...' : 'Approve Pivot'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 py-2">No strategic recommendations generated.</div>
                    )}
                  </div>
                </div>

                {/* Final Deployment / Ship Campaign card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between" style={{ padding: '20px' }}>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-green-600 font-mono tracking-widest">Shipment Deploy Control</span>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed font-mono">
                      Deploy staged copy announcements to active distribution hooks (Twitter APIs, Changelog nodes, and email broadcasts).
                    </p>
                  </div>

                  <div className="mt-6">
                    {outputs.approval_status === 'SHIPPED' ? (
                      <div 
                        className="bg-green-50 border border-green-200 text-green-700 text-center text-xs font-bold rounded-lg"
                        style={{ padding: '12px' }}
                      >
                        ✓ Campaign Shipped & Published
                      </div>
                    ) : (
                      <button
                        onClick={handleShipCopy}
                        disabled={shipping || outputs.approval_status !== 'APPROVED'}
                        className="w-full text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all text-center border border-transparent"
                        style={{ padding: '12px', borderRadius: '8px' }}
                      >
                        {shipping ? 'Shipping Copy...' : (outputs.approval_status === 'APPROVED' ? 'Approve & Ship Campaign' : 'Staged Drafts Not Approved')}
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

        {/* Right Sidebar Layout (Collapsible Connie Chief of Staff Chat & Node Inspector) */}
        <section 
          className={`flex flex-col bg-white transition-all duration-300 shrink-0 ${
            isRightSidebarOpen ? 'w-[320px] border-l border-gray-200' : 'w-0 border-l-0 overflow-hidden'
          }`}
        >
          {isRightSidebarOpen && (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Tabs Header */}
              <div className="h-12 border-b border-gray-100 flex items-center justify-between px-3 shrink-0 bg-white select-none">
                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                  <button
                    onClick={() => setRightSidebarTab('chat')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                      rightSidebarTab === 'chat'
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => setRightSidebarTab('inspector')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all duration-150 cursor-pointer ${
                      rightSidebarTab === 'inspector'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Inspector</span>
                    {selectedNode && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                    )}
                  </button>
                </div>
                <button 
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Content */}
              {rightSidebarTab === 'chat' ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFBFB]">
                  {/* Messages feed stream */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 p-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center text-gray-400 font-mono">
                        <p className="text-[11px]">No chat logs initialized. Trigger a push simulation to start operations.</p>
                      </div>
                    ) : (
                      chatHistory.map((h: any, idx: number) => {
                        const isUser = h.sender === 'user';
                        return (
                          <div 
                            key={h.id || idx} 
                            className={`flex flex-col gap-1 max-w-[85%] ${
                              isUser ? 'self-end items-end' : 'self-start items-start'
                            }`}
                          >
                            <span className="text-[9px] font-bold font-mono text-gray-400 px-1">{isUser ? 'You' : 'Connie'}</span>
                            <div 
                              className={`rounded-xl text-xs leading-relaxed font-mono px-3 py-2 ${
                                isUser 
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                              }`}
                            >
                              {h.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input form */}
                  <form 
                    onSubmit={handleSendChat} 
                    className="border-t border-gray-100 flex gap-2 bg-white shrink-0 p-2.5"
                  >
                    <input 
                      type="text" 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Ask Connie status..."
                      disabled={sendingChat}
                      className="flex-1 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono px-3.5 py-2.5"
                    />
                    <button 
                      type="submit" 
                      disabled={sendingChat || !chatMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-lg flex items-center justify-center shrink-0 w-9 h-9 transition-colors cursor-pointer"
                    >
                      {sendingChat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#FAFBFB] p-4">
                  {selectedNode ? (
                    <div className="flex flex-col gap-4">
                      {/* Node Header */}
                      <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm flex flex-col gap-3">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-widest text-gray-400 uppercase">Selected Node</span>
                          <h4 className="text-sm font-bold text-gray-900 mt-1">{selectedNode.data.label}</h4>
                          {selectedNode.data.role && (
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{selectedNode.data.role}</p>
                          )}
                        </div>

                        {/* Status block */}
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold font-mono text-gray-400 uppercase">Status</span>
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedNode.data.status === 'success' ? 'bg-[#22C55E]' :
                              selectedNode.data.status === 'running' ? 'bg-[#3B82F6] animate-pulse' :
                              selectedNode.data.status === 'error' ? 'bg-[#EF4444]' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-gray-700">{selectedNode.data.status || 'idle'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="flex flex-col gap-2.5">
                        {selectedNode.data.fields && selectedNode.data.fields.length > 0 ? (
                          selectedNode.data.fields.map((f: any, idx: number) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                              <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-wider">{f.label}</span>
                              <span className="text-xs text-gray-700 break-words font-mono leading-relaxed whitespace-pre-wrap">{f.value || 'None'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-xs text-gray-400 font-mono py-4">No fields active for this node.</div>
                        )}
                      </div>

                      {/* Actions */}
                      {selectedNode.data.actions && selectedNode.data.actions.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                          <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-wider mb-1">Actions</span>
                          {selectedNode.data.actions.map((act: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={act.onClick}
                              disabled={act.disabled}
                              className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-all text-center cursor-pointer py-2.5 px-4 rounded-lg"
                            >
                              {act.loading ? 'Processing...' : act.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Deselect control */}
                      <button
                        onClick={() => {
                          setSelectedNode(null);
                          setRightSidebarTab('chat');
                        }}
                        className="mt-4 text-center text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer py-2"
                      >
                        Clear selection & back to chat
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-gray-200 rounded-2xl bg-white p-6 text-center select-none shadow-sm">
                      <Cpu className="w-8 h-8 text-gray-300 mb-3" />
                      <h4 className="text-xs font-bold text-gray-800 font-mono">No Node Selected</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 max-w-[200px] leading-relaxed">
                        Click on any node in the Workflow Visualizer canvas to view its status, outputs, and actions.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
