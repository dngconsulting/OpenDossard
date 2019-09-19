import * as React from 'react';

import {Theme, Typography, withStyles} from '@material-ui/core';

interface IResultatsPageProps {
    items: any[];
    classes: any;
}

class ResultatsPage extends React.Component<IResultatsPageProps, {}> {

    public render(): JSX.Element {
        return (
            <Typography noWrap={false}>Resultats</Typography>
        );
    }
}

const styles = (theme: Theme) => ({

});

export default withStyles(styles as any)(ResultatsPage as any) as any;
