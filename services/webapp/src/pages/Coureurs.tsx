import * as React from 'react';

import {Theme, withStyles} from '@material-ui/core';
import MaterialTable from 'material-table';

interface ICoureursProps {
    items: any[];
    classes: any;
}
/*const data = async () => {
   const licences : Licence[] = await apiLicences.licencesCtrlGetAllLicences()
   console.log("Premiere licence = " + JSON.stringify(licences[0]));
   return licences ;
}*/

const data = () : any => {
    return []
}
class CoureursPage extends React.Component<ICoureursProps, {}> {

    public render(): JSX.Element {
        return (
            <MaterialTable
                title="Annuaire des coureurs"
                columns={[
                    { title: "Numéro", field: "id" },
                    { title: "Numéro licence", field: "licenceNumber" },
                    { title: "Nom", field: "nom" },
                    { title: "Prénom", field: "prenom" },
                    { title: "Sexe", field: "genre" },
                    { title: "Dept", field: "club" },
                    { title: "Age", field: "age" },
                    { title: "CatéA", field: "catea" },
                    { title: "CatéV", field: "catev" },
                    { title: "CatéV", field: "fede" }
                ]}
                data={data()}
                options={{
                    filtering: true
                }}
            />
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(CoureursPage as any) as any;
