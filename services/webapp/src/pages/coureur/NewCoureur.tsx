import * as React from 'react';

import {Theme, withStyles} from '@material-ui/core';



class NewCoureursPage extends React.Component {

    public render(): JSX.Element {
        return (
            <span>Ajouter un nouveau coureur</span>
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(NewCoureursPage as any) as any;
