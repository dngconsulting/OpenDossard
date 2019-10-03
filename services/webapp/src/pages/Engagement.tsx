import * as React from 'react';
import {useEffect, useState} from 'react';

import {createStyles, Theme} from '@material-ui/core';
import MaterialTable, {Column} from "material-table";

import {apiRaces} from "../util/api";
import {RaceCreate, RaceRow} from "../sdk";
import Card from "@material-ui/core/Card";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {CadSnackBar, EMPTY_NOTIF} from "../components/CadSnackbar";

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
}

const update = async (newData: RaceRow) => {
    await apiRaces.update({
        id: newData.id,
        riderNumber: newData.riderNumber,
        raceCode: newData.raceCode
    });
}

const COLUMNS: Array<Column<RaceRow>> = [
    { title: "Licence", field: "licenceNumber", type: "numeric", headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center"}
    },
    { title: "Nom", field: "name", editable: "never" },
    { title: "Prénom", field: "firstName", editable: "never" },
    { title: "Année", field: "birthYear", editable: "never" },
    { title: "Club", field: "club", editable: "never" },
    { title: "Dossard", field: "riderNumber", type: "numeric", headerStyle: { textAlign: "center" },
        cellStyle: { textAlign: "center"},
        defaultSort: "asc"
    },
    { title: "Course", field: "raceCode", editable: "always"},
];

const EngagementPage = ({match}: {match: any}) => {

    const competitionId = match.params.id;

    const [rows, setRows] = useState<RaceRow[]>([])
    const [notification, setNotification] = useState(EMPTY_NOTIF);

    const fetchRows = async ()  => {
        setRows( await apiRaces.getAllRaces() );
    }

    useEffect( () => {
        fetchRows()
    }, ['loading'])

    return <div>
        <Grid container={true}>
            <CreationForm competitionId={competitionId}
                          onSuccess={(race) => {
                              fetchRows();
                              setNotification({
                                  message: `Le coureur ${race.licenceNumber} a bien été enregistré sous le dossard ${race.riderNumber}`,
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
            title={`Engagement ${competitionId}`}
            columns={COLUMNS}
            data={rows}
            options={{
                filtering: true,
                actionsColumnIndex: -1,
                pageSize: 500,
                pageSizeOptions: [],
                grouping: true,
            }}
            editable={{
                onRowUpdate: async (newData, oldData) => {
                    await update(newData)
                    fetchRows()
                    setNotification({
                        message: `L'inscription de ${oldData.name} ${oldData.firstName} a été modifiée`,
                        type: 'success',
                        open: true
                    });
                },
                onRowDelete: async (oldData) => {
                    await apiRaces._delete(`${oldData.id}`);
                    fetchRows();
                    setNotification({
                        message: `Le coureur ${oldData.name} ${oldData.firstName} a été supprimé de la compétition`,
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

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        field: {
            marginLeft: 10,
            marginRight: 10
        },
    }),
);

const CreationForm = (
    {competitionId, onSuccess, onError}:
        {
            competitionId: number,
            onSuccess: (race: RaceCreate) => void,
            onError: (message: string) => void
        }
) => {

    const EMPTY_FORM = {licenceNumber: '', riderNumber: '', raceCode: ''};
    const [newRace, setValues] = useState(EMPTY_FORM);

    const classes = useStyles({});

    return <Card style={{margin: 20, padding: 20}}>
        <Typography variant="h6" gutterBottom={true}>
            Nouveau coureur :
        </Typography>
        <Grid container={true} spacing={3} alignItems={"baseline"}>
            <TextField
                label="Numéro de licence"
                value={newRace.licenceNumber}
                className={classes.field}
                onChange={e => setValues({...newRace, licenceNumber: e.target.value})}
                margin="normal"
            />
            <TextField
                label="Numéro de dossard"
                value={newRace.riderNumber}
                className={classes.field}
                onChange={e => setValues({...newRace, riderNumber: e.target.value})}
                margin="normal"
            />
            <TextField
                label="Course"
                value={newRace.raceCode}
                className={classes.field}
                onChange={e => setValues({...newRace, raceCode: e.target.value})}
                margin="normal"
            />
            <Button
                variant="contained"
                color="primary"
                onClick={ async () => {
                    try {
                        const dto = {
                            ...newRace,
                            riderNumber: parseInt(newRace.riderNumber),
                            competitionId
                        }
                        await create(dto);
                        onSuccess(dto)
                        setValues(EMPTY_FORM);
                    } catch (e) {
                        const {message} = await e.json();
                        onError(message);
                    }
                }}
            >
                OK
            </Button>
        </Grid>
    </Card>
}

export default EngagementPage;
