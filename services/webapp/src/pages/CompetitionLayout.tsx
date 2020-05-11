import {CompetitionEntity as Competition, RaceRow} from '../sdk';
import RaceTabs, {IRaceStat} from '../components/RaceTabs';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {createStyles, Theme} from '@material-ui/core';
import {default as React, ReactNode, useEffect, useState} from 'react';
import {apiCompetitions, apiRaces} from '../util/api';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import {Link} from "react-router-dom";
import AssignmentIcon from "@material-ui/icons/Assignment";
import FormatListNumberedIcon from "@material-ui/icons/FormatListNumbered";

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

export const CompetitionLayout = ({history,competitionId, displayType, children}: {history?:any,competitionId: number, displayType: 'results'| 'engagements',children: (props: ILayoutChildren) => ReactNode }) => {
    const [rows, setRows] = useState<RaceRow[]>([]);
    const [competition, setCompetition] = useState<Competition>(null);
    const [currentRace, setCurrentRace] = useState(null);
    const tabs = computeTabs(rows, competition ? competition.races : []);

    const fetchRows = async () => {
        const lrows = await apiRaces.getCompetitionRaces({id:competitionId});
        setRows(lrows);
        return lrows;
    };

    const fetchCompetition = async () => {
        const c = await apiCompetitions.getCompetition({id:`${competitionId}`});
        setCurrentRace(c.races[0]);
        setCompetition(c);
    };

    useEffect(() => { const f = async () => {
        await fetchCompetition();
        await fetchRows();
        if (history.location.hash) {
            setCurrentRace(history.location.hash.substring(1));
        }
    }
        f()
    }, ['Loading']);

    const classes = pageStyles({});
    return (
        <Paper className={classes.container}>
            <div>
                <CompetitionCard rows={rows} history={history} displayType={displayType} competition={competition}/>
                <RaceTabs selected={currentRace} tabs={tabs} value={currentRace} onChange={
                    race => {
                        history.push(history.location.pathname+'#' + race)
                        setCurrentRace(race)}
                }/>
                {children({competition, currentRace, rows, fetchRows, fetchCompetition})}
            </div>
        </Paper>);
};

const CompetitionCard = ({rows,history,displayType,competition}: {rows:RaceRow[],history:any,displayType:'results'|'engagements',competition: Competition }) => {
    const c: Partial<Competition> = competition ? competition : {};
    const club = c.club ? c.club.longName : '';
    const existResults = rows.length>0
    const titleCard = displayType==='results'?'Classements':'Engagements';
    return <Grid container={true} style={{padding: 10, width: '100%', justifyContent: 'center'}}>
        <Typography component="h5" variant="h5" align="center">
            {displayType==='results'?<FormatListNumberedIcon style={{verticalAlign:'text-top'}}/>:<AssignmentIcon style={{verticalAlign:'text-top'}}/>} {titleCard} {c.name}  <Typography>Organisé par {club} le {moment(c.eventDate).format('DD/MM/YYYY')} </Typography>
            <div style={{fontSize:14}}>
                {displayType==='results' && <Link to={"/competition/" + competition?.id + "/engagement/edit"+history.location.hash}>Accéder aux engagements</Link>}
                {displayType==='engagements' && existResults && <Link to={"/competition/" + competition?.id + "/results/edit"+history.location.hash}>Accéder aux classements</Link>}
            </div>
        </Typography>
    </Grid>;
};
