import { Languages } from "lucide-react";
import { useLanguage, type Language } from "../i18n";

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const options: Array<{ value: Language; label: string; compact: string }> = [
    { value: "zh", label: t("chinese"), compact: "中" },
    { value: "en", label: t("english"), compact: "EN" },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 light:border-slate-900/10 light:bg-white"
      title={t("language")}
    >
      <Languages className="mx-1 hidden text-slate-300 light:text-slate-700 sm:block" size={16} />
      {options.map((option) => (
        <button
          className={`rounded-md px-2.5 py-2 text-xs font-black transition sm:px-3 ${
            language === option.value
              ? "bg-trophy-500 text-slate-950"
              : "text-slate-200 hover:bg-white/10 light:text-slate-700"
          }`}
          key={option.value}
          onClick={() => setLanguage(option.value)}
          type="button"
        >
          <span className="sm:hidden">{option.compact}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
};
