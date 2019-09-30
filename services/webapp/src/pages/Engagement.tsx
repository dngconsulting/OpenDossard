import * as React from 'react';
import {useEffect, useState} from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable from "material-table";

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
        columns={[
            { title: "Licence", field: "licenceNumber" },
            { title: "Nom", field: "name", editable: "never" },
            { title: "Prénom", field: "firstName", editable: "never" },
            { title: "Année", field: "birthYear", editable: "never" },
            { title: "Club", field: "club", editable: "never" },
            { title: "Dossard", field: "riderNumber" },
            { title: "Course", field: "raceCode" },
        ]}
        data={races}
        options={{
            filtering: true,
            actionsColumnIndex: -1,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20],
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
    />

}

export default withStyles(styles as any)(EngagementPage);
