import * as React from 'react';

import {Theme, Typography, withStyles} from '@material-ui/core';

interface ICoureursProps {
    items: any[];
    classes: any;
}

class CoureursPage extends React.Component<ICoureursProps, {}> {

    public render(): JSX.Element {
        return (
            <Typography noWrap={false}>Coureur</Typography>
        );
    }
}

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(CoureursPage as any) as any;
