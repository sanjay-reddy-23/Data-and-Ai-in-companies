import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Target, MapPin, Sparkles, ArrowRight, X } from "lucide-react";
import { type CompanyProfile, DOMAINS, GOAL_OPTIONS } from "@/types/insight";

interface Props {
  onSubmit: (profile: CompanyProfile) => void;
}

export function CompanyProfileForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [focus, setFocus] = useState("");

  const addLocation = () => {
    const parts = locationsInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) {
      setLocations(Array.from(new Set([...locations, ...parts])));
      setLocationsInput("");
    }
  };

  const toggleGoal = (g: string) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const canSubmit = name.trim() && domain && locations.length && goals.length;

  const fillDemo = () => {
    setName("FreshMart");
    setDomain("E-commerce / Retail");
    setLocations(["India", "USA"]);
    setGoals(["Boost sales / revenue", "Build influencer partnerships"]);
    setFocus("Diwali season sale");
  };

  return (
    <Card className="bg-gradient-card shadow-elegant border-border/60 animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary text-sm font-bold">0</span>
              Company Profile
            </CardTitle>
            <CardDescription className="mt-1">
              Tell us who you are — every insight will be personalized to you.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fillDemo} className="shrink-0">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Demo profile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Company name
            </Label>
            <Input
              id="name"
              placeholder="e.g. FreshMart"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Domain / Industry
            </Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Locations
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="India, USA, Singapore..."
              value={locationsInput}
              onChange={(e) => setLocationsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLocation();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addLocation}>
              Add
            </Button>
          </div>
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {locations.map((loc) => (
                <Badge key={loc} variant="secondary" className="gap-1 pr-1">
                  {loc}
                  <button
                    onClick={() => setLocations(locations.filter((l) => l !== loc))}
                    className="grid h-4 w-4 place-items-center rounded-full hover:bg-background/50"
                    aria-label={`Remove ${loc}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Goals (pick any)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_OPTIONS.map((g) => {
              const active = goals.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-base ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focus">Current focus (optional)</Label>
          <Input
            id="focus"
            placeholder="e.g. Diwali season sale, Q3 product launch"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({ name: name.trim(), domain, locations, goals, focus: focus.trim() || undefined })
          }
        >
          Continue to data input
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
