import * as React from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable from 'material-table';
import { AppText as T } from '../utils/text';

interface ICoureursProps {
    items: any[];
    classes: any;
}
const data = () => {
    const mytable = [];
    for (let i = 0; i < 1000; i++) {
        mytable.push({licenceNumber : i, nom : "Nom"+i , prenom : "Prénom"+i, sexe : 'M', dept : '31', age : i%100, catea : 'SENIOR', catev : '4'})
    }
    return mytable
};
class CoureursPage extends React.Component<ICoureursProps, {}> {

    public render(): JSX.Element {
        return (
            <MaterialTable
                title="Annuaire des coureurs"
                columns={[
                    { title: "Numéro licence", field: "licenceNumber" },
                    { title: "Nom", field: "nom" },
                    { title: "Prénom", field: "prenom" },
                    { title: "Sexe", field: "sexe" },
                    { title: "Dept", field: "dept" },
                    { title: "Age", field: "age" },
                    { title: "CatéA", field: "catea" },
                    { title: "CatéV", field: "catev" },
                ]}
                data={data()}
                options={{
                    filtering: true,
                    actionsColumnIndex: -1,
                    pageSize: 10,
                    pageSizeOptions: [5, 10, 20]
                }}
                editable={{
                    onRowUpdate: (newData, oldData) =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve()
                            }, 1000)
                        }),
                    onRowDelete: oldData =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve()
                            }, 1000)
                        }),
                }}
                localization={{
                    body: {
                        editRow: {
                            saveTooltip: T.COUREURS.EDITROW.SAVETOOLTIP,
                            cancelTooltip: T.COUREURS.EDITROW.CANCELTOOLTIP,
                            deleteText: T.COUREURS.EDITROW.DELETETEXT
                        },
                        deleteTooltip: T.COUREURS.DELETETOOLTIP,
                        editTooltip: T.COUREURS.EDITTOOLTIP
                    },
                    pagination: {
                        labelRowsSelect: T.COUREURS.PAGINATION.LABELROWSSELECT
                    }
                }}
            />
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(CoureursPage as any) as any;
