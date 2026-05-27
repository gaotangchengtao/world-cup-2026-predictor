import { Download, Upload } from "lucide-react";
import { useLanguage } from "../i18n";
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
  const { t } = useLanguage();
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const isRuntimeData = (value: unknown): value is RuntimeData =>
    isRecord(value) && Array.isArray(value.teams) && Array.isArray(value.players);

  const isWrappedPrediction = (value: unknown): value is { bracketState: BracketPredictionState } =>
    isRecord(value) && isRecord(value.bracketState);

  const downloadText = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsvTemplate = () => {
    const header = [
      "playerId",
      "teamId",
      "name",
      "club",
      "marketValue",
      "marketValueEurM",
      "photoUrl",
      "photoSource",
      "photoCredit",
      "photoLastUpdated",
      "transfermarktUrl",
      "lastUpdated",
      "dataQuality",
    ];
    const example = [
      "argentina-1-lionel-messi",
      "argentina",
      "Lionel Messi",
      "Inter Miami",
      "€20.00m",
      "20",
      "https://example.com/photo.jpg",
      "manual",
      "Photographer / Rights cleared",
      "2026-05-27",
      "https://www.transfermarkt.com/",
      "2026-05-27",
      "manual",
    ];

    downloadText("wc2026-player-template.csv", `${header.join(",")}\n${example.join(",")}\n`, "text/csv;charset=utf-8");
  };

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
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("jsonImportExport")}</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">{t("importRuntimeNote")}</p>
          <p className="mt-1 text-xs text-slate-500 light:text-slate-600">{t("csvTemplateDescription")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => downloadJson("wc2026-bracket-prediction.json", { bracketState })}
            type="button"
          >
            <Download size={16} />
            {t("exportPredictionJson")}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => downloadJson("wc2026-runtime-data-template.json", runtimeData)}
            type="button"
          >
            <Download size={16} />
            {t("exportDataTemplate")}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={handleExportCsvTemplate}
            type="button"
          >
            <Download size={16} />
            {t("downloadCsvTemplate")}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-trophy-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-trophy-300">
            <Upload size={16} />
            {t("importJson")}
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
