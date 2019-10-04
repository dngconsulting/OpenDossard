import * as React from 'react';
import {useEffect, useState} from 'react';

import {createStyles, Theme} from '@material-ui/core';
import MaterialTable, {Column} from "material-table";

import {apiCompetitions, apiRaces} from "../util/api";
import {RaceCreate, RaceRow} from "../sdk";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {CadSnackBar, EMPTY_NOTIF} from "../components/CadSnackbar";
import moment from 'moment';
import RaceTabs, {IRaceStat} from "../components/RaceTabs";
import AutocompleteInput from "../components/AutocompleteInput";
import Paper from "@material-ui/core/Paper";

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
}

const COLUMNS: Array<Column<RaceRow>> = [
    { title: "Dossard", field: "riderNumber", type: "numeric", headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center"}
    },
    { title: "Coureur", field: "name", editable: "never" },
    { title: "Club", field: "club", editable: "never" },
];

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

const EngagementPage = ({match}: {match: any}) => {

    const competitionId = match.params.id;

    const [rows, setRows] = useState<RaceRow[]>([])
    const [notification, setNotification] = useState(EMPTY_NOTIF);
    const [competition, setCompetition] = useState(EMPTY_COMPETITION);
    const [currentRace, setCurrentRace] = useState(null);
    const tabs = computeTabs(rows, competition.races);

    const fetchRows = async () => {
        setRows( await apiRaces.getAllRaces() );
    }

    const fetchCompetition = async () => {
        const c = await apiCompetitions.get(competitionId);
        setCurrentRace(c.races[0]);
        setCompetition(c);
    }

    useEffect( () => {
        fetchCompetition()
        fetchRows()
    }, ['loading'])

    return <div>
        <CompetitionCard competition={competition} />
        <RaceTabs tabs={tabs} value={currentRace} onChange={race => setCurrentRace(race)}/>
        <Grid container={true}>
            <CreationForm competitionId={competitionId}
                          race={currentRace}
                          onSuccess={(form) => {
                              fetchRows();
                              setNotification({
                                  message: `Le coureur ${form.licence.name} ${form.licence.firstName} a bien été enregistré sous le dossard ${form.riderNumber}`,
                                  open: true,
                                  type: 'success'
                              })
                          }}
                          onError={(message) => {
                              setNotification({
                                  message,
                                  open: true,
                                  type: 'error'
                              })
                          }}
            />
        </Grid>
        <MaterialTable
            columns={COLUMNS}
            data={rows.filter( row => row.raceCode === currentRace)}
            options={{
                filtering: true,
                actionsColumnIndex: -1,
                paging: false,
                toolbar: false,
            }}
            editable={{
                onRowDelete: async (oldData) => {
                    await apiRaces._delete(`${oldData.id}`);
                    fetchRows();
                    setNotification({
                        message: `Le coureur ${oldData.name} a été supprimé de la compétition`,
                        type: 'info',
                        open: true
                    });
                }
            }}
            localization={{
                grouping: {
                    groupedBy: 'Regroupement par :',
                    placeholder: 'Glisser ici la colonne a regrouper'
                },
                body: {
                    editRow: {
                        deleteText : 'Etes vous sur de vouloir désinscrire ce coureur ?'
                    }
                }
            }}
        />
        <CadSnackBar notification={notification} onClose={() => setNotification(EMPTY_NOTIF)}/>
    </div>

}

const formStyles = makeStyles((theme: Theme) =>
    createStyles({
        field: {
            marginLeft: 10,
            marginRight: 10
        },
    }),
);

interface IForm {
    licence: null | {
        id: number,
        name: string,
        firstName: string
    },
    riderNumber: string
}

const CreationForm = (
    {competitionId, race, onSuccess, onError}:
        {
            competitionId: number,
            race: string,
            onSuccess: (race: IForm) => void,
            onError: (message: string) => void
        }
) => {

    const [form, setValues] = useState<IForm>({licence: null, riderNumber: ''});

    const submit = async () => {
        try {
            const dto: RaceCreate = {
                licenceId: form.licence && form.licence.id,
                raceCode: race,
                riderNumber: parseInt(form.riderNumber),
                competitionId
            }
            await create(dto);
            onSuccess(form)
            setValues({licence: null, riderNumber: ''});
        } catch (e) {
            if ( e.json ) {
                const {message} = (await e.json());
                onError(message);
            } else {
                console.log(e)
                onError('Une erreur est survenue');
            }
        }
    };

    const classes = formStyles({});

    return <Paper style={{paddingLeft: 20, paddingBottom: 20, width: '100%'}} square={true}>
        <Grid container={true} spacing={3} alignItems={"baseline"}>
            <Typography variant="h5" gutterBottom={true} style={{marginRight: 20}}>
                Nouveau Coureur :
            </Typography>
            <AutocompleteInput style={{width: '400px', zIndex: 20}} selection={form.licence} onChangeSelection={(e: any) => setValues({...form, licence: e})}/>
            <TextField
                label="Numéro de dossard"
                value={form.riderNumber}
                className={classes.field}
                onChange={e => setValues({...form, riderNumber: e.target.value})}
                margin="normal"
                inputProps={{
                    onKeyPress: e => e.key === 'Enter' && submit(),
                    style: {textAlign: 'center'}
                }}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={submit}
            >
                Ajouter
            </Button>
        </Grid>
    </Paper>
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

export default EngagementPage;
