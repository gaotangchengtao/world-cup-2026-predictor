import { BookOpenText } from "lucide-react";
import { useLanguage } from "../i18n";
import { glossaryTerms } from "../utils/insights";

export const GlossaryPanel = () => {
  const { language, t } = useLanguage();

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex items-center gap-2">
        <BookOpenText className="text-trophy-300" size={18} />
        <h2 className="text-lg font-black text-white light:text-slate-950">{t("glossaryTitle")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">{t("glossaryDescription")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {glossaryTerms.map((term) => (
          <article
            className="rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/80"
            key={term.id}
          >
            <h3 className="text-sm font-black text-white light:text-slate-950">{term.title[language]}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{term.description[language]}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
