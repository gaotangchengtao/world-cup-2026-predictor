import { ExternalLink, Newspaper, ShieldCheck, TrendingUp } from "lucide-react";
import { offFieldStories } from "../data/offFieldStories";
import { useLanguage, type TranslationKey } from "../i18n";
import type { OffFieldStoryCategory } from "../types/worldCup";

const categoryTone: Record<OffFieldStoryCategory, string> = {
  logistics: "bg-sky-400/15 text-sky-200 light:text-sky-700",
  "team-camp": "bg-orange-400/15 text-orange-200 light:text-orange-700",
  climate: "bg-emerald-400/15 text-emerald-200 light:text-emerald-700",
  accessibility: "bg-violet-400/15 text-violet-200 light:text-violet-700",
  culture: "bg-pink-400/15 text-pink-200 light:text-pink-700",
  governance: "bg-trophy-400/15 text-trophy-200 light:text-trophy-800",
  media: "bg-slate-400/15 text-slate-200 light:text-slate-700",
};

export const OffFieldStoriesPanel = () => {
  const { language, t } = useLanguage();
  const sortedStories = [...offFieldStories].sort((a, b) => b.attentionScore - a.attentionScore);
  const topStory = sortedStories[0];

  return (
    <section className="space-y-4">
      <div className="glass-panel hero-panel rounded-lg p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
              {t("offFieldKicker")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950">{t("offFieldTitle")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
              {t("offFieldDescription")}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-900/10 light:bg-white/70">
            <p className="text-xs uppercase text-slate-500">{t("crawlerSafety")}</p>
            <p className="mt-1 text-sm font-black text-white light:text-slate-950">{t("crawlerSafetySummary")}</p>
          </div>
        </div>
      </div>

      {topStory && (
        <a
          className="block rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4 transition hover:-translate-y-0.5 hover:border-trophy-400"
          href={topStory.url}
          rel="noreferrer"
          target="_blank"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ${categoryTone[topStory.category]}`}>
                {categoryLabel(topStory.category, t)}
              </span>
              <h3 className="mt-3 text-2xl font-black text-white light:text-slate-950">{topStory.title[language]}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300 light:text-slate-700">{topStory.summary[language]}</p>
            </div>
            <div className="min-w-[130px] rounded-lg border border-white/10 bg-slate-950/35 p-3 text-center light:border-slate-900/10 light:bg-white/70">
              <TrendingUp className="mx-auto text-trophy-300" size={22} />
              <p className="mt-1 text-xs uppercase text-slate-500">{t("attentionScore")}</p>
              <p className="text-2xl font-black text-white light:text-slate-950">{topStory.attentionScore}</p>
            </div>
          </div>
        </a>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedStories.slice(1).map((story) => (
          <article
            className="glass-panel rounded-lg p-4 transition hover:-translate-y-0.5 hover:border-trophy-500/60"
            key={story.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Newspaper className="text-trophy-300" size={19} />
                <span className={`rounded-md px-2 py-1 text-xs font-black ${categoryTone[story.category]}`}>
                  {categoryLabel(story.category, t)}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">{story.publishedAt}</span>
            </div>
            <h3 className="mt-3 text-lg font-black text-white light:text-slate-950">{story.title[language]}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{story.summary[language]}</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-white/70">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t("whyTheyMatter")}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{story.whyItMatters[language]}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 light:text-slate-600">
                <ShieldCheck size={14} />
                {story.source} · {story.reliability === "official" ? t("officialSource") : t("reportedSource")}
              </span>
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
                href={story.url}
                rel="noreferrer"
                target="_blank"
              >
                {t("readOriginal")}
                <ExternalLink size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-xs leading-5 text-slate-400 light:border-slate-900/10 light:bg-white/70 light:text-slate-600">
        {t("offFieldDataNotice")}
      </p>
    </section>
  );
};

const categoryKeys: Record<OffFieldStoryCategory, TranslationKey> = {
  accessibility: "storyCategoryAccessibility",
  climate: "storyCategoryClimate",
  culture: "storyCategoryCulture",
  governance: "storyCategoryGovernance",
  logistics: "storyCategoryLogistics",
  media: "storyCategoryMedia",
  "team-camp": "storyCategoryTeamCamp",
};

const categoryLabel = (category: OffFieldStoryCategory, t: (key: TranslationKey) => string) => {
  return t(categoryKeys[category]);
};
