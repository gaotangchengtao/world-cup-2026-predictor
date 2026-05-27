import { ArrowRight, Compass } from "lucide-react";
import { useLanguage } from "../i18n";

export const BeginnerPathPanel = () => {
  const { t } = useLanguage();
  const steps = [
    t("beginnerPathStep1"),
    t("beginnerPathStep2"),
    t("beginnerPathStep3"),
    t("beginnerPathStep4"),
    t("beginnerPathStep5"),
  ];

  return (
    <section className="glass-panel rounded-lg p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400 text-slate-950">
          <Compass size={22} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">
            {t("beginnerMode")}
          </p>
          <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950">{t("beginnerPathTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{t("beginnerPathDescription")}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {steps.map((step, index) => (
          <article
            className="relative rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-white"
            key={step}
          >
            <span className="text-2xl font-black text-trophy-300 light:text-trophy-700">{index + 1}</span>
            <p className="mt-3 text-sm leading-6 text-slate-200 light:text-slate-800">{step}</p>
            {index < steps.length - 1 && (
              <ArrowRight className="absolute right-3 top-4 hidden text-slate-500 lg:block" size={16} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
