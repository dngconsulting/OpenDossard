import * as React from 'react';
import {Grid, Theme, withStyles} from '@material-ui/core';
import {Text} from 'recharts';

interface IDashboardProps {
    fetchUsers: (context?: any) => void;
    users: any;
    materialChartData: any[];
    classes?: any;
    theme?: any;
    children?: any;
}

interface IPageState {
    usersTablePage?: number;
    usersTableRowsPerPage: number;
}

class HomePage extends React.Component<IDashboardProps, IPageState> {

    public state: IPageState = {
        usersTablePage: 0,
        usersTableRowsPerPage: 5
    };

    public render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Grid container={true}>
                    <Text>Home page content</Text>
                </Grid>
            </div>
        );
    }
}

const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        marginBottom: 24,
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    headerTiles: {
        overflowX: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRight: `5px solid ${theme.palette.secondary.main}`,
    },
    headerTileIcon: {
        fontSize: 40,
        color: theme.palette.primary.main,
        paddingRight: 5
    },
    tileText: {
        fontSize: 20,
        color: theme.palette.grey["400"],
    },
    sectionTitle: {
        paddingLeft: theme.spacing(2),
    },
    users: {
        marginBottom: 24,
        overflowX: 'scroll'
    },
    chart: {
        width: '100%'
    },
});

export default withStyles(styles as any)(HomePage as any) as any;
