import * as React from 'react';
import MaterialTable from 'material-table';
import {AppText as T} from '../../utils/text';
import {Theme, withStyles} from '@material-ui/core';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
}



class LicencesPage extends React.Component<ILicencesProps, {}> {

    public render(): JSX.Element {
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
                data={null}
                options={{
                    filtering: true,
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: [5, 10, 20],
                }}
                editable={{
                    onRowUpdate: (newData, oldData) =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve();
                            }, 1000);
                        }),
                    onRowDelete: oldData =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve();
                            }, 1000);
                        }),
                }}
                actions={[
                    {
                        icon: 'add',
                        tooltip: T.LICENCES.ADD_NEW_LICENCE,
                        isFreeAction: true,
                        onClick: (event) => {
                            this.props.history.push('/new_licence');
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
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(LicencesPage as any) as any;
