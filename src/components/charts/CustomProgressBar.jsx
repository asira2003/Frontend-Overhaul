import { useEffect, useRef, useState } from "react";
import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function CustomProgressBar({ completePercentage }) {
  const [data, setData] = useState([
    { name: "incomplete", value: 100, fill: "#eee" },
  ]);
  const start = useRef(null);
  const text = useRef(null);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!start.current) {
        start.current = timestamp;
      }
      const elapsed = timestamp - start.current;
      const value = Math.min(
        Math.floor((elapsed / 2000) * 100),
        completePercentage
      );
      const textSvg = text.current;
      if (textSvg) {
        textSvg.textContent = `${value}%`;
      }
      if (value < completePercentage) {
        requestAnimationFrame(animate);
      }
    };
    const newData = JSON.parse(JSON.stringify(data));
    newData.push({
      name: "complete",
      value: completePercentage,
      fill: getBarColor(completePercentage),
    });
    setData(() => newData);
    requestAnimationFrame(animate);
  }, [completePercentage]);

  function getBarColor(completePercentage) {
    if (completePercentage === 100) {
      return "#1E88E5";
    } else if (completePercentage > 75) {
      return "#43A047";
    } else if (completePercentage > 50) {
      return "#FDD835";
    } else if (completePercentage > 25) {
      return "#FB8C00";
    } else {
      return "#E53935";
    }
  }

  function getTextColor(completePercentage) {
    if (completePercentage === 100) {
      return "#1E88E5";
    } else if (completePercentage > 75) {
      return "#2E7D32";
    } else if (completePercentage > 50) {
      return "#AFB42B";
    } else if (completePercentage > 25) {
      return "#EF6C00";
    } else {
      return "#B71C1C";
    }
  }

  return (
    <>
      <ResponsiveContainer
        className="center-by-margins"
        minWidth={250}
        minHeight={250}
      >
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="50%"
          outerRadius="50%"
          barSize={10}
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          startAngle={90}
          endAngle={-270}
        >
          <text
            id="text-svg"
            ref={text}
            x={"50%"}
            y={"50%"}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            fontSize={30}
            fill={getTextColor(completePercentage)}
          >
            0%
          </text>
          <RadialBar
            minAngle={0}
            background
            dataKey="value"
            clockWise={true}
            animationDuration={2000}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </>
  );
}
