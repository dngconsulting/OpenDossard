import {RaceRow} from "../sdk";
import RaceTabs, {IRaceStat} from "../components/RaceTabs";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {createStyles, Theme} from "@material-ui/core";
import {default as React, ReactNode, useEffect, useState} from "react";
import {apiCompetitions, apiRaces} from "../util/api";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import moment from "moment";

interface ICompetition {
    name?: string,
    eventDate?: Date,
    observations?: string,
    races?: string[],
    club: {
        longName: string
    }
}

const EMPTY_COMPETITION: ICompetition = {
    races: ['1/2/3', '4/5'],
    club: { longName: '' }
};

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
    fetchRows: () => Promise<void>
}

export const CompetitionLayout = ({competitionId, children}: {competitionId: number, children: (props: ILayoutChildren) => ReactNode}) => {
    const [rows, setRows] = useState<RaceRow[]>([])
    const [competition, setCompetition] = useState(EMPTY_COMPETITION);
    const [currentRace, setCurrentRace] = useState(null);
    const tabs = computeTabs(rows, competition.races);

    const fetchRows = async () => {
        setRows( await apiRaces.getAllRaces() );
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
        { children({currentRace, rows, fetchRows}) }
    </div>
}

const CompetitionCard = ({competition}: { competition: ICompetition }) => {
    return <Grid container={true} style={{padding: 5}}>
        <Grid item={true} xs={2}>
            <Typography variant="subtitle1" color="textSecondary" component="span">
                {moment(competition.eventDate).format('DD/MM/YYYY')}
            </Typography>
        </Grid>
        <Grid item={true} xs={8}>
            <Typography component="h2" variant="h5" align="center">
                {competition.name}
            </Typography>
        </Grid>
        <Grid item={true} xs={2}>
            <Typography variant="subtitle1" color="textSecondary" align="right">
                {competition.club.longName}
            </Typography>
        </Grid>
        <Grid item={true} xs={12}>
            <Typography variant="subtitle1" paragraph={true} align="center" style={{marginBottom: 0}}>
                {competition.observations}
            </Typography>
        </Grid>
    </Grid>
}
