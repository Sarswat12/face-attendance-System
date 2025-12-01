"use client";

import React from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "./utils";

const ChartConfig = {};

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}) {
  return (
    <ChartContext.Provider value={{ config, chartId: id }}>
      <div
        className={cn(
          "flex aspect-auto h-full w-full flex-col justify-between rounded-xl bg-transparent p-0",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }) => null;
const ChartTooltip = () => null;
const ChartTooltipContent = () => null;
const ChartLegend = () => null;
const ChartLegendContent = () => null;

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
  useChart,
};
