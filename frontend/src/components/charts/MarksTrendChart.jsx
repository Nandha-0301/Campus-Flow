import React, { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MarksTrendChart = ({ data, height = 240 }) => {
  const chartData = Array.isArray(data) ? data : [];
  const safeHeight = Number.isFinite(height) ? Math.max(160, height) : 240;
  const wrapperRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let rafId = null;
    const checkReady = () => {
      const node = wrapperRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setReady(true);
        return;
      }
      rafId = requestAnimationFrame(checkReady);
    };
    checkReady();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [safeHeight]);

  return (
    <div ref={wrapperRef} className="w-full h-full" style={{ minHeight: safeHeight }}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minHeight={safeHeight} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="subject" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="average" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {chartData.map((entry) => (
                <Cell key={entry.subject} fill={entry.average >= 80 ? "#4F46E5" : "#94A3B8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

export default MarksTrendChart;
