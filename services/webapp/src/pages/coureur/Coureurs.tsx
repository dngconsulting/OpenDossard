import * as React from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable from 'material-table';
import {AppText as T} from '../../utils/text';

interface ICoureursProps {
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

class CoureursPage extends React.Component<ICoureursProps, {}> {

    public render(): JSX.Element {
        return (
            <MaterialTable
                title= {T.RIDERS.TITLE}
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
                        tooltip: T.RIDERS.ADD_NEW_RIDER,
                        isFreeAction: true,
                        onClick: (event) => {this.props.history.push('/new_rider')}
                    }
                ]}
                localization={{
                    body: {
                        editRow: {
                            saveTooltip: T.RIDERS.EDIT_ROW.SAVE_TOOL_TIP,
                            cancelTooltip: T.RIDERS.EDIT_ROW.CANCEL_TOOL_TIP,
                            deleteText: T.RIDERS.EDIT_ROW.DELETE_TEXT
                        },
                        deleteTooltip: T.RIDERS.DELETE_TOOL_TIP,
                        editTooltip: T.RIDERS.EDIT_TOOL_TIP,
                        emptyDataSourceMessage:  T.RIDERS.EMPTY_DATA_SOURCE_MESSAGE,
                        filterRow:{
                            filterTooltip: T.RIDERS.FILTER_TOOL_TIP
                        },
                    },
                    pagination: {
                        labelRowsSelect: T.RIDERS.PAGINATION.LABEL_ROWS_SELECT,
                        firstTooltip: T.RIDERS.PAGINATION.FIRST_TOOL_TIP,
                        previousTooltip: T.RIDERS.PAGINATION.PREVIOUS_TOOL_TIP,
                        nextTooltip: T.RIDERS.PAGINATION.NEXT_TOOL_TIP,
                        lastTooltip: T.RIDERS.PAGINATION.LAST_TOOL_TIP,
                        labelDisplayedRows: T.RIDERS.PAGINATION.LABEL_DISPLAYED_ROWS
                    },
                    toolbar: {
                        searchTooltip: T.RIDERS.TOOLBAR.SEARCH_TOOL_TIP,
                        searchPlaceholder: T.RIDERS.TOOLBAR.SEARCH_PLACE_HOLDER
                    }
                }}
            />
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(CoureursPage as any) as any;
