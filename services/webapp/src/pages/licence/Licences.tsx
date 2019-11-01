import * as React from 'react';
import MaterialTable, {Query, QueryResult} from 'material-table';
import {AppText as T} from '../../util/text';
import {apiLicences} from '../../util/api';
import {Licence, Search} from '../../sdk';
import {cadtheme} from '../../theme/theme';
import {Button, Paper} from '@material-ui/core';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
}

const getPageSizeLicencesForPageDebounced = AwesomeDebouncePromise((p) => apiLicences.getPageSizeLicencesForPage(p),500)

const fetchLicences = async (query: Query<Licence>): Promise<QueryResult<Licence>> => {
    const res = await getPageSizeLicencesForPageDebounced(prepareFilter(query));
    return {data: res.data, page: res.page, totalCount: res.totalCount};
};

const prepareFilter = (query: Query<Licence>): Search => {
    const filters: any = [];
    if (query.filters.length > 0) {
        query.filters.forEach((col: any) => {
            filters.push({name: col.column.field, value: col.value});
        });
    }
    return {
        currentPage: query.page,
        pageSize: query.pageSize,
        orderBy: query.orderBy ? query.orderBy.field : undefined,
        orderDirection: query.orderDirection ? query.orderDirection.toUpperCase() : 'ASC',
        search:query.search,
        filters
    };
};

const LicencesPage = (props: ILicencesProps) => {
    return (
        <Paper style={{padding:'5px', height:'100%'}}>
            <MaterialTable
                title={T.LICENCES.TITLE}
                columns={[
                    {title: 'Licence', field: 'licenceNumber',cellStyle:{width:50}},
                    {title: 'CatéV.', field: 'catev',cellStyle:{width:50}},
                    {title: 'CatéA', field: 'catea',cellStyle:{width:50}},
                    {title: 'Nom', field: 'name',cellStyle:{width:200}},
                    {title: 'Prénom', field: 'firstName',cellStyle:{width:200}},
                    {title: 'Club', field: 'club',cellStyle:{width:400}},
                    {title: 'Genre', field: 'gender',cellStyle:{width:50}},
                    {title: 'Dept', field: 'dept',cellStyle:{width:50}},
                    {title: 'Année', field: 'birthYear',cellStyle:{width:100}},
                    {title: 'Fédé', field: 'fede',cellStyle:{width:50},filtering:false},

                ]}
                data={fetchLicences}
                options={{
                    filtering: true,
                    toolbar: true,
                    padding: 'dense',
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: [5, 10, 20],
                    search: true,
                    headerStyle: {
                        backgroundColor: cadtheme.palette.primary.main,
                        color: '#FFF',
                        fontSize: 15,
                        zIndex: 'auto'
                    }
                }}
                editable={{
                    onRowDelete: oldData =>
                        new Promise((resolve, reject) => {
                            apiLicences._delete(`${oldData.id}`).then(() => resolve());
                        }),
                }}
                actions={[
                    {
                        icon: () => <Button variant={'contained'} color={'primary'}>Ajouter une licence</Button>,

                        tooltip: T.LICENCES.ADD_NEW_LICENCE,
                        isFreeAction: true,
                        onClick: () => {
                            props.history.push('/licence/new');
                        }
                    },
                    {
                        icon: 'edit',
                        tooltip: T.LICENCES.EDIT_TOOL_TIP,
                        onClick: (event, rowData:any)=> {
                            props.history.push('/licence/'+rowData.id);
                        }
                    }
                ]}
                localization={{
                    body: {
                        editRow: {
                            saveTooltip: T.LICENCES.EDIT_ROW.SAVE_TOOL_TIP,
                            cancelTooltip: T.LICENCES.EDIT_ROW.CANCEL_TOOL_TIP,
                            deleteText: T.LICENCES.EDIT_ROW.DELETE_TEXT
                        },
                        deleteTooltip: T.LICENCES.DELETE_TOOL_TIP,
                        editTooltip: T.LICENCES.EDIT_TOOL_TIP,
                        emptyDataSourceMessage: T.LICENCES.EMPTY_DATA_SOURCE_MESSAGE,
                        filterRow: {
                            filterTooltip: T.LICENCES.FILTER_TOOL_TIP
                        },
                    },
                    pagination: {
                        labelRowsSelect: T.LICENCES.PAGINATION.LABEL_ROWS_SELECT,
                        firstTooltip: T.LICENCES.PAGINATION.FIRST_TOOL_TIP,
                        previousTooltip: T.LICENCES.PAGINATION.PREVIOUS_TOOL_TIP,
                        nextTooltip: T.LICENCES.PAGINATION.NEXT_TOOL_TIP,
                        lastTooltip: T.LICENCES.PAGINATION.LAST_TOOL_TIP,
                        labelDisplayedRows: T.LICENCES.PAGINATION.LABEL_DISPLAYED_ROWS
                    },
                    toolbar: {
                        searchTooltip: T.LICENCES.TOOLBAR.SEARCH_TOOL_TIP,
                        searchPlaceholder: T.LICENCES.TOOLBAR.SEARCH_PLACE_HOLDER
                    }
                }}
            />
        </Paper>
    )
        ;
};

export default LicencesPage;
