import { useState } from "react";
import { Header } from "@/components/insight/Header";
import { CompanyProfileForm } from "@/components/insight/CompanyProfileForm";
import { DataInputPanel } from "@/components/insight/DataInputPanel";
import { AgentProgress } from "@/components/insight/AgentProgress";
import { TimeSeriesChart } from "@/components/insight/TimeSeriesChart";
import { InsightsList, MarketingRoutesTab, PredictionsTab } from "@/components/insight/ResultsTabs";
import { ChatPanel } from "@/components/insight/ChatPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Megaphone, MessageSquare, Sparkles, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { detectNumericColumns, summarizeData } from "@/lib/data";
import type { AnalysisResult, CompanyProfile, DataRow } from "@/types/insight";

type Step = "profile" | "data" | "results";

const Index = () => {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [data, setData] = useState<{ rows: DataRow[]; columns: string[]; source: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAgent = async (
    profileArg: CompanyProfile = profile!,
    dataArg: NonNullable<typeof data> = data!
  ) => {
    setAnalyzing(true);
    setResult(null);
    try {
      const numericCols = detectNumericColumns(dataArg.rows, dataArg.columns);
      const summary = summarizeData(dataArg.rows, numericCols);
      const sample = dataArg.rows.slice(0, 10);

      const { data: out, error } = await supabase.functions.invoke("analyze", {
        body: {
          profile: profileArg,
          columns: dataArg.columns,
          rowCount: dataArg.rows.length,
          sample,
          summary,
        },
      });

      if (error) {
        const msg = (error as { message?: string }).message || "Analysis failed";
        if (msg.includes("429")) toast.error("Rate limit reached. Try again shortly.");
        else if (msg.includes("402")) toast.error("AI credits exhausted.");
        else toast.error(msg);
        setAnalyzing(false);
        return;
      }

      setResult(out as AnalysisResult);
      toast.success("Analysis ready 🚀");
    } catch (e) {
      console.error(e);
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8 space-y-6">
        {step === "profile" && (
          <>
            <div className="text-center max-w-2xl mx-auto py-6 animate-fade-in">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Sparkles className="h-3 w-3" /> Agentic AI · Goal · Tools · Memory · Loop
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Your <span className="text-gradient-primary">AI Business Analyst</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                Set your company profile, drop in your data, and get personalized insights, forecasts, and marketing routes — in seconds.
              </p>
            </div>
            <CompanyProfileForm
              onSubmit={(p) => {
                setProfile(p);
                setStep("data");
                toast.success(`Analyzing for ${p.name} in ${p.domain}`);
              }}
            />
          </>
        )}

        {step === "data" && profile && (
          <>
            <ProfileSummary profile={profile} onBack={() => setStep("profile")} />
            <DataInputPanel
              onLoaded={(d) => {
                setData(d);
                setStep("results");
                runAgent(profile, d);
              }}
            />
          </>
        )}

        {step === "results" && profile && data && (
          <>
            <ProfileSummary profile={profile} onBack={() => setStep("data")} dataSource={data.source} />

            <AgentProgress active={analyzing} done={!analyzing && !!result} />

            {!analyzing && result && (
              <div className="space-y-4 animate-fade-in">
                <TimeSeriesChart rows={data.rows} columns={data.columns} />
                <Tabs defaultValue="insights" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="insights" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Insights</span>
                    </TabsTrigger>
                    <TabsTrigger value="predictions" className="gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Predictions</span>
                    </TabsTrigger>
                    <TabsTrigger value="routes" className="gap-1.5">
                      <Megaphone className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Routes</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="insights" className="mt-4">
                    <InsightsList result={result} />
                  </TabsContent>
                  <TabsContent value="predictions" className="mt-4">
                    <PredictionsTab result={result} />
                  </TabsContent>
                  <TabsContent value="routes" className="mt-4">
                    <MarketingRoutesTab
                      routes={result.routes}
                      surprise={result.surprise}
                      onRegenerate={() => runAgent()}
                    />
                  </TabsContent>
                  <TabsContent value="chat" className="mt-4">
                    <ChatPanel profile={profile} analysis={result} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {!analyzing && !result && (
              <Card className="bg-gradient-card">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Analysis didn't complete. Want to retry?</p>
                  <Button onClick={() => runAgent()} className="bg-gradient-primary text-primary-foreground">
                    <Play className="mr-2 h-4 w-4" /> Run agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      <footer className="container py-6 text-center text-xs text-muted-foreground">
        Built with Lovable Cloud · Powered by Lovable AI
      </footer>
    </div>
  );
};

function ProfileSummary({
  profile,
  onBack,
  dataSource,
}: {
  profile: CompanyProfile;
  onBack: () => void;
  dataSource?: string;
}) {
  return (
    <Card className="bg-gradient-card animate-fade-in">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold">{profile.name}</span>
          <span className="text-muted-foreground">·</span>
          <Badge variant="secondary">{profile.domain}</Badge>
          {profile.locations.map((l) => (
            <Badge key={l} variant="outline">📍 {l}</Badge>
          ))}
        </div>
        {dataSource && (
          <>
            <div className="h-6 w-px bg-border" />
            <Badge variant="secondary" className="text-xs">📊 {dataSource}</Badge>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default Index;
