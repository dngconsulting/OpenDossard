import { CompetitionEntity as Competition, RaceRow } from '../../sdk';
import RaceTabs, { IRaceStat } from '../../components/RaceTabs';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { createStyles, Theme } from '@material-ui/core';
import { default as React, ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { apiCompetitions, apiRaces } from '../../util/api';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import ForwardIcon from '@material-ui/icons/Forward';
import AssignmentIcon from '@material-ui/icons/Assignment';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import { capitalizeFirstLetter } from '../../util';

const computeTabs = (rows: RaceRow[], races: string[]): IRaceStat => {
  const fromRaces = races.reduce((acc: IRaceStat, item) => ({ ...acc, [item]: 0 }), {});
  const fromRows = rows.reduce(
    (acc: IRaceStat, row) => ({
      ...acc,
      [row.raceCode]: acc[row.raceCode] ? acc[row.raceCode] + 1 : 1
    }),
    {}
  );

  return {
    ...fromRaces,
    ...fromRows
  };
};

const pageStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: '5px',
      backgroundColor: theme.palette.grey[100]
    }
  })
);

interface ILayoutChildren {
  currentRace: string;
  rows: RaceRow[];
  fetchRows: () => Promise<any>;
  fetchCompetition: () => Promise<void>;
  competition: Competition;
}

export const CompetitionLayout = ({
  history,
  competitionId,
  displayType,
  children
}: {
  history?: any;
  competitionId: number;
  displayType: 'results' | 'engagements';
  children: (props: ILayoutChildren) => ReactNode;
}) => {
  const [rows, setRows] = useState<RaceRow[]>([]);
  const [competition, setCompetition] = useState<Competition>(null);
  const [currentRace, setCurrentRace] = useState(null);
  const tabs = computeTabs(rows, competition ? competition.races : []);
  const [ranking, setRanking] = useState(new Map());

  const fetchRows = async () => {
    const lrows = await apiRaces.getCompetitionRaces({ id: competitionId });
    setRows(lrows);
    return lrows;
  };

  const fetchCompetition = async () => {
    const c = await apiCompetitions.getCompetition({ id: `${competitionId}` });

    if (history.location.hash && c.races.includes(history.location.hash.substring(1))) {
      setCurrentRace(history.location.hash.substring(1));
    } else {
      history.push(history.location.pathname + '#' + c.races[0]);
      setCurrentRace(c.races[0]);
    }

    setCompetition(c);
  };

  useEffect(() => {
    const rankingTotal = new Map();
    for (const raceKey in tabs) {
      const rankingByRace = rows.filter(
        race => race.raceCode === raceKey && (race.rankingScratch !== null || race.comment !== null)
      ).length;
      rankingTotal.set(raceKey, rankingByRace);
    }
    setRanking(rankingTotal);
  }, [rows]);

  useLayoutEffect(() => {
    const f = async () => {
      await fetchCompetition();
      await fetchRows();
    };
    f();
  }, []);

  const classes = pageStyles({});
  return (
    <Paper className={classes.container}>
      <div>
        <CompetitionCard rows={rows} history={history} displayType={displayType} competition={competition} />
        <RaceTabs
          selected={currentRace}
          tabs={tabs}
          value={currentRace}
          ranking={displayType === 'results' ? ranking : new Map()}
          onChange={race => {
            history.push(history.location.pathname + '#' + race);
            setCurrentRace(race);
          }}
        />
        {children({ competition, currentRace, rows, fetchRows, fetchCompetition })}
      </div>
    </Paper>
  );
};

const CompetitionCard = ({
  rows,
  history,
  displayType,
  competition
}: {
  rows: RaceRow[];
  history: any;
  displayType: 'results' | 'engagements';
  competition: Competition;
}) => {
  const c: Partial<Competition> = competition ? competition : {};
  const club = c.club ? c.club.longName : '';
  const titleCard = displayType === 'results' ? 'Classements' : 'Engagements';
  return (
    <Grid container={true} style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
      <Typography component="h6" variant="h6" align="center">
        {displayType === 'results' ? (
          <FormatListNumberedIcon style={{ verticalAlign: 'text-top' }} />
        ) : (
          <AssignmentIcon style={{ verticalAlign: 'text-top' }} />
        )}
        {titleCard}
        <ForwardIcon style={{ verticalAlign: 'text-top' }} />
        {c.name} ({club}) -{' '}
        {capitalizeFirstLetter(
          moment(c.eventDate)
            .locale('fr')
            .format('dddd DD MMM YYYY')
        )}
      </Typography>
    </Grid>
  );
};
