import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from "recharts";
import { Hash, Lightbulb, Megaphone, Sparkles, TrendingUp, TrendingDown, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult, MarketingRoute } from "@/types/insight";

interface Props {
  result: AnalysisResult;
  onRegenerate: () => void;
}

function channelIcon(channel: string) {
  return <Megaphone className="h-4 w-4" />;
}

export function PredictionsTab({ result }: { result: AnalysisResult }) {
  const positive = result.predictions.trendPct >= 0;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardDescription>Trend forecast</CardDescription>
          <CardTitle className="flex items-center gap-2 text-3xl">
            {positive ? <TrendingUp className="h-7 w-7 text-success" /> : <TrendingDown className="h-7 w-7 text-destructive" />}
            {positive ? "+" : ""}{result.predictions.trendPct.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{result.predictions.trend}</CardContent>
      </Card>

      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardDescription>Demand outlook</CardDescription>
          <CardTitle className="text-xl">Forecast</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{result.predictions.demand}</CardContent>
      </Card>

      <Card className="bg-gradient-card md:col-span-2">
        <CardHeader>
          <CardTitle>Marketing ROI per channel</CardTitle>
          <CardDescription>Estimated return multipliers based on your domain + locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.predictions.channelRoi} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <ReTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => `${v.toFixed(1)}x`}
                />
                <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card md:col-span-2">
        <CardHeader className="pb-3">
          <CardDescription>Influencer impact</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">{result.predictions.influencerImpact}</CardContent>
      </Card>
    </div>
  );
}

export function MarketingRoutesTab({ routes, onRegenerate, surprise }: { routes: MarketingRoute[]; onRegenerate: () => void; surprise?: string }) {
  const sorted = [...routes].sort((a, b) => a.priority - b.priority);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Hover any card to see why we recommend it.</p>
        <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> Surprise me
        </Button>
      </div>
      {surprise && (
        <Card className="border-accent/40 bg-gradient-accent text-accent-foreground">
          <CardContent className="flex items-start gap-3 p-4">
            <Sparkles className="h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">{surprise}</div>
          </CardContent>
        </Card>
      )}
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((r) => (
            <Tooltip key={r.channel}>
              <TooltipTrigger asChild>
                <Card className="bg-gradient-card transition-base hover:shadow-elegant hover:-translate-y-0.5 cursor-help">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          {channelIcon(r.channel)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{r.channel}</CardTitle>
                          <CardDescription className="text-xs">{r.timing}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">P{r.priority}</Badge>
                        <p className="mt-1 text-xs font-mono text-primary">{r.budgetPct}% budget</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-1">
                      {r.hashtags.map((h) => (
                        <span key={h} className="text-xs text-muted-foreground">#{h.replace(/^#/, "")}</span>
                      ))}
                    </div>
                    <ul className="space-y-1">
                      {r.contentIdeas.map((idea) => (
                        <li key={idea} className="flex items-start gap-2 text-xs">
                          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs leading-relaxed">{r.reasoning}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

export function InsightsList({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" /> Key insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {idx + 1}
                </div>
                <p className="text-sm leading-relaxed">{i}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-primary" /> Campaign hashtags
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.campaignHashtags.map((h) => (
              <Badge key={h} variant="secondary">#{h.replace(/^#/, "")}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-warning" /> Content ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {result.campaignContentIdeas.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
