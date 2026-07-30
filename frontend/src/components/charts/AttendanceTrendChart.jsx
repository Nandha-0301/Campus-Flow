import React, { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AttendanceTrendChart = ({ data, height = 240 }) => {
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
          <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="percentage" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

export default AttendanceTrendChart;
