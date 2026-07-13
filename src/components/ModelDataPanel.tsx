import { Database, ExternalLink } from "lucide-react";
import { useLanguage } from "../i18n";
import { predictionModelMeta } from "../utils/modelPredictions";

export const ModelDataPanel = () => {
  const { t } = useLanguage();

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database className="text-sky-300" size={20} />
            <h2 className="text-lg font-black text-white light:text-slate-950">{t("modelDataTitle")}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
            {t("modelDataDescription")}
          </p>
        </div>
        <span className="rounded-md border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-200 light:text-sky-700">
          {predictionModelMeta.modelName}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label={t("modelTrainedAt")} value={predictionModelMeta.trainedAt} />
        <Info label={t("modelTrainingCutoff")} value={predictionModelMeta.trainingDataCutoff} />
        <Info
          label={t("validationAccuracy")}
          value={predictionModelMeta.validationAccuracy === null ? t("notAvailable") : `${Math.round(predictionModelMeta.validationAccuracy * 100)}%`}
        />
        <Info
          label={t("knockoutValidationAccuracy")}
          value={
            predictionModelMeta.knockoutValidationAccuracy === null
              ? t("notAvailable")
              : `${predictionModelMeta.knockoutValidationCorrect}/${predictionModelMeta.knockoutValidationMatches} / ${Math.round(predictionModelMeta.knockoutValidationAccuracy * 100)}%`
          }
        />
        <Info
          label={t("knockoutOneXTwoAccuracy")}
          value={
            predictionModelMeta.knockoutOneXTwoAccuracy === null
              ? t("notAvailable")
              : `${predictionModelMeta.knockoutOneXTwoCorrect}/${predictionModelMeta.knockoutValidationMatches} / ${Math.round(predictionModelMeta.knockoutOneXTwoAccuracy * 100)}%`
          }
        />
        <Info
          label={t("knockoutDevelopmentAccuracy")}
          value={
            predictionModelMeta.knockoutDevelopmentAccuracy === null
              ? t("notAvailable")
              : `${predictionModelMeta.knockoutDevelopmentCorrect}/${predictionModelMeta.knockoutDevelopmentMatches} / ${Math.round(predictionModelMeta.knockoutDevelopmentAccuracy * 100)}%`
          }
        />
        <Info
          label={t("knockoutHoldoutAccuracy")}
          value={
            predictionModelMeta.knockoutHoldoutAccuracy === null
              ? t("notAvailable")
              : `${predictionModelMeta.knockoutHoldoutCorrect}/${predictionModelMeta.knockoutHoldoutMatches} / ${Math.round(predictionModelMeta.knockoutHoldoutAccuracy * 100)}%`
            }
        />
        <Info
          label={`${t("scoreModelAccuracy")} / ${t("exactScoreAccuracy")}`}
          value={`${predictionModelMeta.knockoutExactScoreCorrect}/${predictionModelMeta.knockoutScoreMatches} / ${Math.round(predictionModelMeta.knockoutExactScoreAccuracy * 100)}%`}
        />
        <Info
          label={t("scoreMeanAbsoluteError")}
          value={`${predictionModelMeta.knockoutScoreMae.toFixed(2)} ${t("goalsUnit")}`}
        />
        <Info
          label={t("scoreWithinOneGoal")}
          value={`${predictionModelMeta.knockoutIndividualTeamWithinOneCorrect}/${predictionModelMeta.knockoutScoreMatches * 2} / ${Math.round(predictionModelMeta.knockoutIndividualTeamWithinOneAccuracy * 100)}%`}
        />
        <Info
          label={t("scorelineWithinOneGoal")}
          value={`${predictionModelMeta.knockoutBothTeamsWithinOneCorrect}/${predictionModelMeta.knockoutScoreMatches} / ${Math.round(predictionModelMeta.knockoutBothTeamsWithinOneAccuracy * 100)}%`}
        />
        <Info
          label={t("groupScoreCalibration")}
          value={`${predictionModelMeta.groupScoreCalibrationRows} / ${predictionModelMeta.groupScoreCalibrationValidationRows} / MAE ${predictionModelMeta.groupScoreCalibrationValidationMae.toFixed(2)}`}
        />
        <Info
          label={t("scoreRecencyHalfLife")}
          value={`${predictionModelMeta.scoreRecencyHalfLifeYears.toFixed(1)} ${t("yearsUnit")}`}
        />
        <Info
          label={t("outcomeRecencyHalfLife")}
          value={`${predictionModelMeta.outcomeRecencyHalfLifeYears.toFixed(1)} ${t("yearsUnit")}`}
        />
        <Info
          label={t("activeFeatureSets")}
          value={`${predictionModelMeta.outcomeFeatureSet} (${predictionModelMeta.outcomeFeatureCount}) / ${predictionModelMeta.scoreFeatureSet} (${predictionModelMeta.scoreFeatureCount})`}
        />
        <Info
          label={t("scoreModelFamily")}
          value={predictionModelMeta.scoreModelFamily}
        />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t("modelSources")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {predictionModelMeta.dataSources.map((source) => (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-slate-300 light:border-slate-900/10 light:text-slate-700"
              key={source}
            >
              <ExternalLink size={12} />
              {source}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400 light:text-slate-600">{predictionModelMeta.notes}</p>
        <p className="mt-2 text-xs font-bold leading-5 text-amber-200 light:text-amber-700">
          {t("modelBacktestCaveat")}
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-sky-200 light:text-sky-700">
          {t("scoreAccuracyCaveat")}
        </p>
      </div>
    </section>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-white">
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-black text-white light:text-slate-950">{value}</p>
  </div>
);
