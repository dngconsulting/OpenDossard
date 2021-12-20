import { apiCompetitions } from "../util/api";
import { CompetitionEntity, CompetitionFilter } from "../sdk";

export const fetchCompetitions = async ({
  competitionFilter,
  setNotification,
  setData
}: {
  competitionFilter: CompetitionFilter;
  setNotification: any;
  setData: (data: CompetitionEntity[]) => void;
}) => {
  try {
    const results = await apiCompetitions.getCompetitionsByFilter({
      competitionFilter
    });
    setData(results);
  } catch (ex) {
    setNotification({
      message: `Impossible de récupérer la liste des épreuves`,
      open: true,
      type: "error"
    });
  }
};
