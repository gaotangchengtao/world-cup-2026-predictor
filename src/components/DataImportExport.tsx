import { Download, Upload } from "lucide-react";
import type { BracketPredictionState, RuntimeData } from "../types/worldCup";
import { downloadJson } from "../utils/format";

interface DataImportExportProps {
  runtimeData: RuntimeData;
  bracketState: BracketPredictionState;
  onImportPrediction: (state: BracketPredictionState) => void;
  onImportRuntimeData: (data: RuntimeData) => void;
}

export const DataImportExport = ({
  runtimeData,
  bracketState,
  onImportPrediction,
  onImportRuntimeData,
}: DataImportExportProps) => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const isRuntimeData = (value: unknown): value is RuntimeData =>
    isRecord(value) && Array.isArray(value.teams) && Array.isArray(value.players);

  const isWrappedPrediction = (value: unknown): value is { bracketState: BracketPredictionState } =>
    isRecord(value) && isRecord(value.bracketState);

  const handleImport = async (file?: File) => {
    if (!file) return;

    const text = await file.text();
    const json: unknown = JSON.parse(text);

    if (isRuntimeData(json)) {
      onImportRuntimeData({ ...json, importedAt: new Date().toISOString() });
      return;
    }

    if (isWrappedPrediction(json)) {
      onImportPrediction(json.bracketState);
      return;
    }

    if (isRecord(json)) {
      onImportPrediction(json as BracketPredictionState);
    }
  };

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">JSON 导入 / 导出</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            导入数据只更新浏览器运行时状态，不会改写源码文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => downloadJson("wc2026-bracket-prediction.json", { bracketState })}
            type="button"
          >
            <Download size={16} />
            导出预测 JSON
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => downloadJson("wc2026-runtime-data-template.json", runtimeData)}
            type="button"
          >
            <Download size={16} />
            导出数据模板
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-trophy-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-trophy-300">
            <Upload size={16} />
            导入 JSON
            <input
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                void handleImport(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>
    </section>
  );
};
