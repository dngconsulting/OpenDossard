import * as React from 'react';
import AssignmentIcon from '@material-ui/icons/Assignment';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import PeopleIcon from '@material-ui/icons/People';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import {
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Theme, Tooltip,
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
import StatsPage from '../pages/Stats';

const classNames = require('classnames');

interface IAppDrawer {
    authentication?: User;
    utility: Utility;
    classes?: any;
    theme?: Theme;
    handleDrawer?: (open: boolean) => void;
}

class AppDrawer extends React.Component<IAppDrawer, {}> {
    public routes = [
        {path: '/', title: 'Tableau de bord', icon: () => <DashboardIcon/>},
        {
            path: '/engagements',
            component: CoureursPage,
            title: 'Engagements',
            icon: () => <AssignmentIcon/>
        },
        {path: '/licences', component: CoureursPage, title: 'Coureurs', icon: () => <PeopleIcon/>},
        {
            path: '/results',
            component: ResultatsPage,
            title: 'Résultats',
            icon: () => <FormatListNumberedIcon/>
        },
        {path: '/stats', component: StatsPage, title: 'Statistiques', icon: () => <ShowChartIcon/>},
        {
            path: '/account',
            component: AccountPage,
            title: 'Profile',
            icon: () => <AccountCircleIcon/>
        }
    ];

    public render(): JSX.Element {
        const {authentication, classes, utility, theme} = this.props;
        return (
            <Drawer
                hidden={!authentication}
                variant="permanent"
                classes={{
                    paper: classNames(classes.drawerPaper, !utility.drawerOpen && classes.drawerPaperClose),
                }}
                open={utility.drawerOpen}
            >
                {utility.drawerOpen && <Box display="flex" p={1} bgcolor="background.paper">
                  <Box p={1} flexGrow={1} bgcolor="grey.300">
                    <List>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <AccountCircleIcon/>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={authentication.email} secondary={authentication.name}/>
                      </ListItem>
                    </List>
                  </Box>
                  <Box p={1} bgcolor="grey.300">
                    <IconButton onClick={() => this.props.handleDrawer(true)}>
                        {!utility.drawerOpen ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>
                  </Box>
                </Box>
                }
                {!utility.drawerOpen && <div className={classes.toolbar}>
                  <IconButton onClick={() => this.props.handleDrawer(utility.drawerOpen)}>
                      {theme.direction === 'rtl' ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                  </IconButton>
                </div>}
                <Divider/>
                {this.routes.map((route, index) => {
                    return (
                        <NavLink key={index} exact={true} activeClassName={classes.current}
                                 className={classes.link} to={route.path}>
                            <Tooltip title={route.title}>
                                <ListItem button={true}>
                                    <ListItemIcon>
                                        {route.icon()}
                                    </ListItemIcon>
                                    <ListItemText primary={route.title}/>
                                </ListItem>
                            </Tooltip>
                        </NavLink>
                    );
                })}
                <Divider/>
            </Drawer>
        );
    }
}

export default withStyles(styles as any, {withTheme: true})(AppDrawer as any) as any;
