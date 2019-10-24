import {Competition, RaceRow} from '../sdk';
import RaceTabs, {IRaceStat} from '../components/RaceTabs';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {createStyles, Theme} from '@material-ui/core';
import {default as React, ReactNode, useEffect, useState} from 'react';
import {apiCompetitions, apiRaces} from '../util/api';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';

const computeTabs = (rows: RaceRow[], races: string[]): IRaceStat => {

    const fromRaces = races.reduce((acc: IRaceStat, item) => ({...acc, [item]: 0}), {});
    const fromRows = rows.reduce((acc: IRaceStat, row) => (
        {
            ...acc,
            [row.raceCode]: acc[row.raceCode] ? acc[row.raceCode] + 1 : 1
        }
    ), {});

    return {
        ...fromRaces,
        ...fromRows
    };
};

const pageStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            padding : '5px',
            backgroundColor: theme.palette.grey[100]
        },
    }),
);

interface ILayoutChildren {
    currentRace: string,
    rows: RaceRow[],
    fetchRows: () => Promise<any>,
    fetchCompetition: () => Promise<void>,
    competition: Competition,
}

export const CompetitionLayout = ({competitionId, children}: { competitionId: number, children: (props: ILayoutChildren) => ReactNode }) => {
    const [rows, setRows] = useState<RaceRow[]>([]);
    const [competition, setCompetition] = useState<Competition>(null);
    const [currentRace, setCurrentRace] = useState(null);
    const tabs = computeTabs(rows, competition ? competition.races : ['1/2/3', '4/5']);

    const fetchRows = async () => {
        const lrows = await apiRaces.getCompetitionRaces(competitionId);
        setRows(lrows);
        return lrows;
    };

    const fetchCompetition = async () => {
        const c = await apiCompetitions.get(`${competitionId}`);
        setCurrentRace(c.races[0]);
        setCompetition(c);
    };

    useEffect(() => {
        fetchCompetition();
        fetchRows();
    }, ['loading']);

    const classes = pageStyles({});

    return (
        <Paper className={classes.container}>
            <div>
                <CompetitionCard competition={competition}/>
                <RaceTabs tabs={tabs} value={currentRace} onChange={race => setCurrentRace(race)}/>
                {children({competition, currentRace, rows, fetchRows, fetchCompetition})}
            </div>
        </Paper>);
};

const CompetitionCard = ({competition}: { competition: Competition }) => {
    const c: Partial<Competition> = competition ? competition : {};
    const club = c.club ? c.club.longName : '';
    return <Grid container={true} style={{padding: 10, width: '100%', justifyContent: 'center'}}>
        <Typography component="h2" variant="h5" align="center">
            {c.name} organisé le {moment(c.eventDate).format('DD/MM/YYYY')} par {club}
        </Typography>
    </Grid>;
};
