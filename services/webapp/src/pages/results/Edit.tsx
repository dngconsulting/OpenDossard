import React, {Fragment, useContext, useState} from 'react';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {CompetitionLayout} from '../CompetitionLayout';
import {RaceRow} from '../../sdk';
import _ from 'lodash';
import {NotificationContext} from '../../components/CadSnackbar';
import {apiRaces} from '../../util/api';
import {filterByRace} from '../../util/services';

const previousRowEmpty = (index: number, transformedRows: any) => {
    return ((index > 0) && (transformedRows[index - 1].riderNumber === undefined));
};

const EditResultsPage = ({match}: { match: any }) => {
    const competitionId = match.params.id;
    const [, setNotification] = useContext(NotificationContext);
    const [currentDossard, setCurrentDossard] = useState('');
    const [currentNotRankedStatus, setCurrentNotRankedStatus] = useState({
        status: '',
        rowindex: 0
    });

    const transformRows = (rows: RaceRow[]) => {
        const sortedByRanking = _.orderBy(rows, ['rankingScratch'], ['asc']);
        return sortedByRanking.map((item: any, index: number) => {
                let classementToDisplay = '';
                if (item.comment != null) {
                    classementToDisplay = item.comment;
                } else if (currentNotRankedStatus.status !== '' && index === currentNotRankedStatus.rowindex) {
                    classementToDisplay = currentNotRankedStatus.status;
                } else {
                    classementToDisplay = String(index + 1);
                }
                return {
                    classement: classementToDisplay,
                    ...(item.rankingScratch !== null || item.comment !== null ? {...item} : {})
                };
            }
        );
    };

    const dossardEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {

        return <InputText
            value={currentDossard}
            keyfilter="pint" type="text" style={{height: '1.5em'}} onChange={async (e: any) => {
            setCurrentDossard(e.target.value);
        }
        }/>;
    };

    const dossardValidator = async (allprops: any, fetchRows: any, currentRace: string, transformedRows: any, rows: RaceRow[]) => {
        if (previousRowEmpty(allprops.rowIndex, transformedRows)) {
            setCurrentDossard('');
            setCurrentNotRankedStatus({status: '', rowindex: 0});
            return true;
        }
        const currentRanking = transformedRows[allprops.rowIndex].classement;
        try {
            if (rows.filter(item => item.riderNumber === parseInt(currentDossard) && item.rankingScratch !== currentRanking).length > 0) {
                console.log('Updating Dossard ' + currentDossard + ' with ranking ' + currentRanking);
                if (currentNotRankedStatus.status !== '') {
                    await apiRaces.update({
                        riderNumber: parseInt(currentDossard),
                        raceCode: currentRace,
                        comment: currentNotRankedStatus.status
                    });
                } else {
                    await apiRaces.update({
                        riderNumber: parseInt(currentDossard),
                        raceCode: currentRace,
                        rankingScratch: currentRanking
                    });
                }
                fetchRows();
                setNotification({
                    message: `Le coureur ${currentDossard} vient d'etre classé ${currentRanking} `,
                    type: 'info',
                    open: true
                });
            }
        } finally {
            setCurrentDossard('');
            setCurrentNotRankedStatus({status: '', rowindex: 0});
        }

        return true;
    };

    const notRankedEditor = (transformedRows: any, allprops: any) => {
        console.log('classement ' + transformedRows[allprops.rowIndex].classement);
        if (transformedRows[allprops.rowIndex].riderNumber) {
            return (<div> {transformedRows[allprops.rowIndex].classement}</div>);
        }
        return (
            <select
                value={currentNotRankedStatus.status === '' ? transformedRows[allprops.rowIndex].classement : currentNotRankedStatus.status}
                onChange={(e: any) => {
                    console.log('CurrentChanged DropDown=' + e.target.value);
                    setCurrentNotRankedStatus({
                        status: e.target.value,
                        rowindex: allprops.rowIndex
                    });
                }}>
                <option value="">{transformedRows[allprops.rowIndex].classement}</option>
                <option value="DSQ">DSQ</option>
                <option value="ABD">ABD</option>
            </select>
        );
    };

    /*const notRankedValidator = () => {

    }*/


    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {
                const transformedRows = transformRows(filterByRace(rows, currentRace));
                return (
                    <Fragment>
                        <DataTable value={transformedRows} resizableColumns={true}
                                   emptyMessage="Aucun coureur n'a été engagé sur cette épreuve"
                                   onRowReorder={(e) => {
                                       console.log('On reorder column ' + JSON.stringify(e.value));
                                   }}
                                   columnResizeMode="expand" editMode={'cell'}>
                            <Column rowReorder={true} style={{width: '3em'}}/>
                            <Column field="classement" header="Clt" filter={true}
                                    editor={(allprops) => notRankedEditor(transformedRows, allprops)}
                                    filterMatchMode='contains'
                                    style={{overflow: 'visible', width: '60px'}}/>
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
                            <Column field="catev" header="Caté." filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="catea" header="Age" filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="gender" header="Genre" filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="fede" header="Fédé." filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                        </DataTable>
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default EditResultsPage;

