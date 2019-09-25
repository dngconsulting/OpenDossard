import * as React from 'react';
import AssignmentIcon from '@material-ui/icons/Assignment';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import PeopleIcon from '@material-ui/icons/People';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import DashboardIcon from '@material-ui/icons/Dashboard';
import {
    Divider,
    Drawer,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    Theme,
    withStyles
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {User} from '../state/User';
import {Utility} from '../state/Utility';
import {NavLink} from 'react-router-dom';
import {styles} from './styles';
import {AccountPage} from '../pages/account/Account';
import CoureursPage from '../pages/coureur/Coureurs';
import ResultatsPage from '../pages/Resultats';
import StatsPage from '../pages/Stats'

const classNames = require('classnames');

interface IAppDrawer {
    authentication?: User;
    utility: Utility;
    classes?: any;
    theme?: Theme;
    handleDrawerClose?: () => void;
}

class AppDrawer extends React.Component<IAppDrawer, {}> {
    public routes = [
        { path: '/',  title: 'Tableau de bord', icon: () => <DashboardIcon /> },
        { path: '/engagements', component : CoureursPage, title: 'Engagements', icon: () => <AssignmentIcon /> },
        { path: '/riders', component : CoureursPage, title: 'Coureurs', icon: () => <PeopleIcon /> },
        { path: '/results', component : ResultatsPage, title: 'Résultats', icon: () => <FormatListNumberedIcon /> },
        { path: '/stats', component : StatsPage, title: 'Statistiques', icon: () => <ShowChartIcon /> },
        { path: '/account', component : AccountPage, title: 'Profile', icon: () => <AccountCircleIcon /> }
    ];

    public render(): JSX.Element {
        const { authentication, classes, utility, theme } = this.props;
        return (
            <Drawer
                hidden={!authentication}
                variant="permanent"
                classes={{
                    paper: classNames(classes.drawerPaper, !utility.drawerOpen && classes.drawerPaperClose),
                }}
                open={utility.drawerOpen}
            >
                <div className={classes.toolbar}>
                    <IconButton onClick={this.props.handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </div>
                <Divider />
                {this.routes.map((route, index) => {
                    return (
                        <NavLink key={index} exact={true} activeClassName={classes.current} className={classes.link} to={route.path} >
                            <ListItem button={true}>
                                <ListItemIcon>
                                    {route.icon()}
                                </ListItemIcon>
                                <ListItemText primary={route.title} />
                            </ListItem>
                        </NavLink>
                    );
                })}
                <Divider />
            </Drawer>
        );
    }
}

export default withStyles(styles as any, { withTheme: true })(AppDrawer as any) as any;
