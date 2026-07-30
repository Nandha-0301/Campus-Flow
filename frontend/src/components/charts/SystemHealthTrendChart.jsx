import React, { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SystemHealthTrendChart = ({ data, height = 220 }) => {
  const chartData = Array.isArray(data) ? data : [];
  const safeHeight = Number.isFinite(height) ? Math.max(160, height) : 220;
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
          <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="healthy" stroke="#16A34A" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="misconfigured" stroke="#DC2626" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

export default SystemHealthTrendChart;
