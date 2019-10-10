import React, {Fragment, useContext} from 'react';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {CompetitionLayout} from '../CompetitionLayout';
import {RaceRow} from '../../sdk';

import _ from 'lodash';
import {apiRaces} from '../../util/api';
import {NotificationContext} from '../../components/CadSnackbar';

const transformRows = (rows: RaceRow[]) => {
    const sortedByRanking = _.orderBy(rows, ['rankingScratch'], ['asc']);
    const rowsTransformed = sortedByRanking.map((item: any, index: number) => {
            return {
                classement: index + 1,
                ...(item.rankingScratch != null ? {...item} : {})
            };
        }
    );
    return rowsTransformed;
};

const EditResultsPage = ({match}: { match: any }) => {
    const competitionId = match.params.id;
    const [, setNotification] = useContext(NotificationContext);

    const dossardEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
        return <InputText keyfilter="pint" type="text" onChange={async (e: any) => {
            let currentRanking = transformedRows[allprops.rowIndex]['classement'];
            await apiRaces.update({
                riderNumber: e.target.value,
                raceCode: currentRace,
                rankingScratch: currentRanking
            });
            fetchRows();
            setNotification({
                message: `Le coureur vient d'etre classé ${currentRanking} `,
                type: 'info',
                open: true
            });
        }
        }/>;
    };
    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {
                const transformedRows = transformRows(rows);

                return (
                    <Fragment>
                        <DataTable value={transformedRows} resizableColumns={true}
                                   columnResizeMode="expand" editMode={'cell'}>
                            <Column field="classement" header="Clt" filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="riderNumber" header="Doss." filter={true}
                                    style={{width: '5%'}}
                                    editor={(allprops) => dossardEditor(allprops, rows, transformedRows, currentRace, fetchRows)}
                                    filterMatchMode='contains'/>
                            <Column field="name" header="Nom" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="catev" header="Caté. valeur" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="club" header="Club" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="gender" header="Genre" filter={true}
                                    filterMatchMode='contains'/>
                        </DataTable>
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default EditResultsPage;

