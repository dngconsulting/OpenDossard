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
import {Delete} from '@material-ui/icons';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import {withRouter} from 'react-router';

const previousRowEmpty = (index: number, transformedRows: any) => {
    return ((index > 0) && (transformedRows[index - 1].riderNumber === undefined));
};

const EditResultsPage = (gprops : any) => {
    const competitionId = gprops.match.params.id;
    const [, setNotification] = useContext(NotificationContext);
    const [currentDossard, setCurrentDossard] = useState('');
    const [currentNotRankedStatus, setCurrentNotRankedStatus] = useState({
        status: '',
        rowindex: 0
    });
    const [loading, setLoading] = useState(false);

    const transformRows = (rows: RaceRow[]) => {
        const sortedByRankingWithoutABD = _.remove(_.orderBy(rows, ['rankingScratch'], ['asc']), (item) => item.comment == null);
        const sortedByRanking = _.union(sortedByRankingWithoutABD, rows.filter(item => item.comment != null));
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
                try {
                    setLoading(true);
                    if (currentNotRankedStatus.status !== '') {

                        await apiRaces.update({
                            riderNumber: parseInt(currentDossard),
                            raceCode: currentRace,
                            competitionId: parseInt(competitionId),
                            comment: currentNotRankedStatus.status,
                        });
                    } else {
                        await apiRaces.update({
                            riderNumber: parseInt(currentDossard),
                            competitionId: parseInt(competitionId),
                            raceCode: currentRace,
                            rankingScratch: parseInt(currentRanking)
                        });
                    }
                    const lrows = await fetchRows();
                    setNotification({
                        message: `Le coureur ${lrows.find((item: any) => item.riderNumber === parseInt(currentDossard)).name} vient d'etre classé ${currentRanking} `,
                        type: 'info',
                        open: true
                    });
                } catch (response) {
                    const jsonError = await response.json();
                    setNotification({
                        message: `La mise à jour a échouée ${jsonError.message ? jsonError.message : ''}`,
                        type: 'error',
                        open: true
                    });
                } finally {
                    setLoading(false);
                }

            }
        } finally {
            setCurrentDossard('');
            setCurrentNotRankedStatus({status: '', rowindex: 0});
        }

        return true;
    };

    const deleteAction = (row: RaceRow, fetchRows: any) => row.riderNumber &&
      <Delete fontSize={'small'} onClick={async () => {
          await apiRaces.removeRanking(row);
          await fetchRows();
      }}/>;

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
                <option value="NC">NC</option>
            </select>
        );
    };

    const displayRank = (rowdata: any, transformedRows: any) => {
        return rowdata.classement + ((rankOfCate(rowdata,transformedRows) !== '' && !isNaN(rowdata.classement)) ? (' (' + rankOfCate(rowdata,transformedRows) + ')') : '');
    }

    const rankOfCate = (rowdata: any, transformedRows: any): any => {
        const r = (transformedRows
            .filter((v: RaceRow) => parseInt(v.catev) === parseInt(rowdata.catev))
            .findIndex((item: RaceRow, index: number) => item.id === rowdata.id)) + 1;
        return (r === 0) ? '': r;
    };

    const getMedalColorForRank = (ranking: number, rankingScratch: number): string => {
        return (ranking <= 3 || rankingScratch <= 3) ? ['#efd807', '#D7D7D7', '#6A3805'][Math.min(rankingScratch, ranking) - 1] : '#fff';
    };

    const highlightWinners = (rowdata: RaceRow, column: any, transformedRows: any) => {
        if (rowdata.rankingScratch) {
            const lrankOfCate: number = rankOfCate(rowdata, transformedRows);
            if (lrankOfCate <= 3 || rowdata.rankingScratch <= 3) {
                return (<span>
                <EmojiEventsIcon style={{
                    verticalAlign: 'middle',
                    color: getMedalColorForRank(lrankOfCate, rowdata.rankingScratch)
                }}
                                 fontSize={'small'}/>
                                 <span style={{fontWeight: 'bold'}}>{rowdata.name}</span>
            </span>);
            }
        }
        return (<span>{rowdata.name}</span>);
    };

    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {
                const transformedRows = transformRows(filterByRace(rows, currentRace));
                const EditResults = (props : any) => <DataTable responsive={true} value={transformedRows}
                                                     emptyMessage="Aucune donnée ne correspond à la recherche"
                                                     onRowReorder={async (e) => {
                                                         try {
                                                             setLoading(true);
                                                             await apiRaces.reorderRanking(e.value);
                                                             await fetchRows();
                                                         } finally {
                                                             setLoading(false);
                                                         }
                                                     }}
                                                     loading={loading}
                                                     columnResizeMode="expand" editMode={'cell'}>
                    <Column rowReorder={true} style={{width: '3em'}}/>
                    <Column field="classement" header="Clt."
                            editor={(allprops) => notRankedEditor(transformedRows, allprops)}
                            filterMatchMode='contains'
                            body={(rowdata: RaceRow, column: any) => displayRank(rowdata, transformedRows)}
                            style={{overflow: 'visible', width: '60px'}}/>
                    <Column field="riderNumber" header="Doss." filter={true}
                            style={{width: '5%'}}
                            editor={(allprops) => dossardEditor(allprops, rows, transformedRows, currentRace, fetchRows)}
                            editorValidator={(allprops) => {
                                dossardValidator(allprops, fetchRows, currentRace, transformedRows, rows);
                                return true;
                            }}
                            filterMatchMode='contains'/>
                    <Column field="name" header="Nom"
                            body={(rowdata: RaceRow, column: any) => highlightWinners(rowdata, column, transformedRows)}
                            filter={true}
                            filterMatchMode='contains'/>
                    <Column field="club" header="Club" filter={true}
                            filterMatchMode='contains'/>
                    <Column field="catev" header="Caté." filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="catea" header="Age" filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="gender" header="Genre" filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="fede" header="Fédé." filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column style={{width: '5%'}}
                            body={(raceRow: RaceRow) => deleteAction(raceRow, fetchRows)}/>

                </DataTable>

                const ViewResults = (props : any) => <DataTable responsive={true} value={transformedRows} resizableColumns={true}
                                                     emptyMessage="Aucune donnée ne correspond à la recherche"
                                                     loading={loading}
                                                     columnResizeMode="expand" >
                    <Column field="classement" header="Clt."
                            filterMatchMode='contains'
                            body={(rowdata: RaceRow, column: any) => displayRank(rowdata, transformedRows)}
                            style={{overflow: 'visible', width: '60px'}}/>
                    <Column field="riderNumber" header="Doss." filter={true}
                            style={{width: '5%'}}
                            filterMatchMode='contains'/>
                    <Column field="name" header="Nom"
                            body={(rowdata: RaceRow, column: any) => highlightWinners(rowdata, column, transformedRows)}
                            filter={true}
                            filterMatchMode='contains'/>
                    <Column field="club" header="Club" filter={true}
                            filterMatchMode='contains'/>
                    <Column field="catev" header="Caté." filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="catea" header="Age" filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="gender" header="Genre" filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                    <Column field="fede" header="Fédé." filter={true}
                            filterMatchMode='contains' style={{width: '5%',textAlign: 'center'}}/>
                </DataTable>

                return (
                    <Fragment>
                        {console.log(JSON.stringify(gprops.location))}
                        {gprops.history.location.search === '?view' ? <ViewResults/> : <EditResults/> }
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default withRouter(EditResultsPage);

