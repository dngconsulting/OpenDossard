import { apiCompetitions } from "../util/api";
import { CompetitionEntity, CompetitionFilter } from "../sdk";
import _ from 'lodash';

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
    if (competitionFilter?.displayFuture === true ) setData(_.orderBy(results, ['eventDate'], ['asc']))
    else setData(results);
  } catch (ex) {
    setNotification({
      message: `Impossible de récupérer la liste des épreuves`,
      open: true,
      type: "error"
    });
  }
};
