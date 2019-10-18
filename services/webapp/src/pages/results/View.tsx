import React, {Fragment} from 'react';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {CompetitionLayout} from '../CompetitionLayout';
import _ from 'lodash';
import {filterByRace} from '../../util/services';
import {RaceRow} from '../../sdk';

const filterOnlyRanked = (rows : RaceRow[]) : RaceRow[] => {
    return rows.filter(item => item.rankingScratch !=null || item.comment!=null).map((item: any, index: number) => {
            return {
                classement: item.comment!=null?item.comment:item.rankingScratch,
                ...item
            };
        }
    );
}
const ViewResultsPage = ({match}: { match: any }) => {
    const competitionId = match.params.id;

    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition, currentRace, rows, fetchRows}) => {

                return (
                    <Fragment>
                        <DataTable value={filterOnlyRanked(filterByRace(_.orderBy(rows, ['rankingScratch'], ['asc']),currentRace))}
                                   columnResizeMode="expand" emptyMessage="Aucun résultat n'a encore été saisi pour cette épreuve">
                            <Column field="classement" header="Clt" filter={true}
                                    filterMatchMode='contains' style={{width: '5%'}}/>
                            <Column field="riderNumber" header="Doss." filter={true}
                                    style={{width: '5%'}}
                                    filterMatchMode='contains'/>
                            <Column field="name" header="Nom" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="club" header="Club" filter={true}
                                    filterMatchMode='contains'/>
                            <Column field="catev" header="Caté." filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>
                            <Column field="catea" header="Age" filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>
                            <Column field="gender" header="Genre" filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>
                            <Column field="fede" header="Fédé." filter={true}
                                    filterMatchMode='contains'  style={{width: '5%'}}/>
                        </DataTable>
                    </Fragment>
                );
            }
        }
    </CompetitionLayout>;
};

export default ViewResultsPage;

