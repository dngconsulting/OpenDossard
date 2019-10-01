import * as React from 'react';
import {useEffect, useState} from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable, {Column} from "material-table";

import {apiRaces} from "../util/api";
import {RaceRow} from "../sdk";


const styles = (theme : Theme) => ({

});

const create = async (newData: RaceRow, competitionId: number) => {
    await apiRaces.create({
        riderNumber: newData.riderNumber,
        raceCode: newData.raceCode,
        licenceNumber: newData.licenceNumber,
        competitionId
    });
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



    return <MaterialTable
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
            onRowAdd: async (newData) => {
                await create(newData, competitionId)
                fetchData();
            },
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

}

export default withStyles(styles as any)(EngagementPage);
