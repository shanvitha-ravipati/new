import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SensorChart({ history }) {
  const data = history.map((reading) => ({
    ...reading,
    time: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }));
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">SENSOR ACTIVITY</span><h2>Reading history</h2></div>
        <span className="chart-period">Latest {data.length} readings</span>
      </div>
      {data.length < 2 ? (
        <div className="chart-empty">Waiting for more readings to show sensor trends.</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#eef1f6" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#8b95a7", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis yAxisId="left" tick={{ fill: "#8b95a7", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#8b95a7", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#e8edf5", fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="battery" name="Battery (%)" stroke="#16a36a" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
