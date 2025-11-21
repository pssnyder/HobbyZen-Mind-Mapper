import React, { useMemo } from 'react';
import { TreeNode } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS } from '../constants';

interface PruningStatsProps {
  data: TreeNode;
}

const PruningStats: React.FC<PruningStatsProps> = ({ data }) => {
  const stats = useMemo(() => {
    const counts = {
      keep: 0,
      review: 0,
      sell: 0,
      donate: 0,
      discard: 0
    };

    const traverse = (node: TreeNode) => {
      counts[node.status]++;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(data);
    return [
      { name: 'Keep', value: counts.keep, color: STATUS_COLORS.keep },
      { name: 'Review', value: counts.review, color: STATUS_COLORS.review },
      { name: 'Sell', value: counts.sell, color: STATUS_COLORS.sell },
      { name: 'Donate', value: counts.donate, color: STATUS_COLORS.donate },
      { name: 'Discard', value: counts.discard, color: STATUS_COLORS.discard },
    ].filter(item => item.value > 0);
  }, [data]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-row items-center gap-4">
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={45}
              paddingAngle={5}
              dataKey="value"
            >
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1 text-xs min-w-[100px]">
        {stats.map(item => (
            <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="font-medium text-slate-600">{item.name}: {item.value}</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PruningStats;
