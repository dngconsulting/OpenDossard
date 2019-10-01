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

    const [races, setRaces] = useState<RaceRow[]>([])

    const fetchData = async ()  => {
        const data = await apiRaces.getAllRaces();
        setRaces( data );
    }

    useEffect( () => {
        fetchData()
    }, ['loading'])

    return <div>
        <CreationForm {...{competitionId, fetchData}}/>
        <MaterialTable
            title={`Engagement ${competitionId}`}
            columns={COLUMNS}
            data={races}
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
                    fetchData()
                }
            }}
            localization={{
                grouping: {
                    groupedBy: 'Regroupement par :',
                    placeholder: 'Glisser ici la colonne a regrouper'
                },
                body: {}
            }}
        />
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

const CreationForm = ({competitionId, fetchData} : { competitionId: number, fetchData: () => {}}) => {

    const [newRace, setValues] = useState<RaceCreate>({
        competitionId
    });

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
                onChange={e => setValues({...newRace, riderNumber: parseInt(e.target.value)})}
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
                    await create(newRace)
                    await fetchData()
                }}
            >
                OK
            </Button>
        </Grid>
    </Card>
}

export default EngagementPage;
