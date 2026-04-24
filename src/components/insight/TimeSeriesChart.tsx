import { useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DataRow } from "@/types/insight";
import { detectCategoricalColumns, detectDateColumn, detectNumericColumns, parseFlexibleDate } from "@/lib/data";

interface Props {
  rows: DataRow[];
  columns: string[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary-glow))", "hsl(var(--success))", "hsl(var(--warning))"];

export function TimeSeriesChart({ rows, columns }: Props) {
  const dateCol = useMemo(() => detectDateColumn(rows, columns), [rows, columns]);
  const numericCols = useMemo(() => detectNumericColumns(rows, columns), [rows, columns]);
  const categoricalCols = useMemo(() => detectCategoricalColumns(rows, columns, numericCols, dateCol), [rows, columns, numericCols, dateCol]);

  const [metric, setMetric] = useState(numericCols[0] ?? "");
  const [groupBy, setGroupBy] = useState<string>(categoricalCols[0] ?? "__none__");

  const chartData = useMemo(() => {
    if (!dateCol || !metric) return { data: [], series: [] as string[] };

    const useGroup = groupBy && groupBy !== "__none__";
    const grouped = new Map<string, Record<string, number>>();
    const seriesSet = new Set<string>();

    for (const r of rows) {
      const d = parseFlexibleDate(r[dateCol]);
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      const value = Number(r[metric]);
      if (isNaN(value)) continue;

      const seriesKey = useGroup ? String(r[groupBy] ?? "—") : metric;
      seriesSet.add(seriesKey);

      const existing = grouped.get(key) ?? { __date: 0 };
      existing[seriesKey] = (existing[seriesKey] ?? 0) + value;
      grouped.set(key, existing);
    }

    const data = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));

    return { data, series: Array.from(seriesSet) };
  }, [rows, dateCol, metric, groupBy]);

  if (!dateCol) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trends over time</CardTitle>
          <CardDescription>No date column detected in this dataset.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Trends over time</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1.5 mt-1">
              Date: <Badge variant="secondary">{dateCol}</Badge>
              {chartData.series.length > 0 && (
                <>· <Badge variant="secondary">{chartData.series.length} series</Badge></>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {numericCols.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No grouping</SelectItem>
                {categoricalCols.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {chartData.series.map((s, i) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
