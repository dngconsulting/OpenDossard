import React, {Fragment, useContext, useState} from 'react';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {CompetitionLayout} from '../CompetitionLayout';
import {RaceRow} from '../../sdk';
import _ from 'lodash';
import {NotificationContext} from '../../components/CadSnackbar';
import {apiRaces} from '../../util/api';

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

const filterByRace = (rows : RaceRow[] , race : string) : RaceRow[] => {
    return rows.filter((coureur) => coureur.raceCode === race)
}

const previousRowEmpty = (index: number, transformedRows: any) => {
    return ((index > 0) && (transformedRows[index - 1].riderNumber === undefined));
};

const EditResultsPage = ({match}: { match: any }) => {
    const competitionId = match.params.id;
    const [, setNotification] = useContext(NotificationContext);
    const [currentDossard, setCurrentDossard] = useState('');

    const dossardEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
        return <InputText
            value={currentDossard}
            keyfilter="pint" type="text" onChange={async (e: any) => {
            setCurrentDossard(e.target.value);
        }
        }/>;
    };

    const dossardValidator = async (allprops: any, fetchRows: any, currentRace: string, transformedRows: any, rows: RaceRow[]) => {
        if (previousRowEmpty(allprops.rowIndex, transformedRows)) {
            setCurrentDossard('');
            return true;
        }
        const currentRanking = transformedRows[allprops.rowIndex].classement;
        try {
            if (rows.filter(item => item.riderNumber === parseInt(currentDossard) && item.rankingScratch !== currentRanking).length > 0) {
                console.log('Updating Dossard ' + currentDossard + ' with ranking ' + currentRanking);
                await apiRaces.update({
                    riderNumber: parseInt(currentDossard),
                    raceCode: currentRace,
                    rankingScratch: currentRanking
                });
                fetchRows();
                setNotification({
                    message: `Le coureur ${currentDossard} vient d'etre classé ${currentRanking} `,
                    type: 'info',
                    open: true
                });
            }
        } finally {
            setCurrentDossard('');
        }

        return true;
    };

    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {
                const transformedRows = transformRows(filterByRace(rows, currentRace));

                return (
                    <Fragment>
                        <DataTable value={transformedRows} resizableColumns={true}
                                   onRowReorder={(e) => { console.log('On reorder column')
                                   }}
                                   columnResizeMode="expand" editMode={'cell'}>
                            <Column rowReorder={true} style={{width: '3em'}}/>
                            <Column field="classement" header="Clt" filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="riderNumber" header="Doss." filter={true}
                                    style={{width: '5%'}}
                                    editor={(allprops) => dossardEditor(allprops, rows, transformedRows, currentRace, fetchRows)}
                                    editorValidator={(allprops) => {
                                        dossardValidator(allprops, fetchRows, currentRace, transformedRows, rows);
                                        return true;
                                    }}
                                    filterMatchMode='contains'/>
                            <Column field="name" header="Nom" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="club" header="Club" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="catev" header="Caté. valeur" filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>

                            <Column field="gender" header="Genre" filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>
                        </DataTable>
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default EditResultsPage;

