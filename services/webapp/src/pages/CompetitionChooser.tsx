import * as React from 'react';
import MaterialTable, {Query} from 'material-table';
import {apiCompetitions} from '../util/api';
import {Competition} from '../sdk';
import {Theme, withStyles} from '@material-ui/core';

const fetchCompetitions = async (query: Query<Competition>)  => {
   const competitions = await apiCompetitions.getAllCompetitions();
    return {data: competitions, page: query.page, totalCount: competitions.length};
};
interface ICompetitionChooserProps {
    classes?: any;
}
const CompetitionChooser = (props: ICompetitionChooserProps) => {

    return (
        <MaterialTable
            style={props.classes.root}
            title={'Liste des épreuves'}
            columns={[
                {title: 'Date de l\'épreuve', field: 'eventDate'},
                {title: 'Nom de l\'épreuve', field: 'name'},
                {title: 'Lieu/Dept', field: 'zipCode'},
                {title: 'Catégories', field: 'categories'},
                {title: 'Fédération', field: 'fede'},
                {title: 'Organisé par', field: 'clubId'},
            ]}
            data={fetchCompetitions}
            options={{
                selection: true,
                rowStyle: rowData => ({ backgroundColor: rowData.tableData.checked ? '#37b15933' : '' })
            }}
        />
    )
        ;
};

const styles = (theme: Theme) => ({
    root: {
        backgroundColor: 'black',
    }
})

export default withStyles(styles as any)(CompetitionChooser as any) as any;
