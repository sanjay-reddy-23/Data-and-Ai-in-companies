import * as XLSX from "xlsx";
import type { DataRow } from "@/types/insight";

export interface ParsedData {
  rows: DataRow[];
  columns: string[];
  sheetNames?: string[];
}

export function parseCsvText(text: string): ParsedData {
  const wb = XLSX.read(text, { type: "string" });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<DataRow>(wb.Sheets[sheetName], { defval: null });
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { rows, columns, sheetNames: wb.SheetNames };
}

export async function parseExcelFile(file: File): Promise<{ workbook: XLSX.WorkBook; sheetNames: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  return { workbook: wb, sheetNames: wb.SheetNames };
}

export function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): ParsedData {
  const rows = XLSX.utils.sheet_to_json<DataRow>(workbook.Sheets[sheetName], { defval: null });
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { rows, columns, sheetNames: workbook.SheetNames };
}

export function detectDateColumn(rows: DataRow[], columns: string[]): string | null {
  let best: { col: string; ratio: number } | null = null;
  for (const col of columns) {
    let ok = 0;
    let total = 0;
    for (const r of rows.slice(0, 100)) {
      const v = r[col];
      if (v === null || v === undefined || v === "") continue;
      total++;
      const d = new Date(v as string);
      if (!isNaN(d.getTime())) ok++;
    }
    if (total === 0) continue;
    const ratio = ok / total;
    if (ratio > 0.7 && (!best || ratio > best.ratio)) best = { col, ratio };
  }
  return best?.col ?? null;
}

export function detectNumericColumns(rows: DataRow[], columns: string[]): string[] {
  return columns.filter((col) => {
    let ok = 0;
    let total = 0;
    for (const r of rows.slice(0, 100)) {
      const v = r[col];
      if (v === null || v === undefined || v === "") continue;
      total++;
      if (typeof v === "number" || (!isNaN(Number(v)) && v !== "")) ok++;
    }
    return total > 0 && ok / total > 0.8;
  });
}

export function detectCategoricalColumns(rows: DataRow[], columns: string[], numericCols: string[], dateCol: string | null): string[] {
  return columns.filter((col) => {
    if (numericCols.includes(col) || col === dateCol) return false;
    const unique = new Set(rows.slice(0, 200).map((r) => r[col])).size;
    return unique > 1 && unique <= 30;
  });
}

export function summarizeData(rows: DataRow[], numericCols: string[]) {
  const out: Record<string, { min: number; max: number; sum: number; mean: number; unique: number }> = {};
  for (const col of numericCols) {
    const vals = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    if (!vals.length) continue;
    const sum = vals.reduce((a, b) => a + b, 0);
    out[col] = {
      min: Math.min(...vals),
      max: Math.max(...vals),
      sum,
      mean: sum / vals.length,
      unique: new Set(vals).size,
    };
  }
  return out;
}

export const DEMO_DATA: DataRow[] = (() => {
  const products = ["Wireless Earbuds", "Smart Watch", "Bluetooth Speaker", "Phone Case"];
  const regions = ["North", "South", "East", "West"];
  const out: DataRow[] = [];
  const start = new Date("2024-01-01");
  for (let d = 0; d < 60; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    for (const p of products) {
      const r = regions[d % regions.length];
      const base = 5000 + Math.sin(d / 8) * 2500 + Math.random() * 2000;
      const sales = Math.round(base * (p === "Smart Watch" ? 1.4 : 1));
      out.push({
        Date: date.toISOString().slice(0, 10),
        Product: p,
        Category: "Electronics",
        Region: r,
        Sales: sales,
        UnitsSold: Math.round(sales / 30),
      });
    }
  }
  return out;
})();
