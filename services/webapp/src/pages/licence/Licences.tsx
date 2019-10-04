import * as React from 'react';
import MaterialTable, {Query, QueryResult} from 'material-table';
import {AppText as T} from '../../util/text';
import {apiLicences} from '../../util/api';
import {Licence, Search} from '../../sdk';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
}

const fetchLicences = async (query: Query<Licence>) : Promise<QueryResult<Licence>> => {
    const res = await apiLicences.getPageSizeLicencesForPage(
        prepareFilter(query));
    return {data: res.data, page: res.page, totalCount: res.totalCount};
};

const prepareFilter = (query: Query<Licence>) : Search =>{
    const filters:any = [];
    if(query.filters.length>0){
        query.filters.forEach((col: any)=>{
            filters.push({name: col.column.field, value: col.value})
        })
    }
    return {currentPage:query.page,
        pageSize:query.pageSize,
        orderBy:query.orderBy?query.orderBy.field:undefined,
        orderDirection:query.orderDirection?query.orderDirection.toUpperCase():'ASC',
        filters}
};

const LicencesPage = (props: ILicencesProps)=> {

        return (
            <MaterialTable
                title={T.LICENCES.TITLE}
                columns={[
                    {title: 'Numéro licence', field: 'licenceNumber'},
                    {title: 'Nom', field: 'name'},
                    {title: 'Prénom', field: 'firstName'},
                    {title: 'Genre', field: 'gender'},
                    {title: 'Dept', field: 'dept'},
                    {title: 'Age', field: 'birthYear'},
                    {title: 'Caté Age', field: 'catea'},
                    {title: 'Caté Valeur', field: 'catev'},
                ]}
                data={fetchLicences}
                options={{
                    filtering: true,
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: [5, 10, 20],
                    search: false
                }}
                editable={{
                    onRowDelete: oldData =>
                        new Promise((resolve, reject) => {
                            apiLicences._delete(`${oldData.id}`).then(()=>resolve());
                        }),
                }}
                actions={[
                    {
                        icon: 'add',
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
        )
            ;
};

export default LicencesPage;
