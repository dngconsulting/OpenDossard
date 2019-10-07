import * as React from 'react';
import {Fragment, useContext, useState} from 'react';

import {createStyles, Theme} from '@material-ui/core';
import MaterialTable, {Column} from "material-table";

import {apiRaces} from "../util/api";
import {RaceCreate, RaceRow} from "../sdk";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import AutocompleteInput from "../components/AutocompleteInput";
import Paper from "@material-ui/core/Paper";
import {CompetitionLayout} from "./CompetitionLayout";
import {NotificationContext} from "../components/CadSnackbar";

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
}

const COLUMNS: Array<Column<RaceRow>> = [
    { title: "Dossard", field: "riderNumber",
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center", width: 150 }
    },
    { title: "Coureur", field: "name"},
    { title: "Catégorie", field: "catev",
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center", width: 150 }
    },
    { title: "H/F", field: "gender",
        headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center", width: 150 }
    },
    { title: "Club", field: "club"},
];



const EngagementPage = ({match}: {match: any}) => {
    const competitionId = match.params.id;

    const [ ,setNotification] = useContext(NotificationContext);

    return <CompetitionLayout competitionId={competitionId}>
        {
            ({currentRace, rows, fetchRows}) => (
                <Fragment>
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
                            padding: "dense"
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
                </Fragment>
            )
        }
    </CompetitionLayout>

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
            <AutocompleteInput style={{width: '450px', zIndex: 20}} selection={form.licence} onChangeSelection={(e: any) => setValues({...form, licence: e})}/>
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



export default EngagementPage;
