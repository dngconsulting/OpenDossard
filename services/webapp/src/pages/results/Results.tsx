import React, {Fragment, useContext, useState} from 'react';
import {DataTable} from 'primereact/datatable';
import {InputText} from 'primereact/inputtext';
import {CompetitionLayout} from '../CompetitionLayout';
import {RaceRow} from '../../sdk/models';
import _ from 'lodash';
import {NotificationContext} from '../../components/CadSnackbar';
import {apiRaces} from '../../util/api';
import {filterByRace} from '../../util/services';
import {Delete} from '@material-ui/icons';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import {Tooltip} from '@material-ui/core';
import {Column} from 'primereact/column';
import {withRouter} from 'react-router';

const previousRowEmpty = (index: number, transformedRows: any) => {
    return ((index > 0) && (transformedRows[index - 1].riderNumber === undefined));
};

const EditResultsPage = (gprops: any) => {
    const competitionId = gprops.match.params.id;
    const isEdit = (gprops.match.params.mode === 'edit');
    const [, setNotification] = useContext(NotificationContext);
    const [currentDossard, setCurrentDossard] = useState('');
    const [currentNotRankedStatus, setCurrentNotRankedStatus] = useState({
        status: '',
        rowindex: 0
    });
    const [loading, setLoading] = useState(false);

    const transformRows = (rows: RaceRow[]) => {
        const sortedByRankingWithoutABD = _.remove(_.orderBy(rows, ['rankingScratch'], ['asc']), (item: RaceRow) => item.comment == null);
        const sortedByRanking = _.union(sortedByRankingWithoutABD, rows.filter(item => item.comment !== null));
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
                    ...(item.rankingScratch !== null ? {...item} : {})
                };
            }
        );
    };

    const dossardEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
        return <InputText
            value={currentDossard}
            keyfilter="pint" type="text" style={{height: '1.5em'}} onChange={async (e: any) => {
            setCurrentDossard(e.target.value);
        }}/>;
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

                    await apiRaces.updateRanking({
                        raceRow: {
                            riderNumber: parseInt(currentDossard),
                            raceCode: currentRace,
                            competitionId: parseInt(competitionId),
                            ...(currentNotRankedStatus.status !== '' ? {
                                comment: currentNotRankedStatus.status,
                                rankingScratch: null
                            } : {rankingScratch: parseInt(currentRanking), comment: null}),
                        }
                    });

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
      <Tooltip title='Supprimer ce coureur des résultats'>
        <Delete fontSize={'small'} onClick={async () => {
            try {
                setLoading(true);
                await apiRaces.removeRanking({raceRow: row});
                await fetchRows();
            } finally {
                setLoading(false);
            }
        }}/></Tooltip>;


    const rankOfCate = (rowdata: any, transformedRows: any): string | number => {
        const r = (transformedRows
            .filter((v: RaceRow) => v.catev === rowdata.catev)
            .findIndex((item: RaceRow, index: number) => item.id === rowdata.id)) + 1;
        return (r === 0) ? '' : r;
    };

    const getMedalColorForRank = (ranking: number | string, rankingScratch: number): string => {
        return (ranking <= 3 || rankingScratch <= 3) ? ['#efd807', '#D7D7D7', '#6A3805'][Math.min(rankingScratch, ranking as number) - 1] : '#fff';
    };
    const getPodiumTitle = (rankCate: number, rankScratch: number) => {
        let title = '';
        switch (rankScratch) {
            case 1:
                title += 'Vainqueur au scratch ';
                break;
            case 2:
                title += '2ème au scratch ';
                break;
            case 3:
                title += '3ème au scratch ';
                break;
        }
        switch (rankCate) {
            case 1:
                title += 'Vainqueur dans sa catégorie ';
                break;
            case 2:
                title += '2ème dans sa catégorie ';
                break;
            case 3:
                title += '3ème dans sa catégorie ';
                break;
        }
        return title;
    };

    const AddWinnersIcons = (props: any) => {
        if (props.rowdata.rankingScratch) {
            const lrankOfCate: string | number = rankOfCate(props.rowdata, props.transformedRows);
            if (lrankOfCate <= 3 || props.rowdata.rankingScratch <= 3) {
                return (
                    <Tooltip
                        title={getPodiumTitle(lrankOfCate as number, props.rowdata.rankingScratch)}>
                        <EmojiEventsIcon style={{
                            verticalAlign: 'middle',
                            color: getMedalColorForRank(lrankOfCate, props.rowdata.rankingScratch)
                        }}
                                         fontSize={'small'}/></Tooltip>
                );
            }
        }
        return null;
    };

    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {
                const transformedRows = transformRows(filterByRace(rows, currentRace));
                const callFlagChallenge = async (row: RaceRow) => {
                    try {
                        setLoading(true);
                        await apiRaces.flagChallenge({raceRow: row});
                        await fetchRows();
                    } finally {
                        setLoading(false);
                    }
                };

                const displayRank = (rowdata: any) => {
                    return rowdata.classement + ((rankOfCate(rowdata, transformedRows) !== '' && !isNaN(rowdata.classement) && rowdata.riderNumber) ? (' (' + rankOfCate(rowdata, transformedRows) + ')') : '');
                };
                const getTitleChallengeButton = (row: RaceRow) => {
                    return row.sprintchallenge ? 'Enlever ce vainqueur du challenge' : 'Ajouter comme vainqueur du challenge';
                };

                const notRankedEditor = (allprops: any) => {
                    if (transformedRows[allprops.rowIndex].riderNumber) {
                        return (<div>{displayRank(transformedRows[allprops.rowIndex])}</div>);
                    }
                    return (
                        <select
                            value={currentNotRankedStatus.status === '' ? transformedRows[allprops.rowIndex].classement : currentNotRankedStatus.status}
                            onChange={(e: any) => {
                                setCurrentNotRankedStatus({
                                    status: e.target.value,
                                    rowindex: allprops.rowIndex
                                });
                            }}>
                            <option
                                value="">{transformedRows[allprops.rowIndex].classement}</option>
                            <option value="DSQ">DSQ</option>
                            <option value="ABD">ABD</option>
                            <option value="NC">NC</option>
                        </select>
                    );
                };

                const reorder = async (e: any) => {
                    try {
                        setLoading(true);
                        await apiRaces.reorderRanking({raceRow:e.value});
                        await fetchRows();
                    } finally {
                        setLoading(false);
                    }
                };
                const displayName = (rowdata: RaceRow, column: any) => {
                    return (
                        <span>
                            <AddWinnersIcons
                                rowdata={rowdata}
                                transformedRows={transformedRows}/>
                            {rowdata.sprintchallenge &&
                            <Tooltip
                              title='Vainqueur du challenge du meilleur sprinter'>
                              <EmojiPeopleIcon
                                style={{
                                    verticalAlign: 'middle'
                                }}/>
                            </Tooltip>}{rowdata.name}
                        </span>
                    );
                };

                const flagchallenge = (row: RaceRow) => row.riderNumber &&
                    [<Tooltip key={1}
                              title={getTitleChallengeButton(row)}><EmojiPeopleIcon
                        onClick={(e) => callFlagChallenge(row)}/></Tooltip>, row.sprintchallenge &&
                    <Tooltip key={2} title={getTitleChallengeButton(row)}><Delete
                      onClick={(e) => callFlagChallenge(row)} key={2}
                      style={{height: 15, width: 15}}/></Tooltip>];

                return (
                    <Fragment>
                        <DataTable responsive={true}
                                   value={transformedRows}
                                   emptyMessage="Aucune donnée ne correspond à la recherche"
                                   {...(isEdit ? {onRowReorder: reorder} : undefined)}
                                   loading={loading}
                                   columnResizeMode='expand'
                                   {...(isEdit ? {editMode: 'cell'} : undefined)}
                        >
                            {isEdit && <Column rowReorder={true}
                                               style={{width: '3em'}}/>}
                            <Column field="classement" header="Clt."
                                    {...(isEdit ? {editor: (allprops) => isEdit && notRankedEditor(allprops)} : undefined)}
                                    filterMatchMode='contains'
                                    body={(rowdata: RaceRow, column: any) => displayRank(rowdata)}
                                    style={{overflow: 'visible', width: '60px'}}/>
                            <Column field='riderNumber' header='Doss.' filter={true}
                                    style={{width: '5%'}}
                                    {...(isEdit ? {
                                        editor: (allprops) => {
                                            return dossardEditor(allprops, rows, transformedRows, currentRace, fetchRows);
                                        }
                                    } : undefined)}
                                    editorValidator={(allprops) => {
                                        if (isEdit) {
                                            dossardValidator(allprops, fetchRows, currentRace, transformedRows, rows);
                                        }
                                        return true;
                                    }}
                                    filterMatchMode='contains'/>
                            <Column field='name' header='Nom'
                                    body={(rowdata: RaceRow, column: any) => displayName(rowdata, column)}
                                    filter={true}
                                    filterMatchMode='contains'/>
                            <Column field='club' header='Club' filter={true}
                                    filterMatchMode='contains'/>
                            <Column field='catev' header='Caté.' filter={true}
                                    filterMatchMode='contains'
                                    style={{width: '5%', textAlign: 'center'}}/>
                            <Column field="catea" header="Age" filter={true}
                                    filterMatchMode='contains'
                                    style={{width: '5%', textAlign: 'center'}}/>
                            <Column field='gender' header='Genre' filter={true}
                                    filterMatchMode='contains'
                                    style={{width: '5%', textAlign: 'center'}}/>
                            <Column field="fede" header="Fédé." filter={true}
                                    filterMatchMode='contains'
                                    style={{width: '5%', textAlign: 'center'}}/>
                            {isEdit && <Column style={{width: '5%', textAlign: 'center'}}
                                               body={(raceRow: RaceRow) => flagchallenge(raceRow)}/>}
                            {isEdit && <Column style={{width: '5%', textAlign: 'center'}}
                                               body={(raceRow: RaceRow) => deleteAction(raceRow, fetchRows)}/>}
                        </DataTable>
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default withRouter(EditResultsPage);

