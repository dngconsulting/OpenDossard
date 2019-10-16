import {Competition, RaceRow} from "../sdk";
import RaceTabs, {IRaceStat} from "../components/RaceTabs";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {createStyles, Theme} from "@material-ui/core";
import {default as React, ReactNode, useEffect, useState} from "react";
import {apiCompetitions, apiRaces} from "../util/api";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import moment from "moment";

const computeTabs = (rows: RaceRow[], races: string[]):IRaceStat => {

    const fromRaces = races.reduce( (acc: IRaceStat , item) => ({...acc, [item]: 0}), {});
    const fromRows = rows.reduce( (acc: IRaceStat , row) => (
        {   ...acc,
            [row.raceCode]: acc[row.raceCode] ? acc[row.raceCode]+1 : 1 }
    ), {})

    return {
        ...fromRaces,
        ...fromRows
    }
}

const pageStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            backgroundColor: theme.palette.grey[100]
        },
    }),
);

interface ILayoutChildren {
    currentRace: string,
    rows: RaceRow[],
    fetchRows: () => Promise<void>,
    fetchCompetition: () => Promise<void>,
    competition: Competition
}

export const CompetitionLayout = ({competitionId, children}: {competitionId: number, children: (props: ILayoutChildren) => ReactNode}) => {
    const [rows, setRows] = useState<RaceRow[]>([])
    const [competition, setCompetition] = useState<Competition>(null);
    const [currentRace, setCurrentRace] = useState(null);
    const tabs = computeTabs(rows, competition ? competition.races : ['1/2/3','4/5']);

    const fetchRows = async () => {
        setRows( await apiRaces.getCompetitionRaces(competitionId) );
    }

    const fetchCompetition = async () => {
        const c = await apiCompetitions.get(`${competitionId}`);
        setCurrentRace(c.races[0]);
        setCompetition(c);
    }

    useEffect( () => {
        fetchCompetition()
        fetchRows()
    }, ['loading'])

    const classes = pageStyles({})

    return <div className={classes.container}>
        <CompetitionCard competition={competition} />
        <RaceTabs tabs={tabs} value={currentRace} onChange={race => setCurrentRace(race)}/>
        { children({competition, currentRace, rows, fetchRows, fetchCompetition}) }
    </div>
}

const CompetitionCard = ({competition}: { competition: Competition }) => {
    const c : Partial<Competition> = competition ? competition : {}
    const club = c.club ? c.club.longName : ''
    return <Grid container={true} style={{padding: 5}}>
        <Grid item={true} xs={2}>
            <Typography variant="subtitle1" color="textSecondary" component="span">
                {moment(c.eventDate).format('DD/MM/YYYY')}
            </Typography>
        </Grid>
        <Grid item={true} xs={8}>
            <Typography component="h2" variant="h5" align="center">
                {c.name}
            </Typography>
        </Grid>
        <Grid item={true} xs={2}>
            <Typography variant="subtitle1" color="textSecondary" align="right">
                {club}
            </Typography>
        </Grid>
        <Grid item={true} xs={12}>
            <Typography variant="subtitle1" paragraph={true} align="center" style={{marginBottom: 0}}>
                {c.observations}
            </Typography>
        </Grid>
    </Grid>
}
