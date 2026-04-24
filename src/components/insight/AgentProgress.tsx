import { useEffect, useState } from "react";
import { Brain, Database, Search, BarChart3, Sparkles, Rocket, CheckCircle2 } from "lucide-react";

const STEPS = [
  { icon: Database, label: "Reading data" },
  { icon: Brain, label: "Understanding columns" },
  { icon: BarChart3, label: "Analyzing trends" },
  { icon: Search, label: "Cross-referencing context" },
  { icon: Sparkles, label: "Generating marketing routes" },
  { icon: Rocket, label: "Forecasting outcomes" },
];

interface Props {
  active: boolean;
  done?: boolean;
}

export function AgentProgress({ active, done }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1100);
    return () => clearInterval(id);
  }, [active]);

  if (!active && !done) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-elegant animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow ${active && !done ? "animate-thinking" : ""}`}>
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold">{done ? "Analysis complete" : "Agent thinking…"}</p>
          <p className="text-xs text-muted-foreground">
            {done ? "Insights ready below" : STEPS[step]?.label}
          </p>
        </div>
        {done && <Rocket className="ml-auto h-5 w-5 text-primary animate-rocket" />}
      </div>
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const isActive = active && !done && i === step;
          const isDone = done || i < step;
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-base ${
                isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                  ? "border-success/30 bg-success/5"
                  : "border-border/40 bg-background/40 opacity-60"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
              )}
              <span className={`text-sm ${isActive ? "font-medium" : ""}`}>{s.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/2 bg-gradient-primary animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
