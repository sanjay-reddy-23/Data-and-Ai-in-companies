import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileSpreadsheet, ClipboardPaste, Sparkles, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { DEMO_DATA, parseCsvText, parseExcelFile, sheetToRows, type ParsedData } from "@/lib/data";

interface Props {
  onLoaded: (data: ParsedData & { source: string }) => void;
}

export function DataInputPanel({ onLoaded }: Props) {
  const [paste, setPaste] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        const text = await file.text();
        const data = parseCsvText(text);
        toast.success(`Loaded ${data.rows.length} rows from CSV`);
        onLoaded({ ...data, source: file.name });
      } else if (ext === "xlsx" || ext === "xls") {
        const { workbook: wb, sheetNames: names } = await parseExcelFile(file);
        setWorkbook(wb);
        setSheetNames(names);
        setFileName(file.name);
        if (names.length === 1) {
          const data = sheetToRows(wb, names[0]);
          toast.success(`Loaded ${data.rows.length} rows from ${file.name}`);
          onLoaded({ ...data, source: file.name });
        } else {
          setSelectedSheet(names[0]);
          toast.info(`Workbook has ${names.length} sheets — pick one below.`);
        }
      } else {
        toast.error("Unsupported file. Use .xlsx, .xls, or .csv");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not parse file");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const loadSheet = () => {
    if (!workbook || !selectedSheet) return;
    const data = sheetToRows(workbook, selectedSheet);
    toast.success(`Loaded ${data.rows.length} rows from ${selectedSheet}`);
    onLoaded({ ...data, source: `${fileName} → ${selectedSheet}` });
  };

  const loadPaste = () => {
    if (!paste.trim()) return toast.error("Paste some CSV/TSV data first");
    try {
      const normalized = paste.includes("\t") && !paste.includes(",") ? paste.replace(/\t/g, ",") : paste;
      const data = parseCsvText(normalized);
      if (!data.rows.length) return toast.error("No rows detected");
      toast.success(`Loaded ${data.rows.length} pasted rows`);
      onLoaded({ ...data, source: "Pasted data" });
    } catch {
      toast.error("Could not parse pasted data");
    }
  };

  const loadDemo = () => {
    const cols = Object.keys(DEMO_DATA[0]);
    toast.success(`Loaded demo dataset (${DEMO_DATA.length} rows)`);
    onLoaded({ rows: DEMO_DATA, columns: cols, source: "Demo dataset" });
  };

  return (
    <Card className="bg-gradient-card shadow-elegant border-border/60 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary text-sm font-bold">1</span>
          Load your data
        </CardTitle>
        <CardDescription>
          Drop an Excel/CSV, paste rows, or try the demo. Multi-sheet workbooks supported.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-1.5">
              <UploadCloud className="h-3.5 w-3.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4 space-y-3">
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-base ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              <input {...getInputProps()} />
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary shadow-glow mb-3">
                <UploadCloud className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="font-medium">
                {isDragActive ? "Drop the file here…" : "Drag & drop, or click to upload"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">.xlsx · .xls · .csv</p>
            </div>

            {sheetNames.length > 1 && (
              <div className="rounded-lg border border-border bg-background/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="font-medium">{fileName}</span>
                  <Badge variant="secondary">{sheetNames.length} sheets</Badge>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetNames.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={loadSheet} disabled={!selectedSheet}>
                    Load <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-3">
            <Textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={`Paste CSV or TSV here. First row should be headers.\nDate,Product,Sales\n2024-01-01,Earbuds,12000`}
              className="min-h-[180px] font-mono text-xs"
            />
            <Button onClick={loadPaste} className="w-full">
              <FileText className="mr-2 h-4 w-4" /> Parse pasted data
            </Button>
          </TabsContent>

          <TabsContent value="demo" className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-background/60 p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-accent shadow-md mb-3">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
              <p className="font-medium">Sample electronics sales</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {DEMO_DATA.length} rows · Date, Product, Region, Sales, UnitsSold
              </p>
              <Button onClick={loadDemo} className="mt-4 bg-gradient-primary text-primary-foreground">
                Load demo dataset
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
