import * as React from 'react';
import {Fragment, useContext} from 'react';
import MaterialTable, {Column} from "material-table";

import {apiRaces} from "../util/api";
import {RaceRow} from "../sdk";
import Grid from "@material-ui/core/Grid";
import {CompetitionLayout} from "./CompetitionLayout";
import {NotificationContext} from "../components/CadSnackbar";
import {CreationForm} from "./engagement/EngagementCreation";


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
                                      onSuccess={() => {
                                          fetchRows();

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

export default EngagementPage;
