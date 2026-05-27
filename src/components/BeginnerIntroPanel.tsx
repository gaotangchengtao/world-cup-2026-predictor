import { BookOpen, Goal, ListChecks, ShieldCheck, Telescope } from "lucide-react";
import { useLanguage } from "../i18n";

export const BeginnerIntroPanel = () => {
  const { t } = useLanguage();
  const items = [
    { title: t("beginnerHowWorldCup"), text: t("beginnerHowWorldCupText"), icon: ListChecks },
    { title: t("beginnerGroupStage"), text: t("beginnerGroupStageText"), icon: Goal },
    { title: t("beginnerKnockout"), text: t("beginnerKnockoutText"), icon: ShieldCheck },
    { title: t("beginnerTerms"), text: t("beginnerTermsText"), icon: BookOpen },
    { title: t("beginnerTeamsToStart"), text: t("beginnerTeamsToStartText"), icon: Telescope },
  ];

  return (
    <section className="glass-panel rounded-lg p-4 sm:p-5">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
          {t("overviewBeginner")}
        </p>
        <h2 className="mt-2 text-2xl font-black text-white light:text-slate-950">{t("beginnerIntroTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{t("beginnerIntroDescription")}</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-white"
              key={item.title}
            >
              <Icon className="text-trophy-300 light:text-trophy-700" size={20} />
              <h3 className="mt-3 text-sm font-black text-white light:text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
