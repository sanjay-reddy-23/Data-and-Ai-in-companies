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

export function parseFlexibleDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // Excel serial number (days since 1899-12-30)
  if (typeof value === "number") {
    if (value > 59 && value < 80000) {
      const ms = Math.round((value - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  const s = String(value).trim();
  if (!s) return null;

  // ISO yyyy-mm-dd or yyyy/mm/dd (optionally with time)
  const iso = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T\s].*)?$/);
  if (iso) {
    const y = +iso[1], m = +iso[2], d = +iso[3];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) return dt;
    }
    return null;
  }

  // dd/mm/yyyy, dd-mm-yyyy, mm/dd/yyyy (heuristic: prefer dd/mm if first > 12)
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s.*)?$/);
  if (dmy) {
    let a = +dmy[1], b = +dmy[2];
    let y = +dmy[3];
    if (y < 100) y += 2000;
    let day: number, month: number;
    if (a > 12) { day = a; month = b; }
    else if (b > 12) { month = a; day = b; }
    else { day = a; month = b; } // default to dd/mm
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(Date.UTC(y, month - 1, day));
    if (dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day) return dt;
    return null;
  }

  // Fallback to native parser, but reject epoch (1970-01-01) sentinel
  const native = new Date(s);
  if (!isNaN(native.getTime()) && native.getUTCFullYear() > 1970) return native;
  return null;
}

export function detectDateColumn(rows: DataRow[], columns: string[]): string | null {
  let best: { col: string; ratio: number } | null = null;
  for (const col of columns) {
    // Skip obvious id-like columns
    const lower = col.toLowerCase();
    if (lower === "id" || lower.endsWith(" id") || lower.endsWith("_id") || lower.endsWith("id")) {
      // still allow if name explicitly contains "date"
      if (!lower.includes("date") && !lower.includes("time")) continue;
    }
    let ok = 0;
    let total = 0;
    for (const r of rows.slice(0, 100)) {
      const v = r[col];
      if (v === null || v === undefined || v === "") continue;
      total++;
      if (parseFlexibleDate(v)) ok++;
    }
    if (total === 0) continue;
    const ratio = ok / total;
    // Boost columns whose name suggests a date
    const nameBoost = lower.includes("date") || lower.includes("time") ? 0.2 : 0;
    const score = ratio + nameBoost;
    if (ratio > 0.7 && (!best || score > best.ratio)) best = { col, ratio: score };
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
