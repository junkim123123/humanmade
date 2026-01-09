"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, FileUp, CheckCircle, AlertCircle, RefreshCw, FileText } from "lucide-react";

export default function AdminUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ success: 0, fail: 0, error: 0 });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 99)]);
  };

  // File processing (sequential)
  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setLogs([]);
    setStats({ success: 0, fail: 0, error: 0 });
    setProgress({ current: 0, total: files.length });

    addLog(`🚀 Starting upload of ${files.length} files...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((prev) => ({ ...prev, current: i + 1 }));
      addLog(`📄 [${i + 1}/${files.length}] Processing: ${file.name}`);

      try {
        let jsonData: any[] = [];

        if (file.name.endsWith(".csv")) {
          jsonData = await parseCSV(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          jsonData = await parseXLSX(file);
        } else {
          addLog(`⚠️ Unsupported file format: ${file.name}`);
          continue;
        }

        if (jsonData.length === 0) {
          addLog(`⚠️ No data found in: ${file.name}`);
          continue;
        }

        // Send to API
        await uploadToDB(jsonData, file.name);

      } catch (error: any) {
        addLog(`❌ Error processing file (${file.name}): ${error.message}`);
        setStats((prev) => ({ ...prev, error: prev.error + 1 }));
      }
    }

    addLog("🎉 All tasks completed!");
    setIsProcessing(false);
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  };

  const parseXLSX = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Find header row
    const allRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    }) as unknown[][];

    if (allRows.length === 0) {
      return [];
    }

    // For ImportKey format: first row is metadata, real header is first data row
    // Check if first row looks like metadata (contains "ImportKey" or is mostly empty)
    let headerRowIndex = 0;
    
    const firstRow = allRows[0] as (string | null)[];
    const firstRowText = firstRow.map(c => String(c || "").toUpperCase()).join(" ");
    const isMetadataRow = 
      firstRowText.includes("IMPORTKEY") || 
      firstRowText.includes("EXPORT") ||
      firstRow.length < 3; // Very few columns suggests metadata
    
    if (isMetadataRow && allRows.length > 1) {
      // First row is metadata, second row is the real header
      headerRowIndex = 1;
    } else {
      // Check if first row looks like a header (contains common ImportKey column names)
      const hasHeaderKeywords = 
        firstRowText.includes("SUPPLIER") || 
        firstRowText.includes("CARGO") || 
        firstRowText.includes("BUYER") ||
        firstRowText.includes("DESCRIPTION");
      
      if (hasHeaderKeywords) {
        // First row is the header
        headerRowIndex = 0;
      } else {
        // Fallback: find row with most non-empty cells
        let maxNonEmptyCells = 0;
        for (let i = 0; i < Math.min(5, allRows.length); i++) {
          const row = allRows[i] as (string | null)[];
          const nonEmptyCount = row.filter((cell) => cell && String(cell).trim() !== "").length;
          if (nonEmptyCount > maxNonEmptyCells) {
            maxNonEmptyCells = nonEmptyCount;
            headerRowIndex = i;
          }
        }
      }
    }

    // Extract header
    const rawHeaders = allRows[headerRowIndex] as (string | null)[];
    const headers: string[] = [];
    const headerIndices: number[] = [];
    
    rawHeaders.forEach((header, index) => {
      const headerStr = header ? String(header).trim() : "";
      if (headerStr !== "") {
        headers.push(headerStr);
        headerIndices.push(index);
      }
    });

    if (headers.length === 0) {
      return [];
    }

    // Convert data rows
    const rows = allRows.slice(headerRowIndex + 1) as unknown[][];
    const data = rows
      .filter((row) => {
        const rowArray = row as (string | null)[];
        return rowArray.some((cell, idx) => {
          if (!headerIndices.includes(idx)) return false;
          return cell && String(cell).trim() !== "";
        });
      })
      .map((row) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((header, headerIdx) => {
          const colIndex = headerIndices[headerIdx];
          const cellValue = (row as (string | null)[])[colIndex];
          obj[header] = cellValue ? String(cellValue).trim() : "";
        });
        return obj;
      });

    return data;
  };

  const uploadToDB = async (data: any[], fileName: string) => {
    try {
      const response = await fetch("/api/admin/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (response.ok) {
        setStats((prev) => ({
          success: prev.success + result.data.successCount,
          fail: prev.fail + result.data.failedCount,
          error: prev.error + result.data.errorCount,
        }));
        addLog(`✅ ${fileName}: Success ${result.data.successCount} / Failed ${result.data.failedCount}`);
      } else {
        throw new Error(result.error || "Server error");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Accept multiple files
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Accept multiple files
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ImportKey Data Station ⛽</h1>
        <p className="text-slate-500 mt-2">
          Upload collected Excel (CSV/XLSX) files here. The database will be populated automatically.
        </p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"}
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          multiple // Multi-select allowed
          accept=".csv, .xlsx, .xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            {isProcessing ? (
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isProcessing ? "Injecting data..." : "Drag and drop or click to upload files"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              CSV or Excel files supported (multiple selection allowed)
            </p>
          </div>
        </div>
      </div>

      {/* Progress and results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Success</p>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Failed (Duplicate/Missing)</p>
            <p className="text-2xl font-bold text-red-600">{stats.fail}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-slate-400">({progress.current}/{progress.total} files)</p>
          </div>
        </div>
      </div>

      {/* Log window */}
      <div className="bg-slate-900 rounded-xl p-6 h-64 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-slate-500">Waiting...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-slate-300 mb-1 border-b border-slate-800 pb-1 last:border-0">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
