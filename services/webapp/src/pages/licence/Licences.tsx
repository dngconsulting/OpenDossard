import * as React from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable from 'material-table';
import {AppText as T} from '../../utils/text';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
}

const data = () => {
    const mytable = [];
    for (let i = 0; i < 1000; i++) {
        mytable.push({
            licenceNumber: i,
            nom: 'Nom' + i,
            prenom: 'Prénom' + i,
            genre: 'M',
            dept: '31',
            age: i % 100,
            catea: 'SENIOR',
            catev: '4'
        });
    }
    return mytable;
};

class LicencesPage extends React.Component<ILicencesProps, {}> {

    public render(): JSX.Element {
        return (
            <MaterialTable
                title={T.LICENCES.TITLE}
                columns={[
                    {title: 'Numéro licence', field: 'licenceNumber'},
                    {title: 'Nom', field: 'nom'},
                    {title: 'Prénom', field: 'prenom'},
                    {title: 'Genre', field: 'genre'},
                    {title: 'Dept', field: 'dept'},
                    {title: 'Age', field: 'age'},
                    {title: 'Caté Age', field: 'catea'},
                    {title: 'Caté Valeur', field: 'catev'},
                ]}
                data={data()}
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
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(LicencesPage as any) as any;
