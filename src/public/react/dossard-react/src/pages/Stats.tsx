import * as React from 'react';

import {Theme, Typography, withStyles} from '@material-ui/core';

interface IStatsPageProps {
    items: any[];
    classes: any;
}

class StatsPage extends React.Component<IStatsPageProps, {}> {

    public render(): JSX.Element {
        return (
            <Typography noWrap={false}>Statistique</Typography>
        );
    }
}
const styles = (theme: Theme) => ({

});
export default withStyles(styles as any)(StatsPage as any) as any;

