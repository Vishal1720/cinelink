import { PieChart, Pie, Cell } from "recharts";

const COLORS = {
  4: "#A020F0", 
  3: "#2ECC71", 
  2: "#F39C12",
  1: "#E74C3C",
};

const renderEmojiLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  emoji,
  percent
}) => {
  if (percent === 0) return null; // don't show label for 0%

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="20px"
    >
      {emoji}
    </text>
  );
};

export default function RatingDonutChart({ data }) {
  const totalVotes = data.reduce((sum, d) => sum + d.value, 0);

  // Find highest category
  const top =
    totalVotes === 0
      ? null
      : data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);

  // Percentage
  const percent =
    totalVotes === 0 ? 0 : Math.round((top.value / totalVotes) * 100);

  return (
    <div style={{ textAlign: "center", marginTop: "0px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <PieChart width={165} height={165}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            stroke="none"
            paddingAngle={2}
            label={renderEmojiLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={COLORS[entry.id]} />
            ))}
          </Pie>
        </PieChart>

        {/* Center % + Category */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -55%)",
            textAlign: "center",
            color: "white",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            {percent}%
          </div>

          {top && (
            <div style={{ fontSize: "16px", opacity: 0.9 }}>
              {top.emoji} {top.name}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {/* <div
        style={{
          marginTop: "-10px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {data.map((d) => (
          <div
            key={d.id}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: COLORS[d.id],
              }}
            ></span>
            <span style={{ color: "white", fontSize: "14px" }}>
              {d.emoji} {d.name}
            </span>
          </div>
        ))}
      </div> */}
    </div>
  );
}
