//#region
import * as React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import {Badge, Menu, MenuItem} from '@material-ui/core';
import {Route, withRouter} from 'react-router-dom';
import Hidden from '@material-ui/core/Hidden';
import {styles} from './styles';
import * as AppActionCreators from '../actions/App.Actions';
import {IApplicationProps} from '../actions/App.Actions';
import {isAuthenticated, ReduxState} from '../state/ReduxState';
import {connect} from 'react-redux';
import * as _ from 'lodash';
import {bindActionCreators, Dispatch} from 'redux';
import {Alert} from '../state/Alert';
import {AlertDialog} from '../alert/Alert';
import SpinnerDialog from '../spinner/Spinner';
import {AccountPage} from '../pages/account/Account';
import HomePage from '../pages/Home';
import AccountCircle from '@material-ui/icons/Mail';
import AppDrawer from './App.Drawer';
import NotificationIcon from '@material-ui/icons/Notifications';
import LicencesPage from '../pages/licence/Licences';
import NewLicencePage from '../pages/licence/NewLicence';
import StatsPage from '../pages/Stats';
import ResultatsPage from '../pages/Resultats';
import CompetitionChooser from '../pages/CompetitionChooser';
import EngagementPage from '../pages/Engagement';

const classNames = require('classnames');

//#endregion

interface IAppProps extends IApplicationProps {
    classes: any;
    theme?: any;
}

interface IState {
    anchorEl: any;
    notificationEl: any;
}

class MiniDrawer extends React.Component<IAppProps, IState> {

    public state: IState = {
        anchorEl: null,
        notificationEl: null
    };

    public componentWillMount() {

    }

    private handleNotificationMenu = (event: any) => {
        this.setState({notificationEl: event.currentTarget});
    };

    private handleMenu = (event: any) => {
        this.setState({anchorEl: event.currentTarget});
    };

    private handleMenuClose = (path?: string) => {
        this.setState({anchorEl: null});
        this.navigate(path);
    };

    public handleLogout = () => {
        this.props.logout();
        this.handleMenuClose();
    };

    private navigate = (path?: string) => {
        if (path) {
            this.props.history.push(path);
        }
    };

    public handleDrawer = (open: boolean) => {
        if (!open) {
            this.props.openDrawer();
        } else {
            this.props.closeDrawer();
        }
    };

    public showPopup = () => {
        this.props.showPopup(new Alert({
            title: 'Testing title',
            message: 'This is a very long message, expect alert to be very wide'
        }));
    };

    public showSpinner = () => {
        this.props.showSpinner('I am loading here please...');
    };

    private renderAlert(): JSX.Element {
        if (this.props.utility.alert) {
            return (
                <AlertDialog
                    handleClose={this.props.closePopup}
                    data={this.props.utility.alert}
                />
            );
        }

        return null;
    }

    private renderSpinner(): JSX.Element {
        if (this.props.utility.spinner) {
            return (
                <SpinnerDialog
                    message={this.props.utility.spinner.message}
                />
            );
        }

        return null;
    }


    private renderAppBar() {
        if (this.props.authentication) {
            const {classes, utility} = this.props;
            const {anchorEl} = this.state;
            const open = Boolean(anchorEl);

            return (
                <AppBar
                    position="fixed"
                    className={classNames(classes.appBar, utility.drawerOpen && classes.appBarShift)}
                >
                    <Toolbar disableGutters={!utility.drawerOpen}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={() => this.handleDrawer(utility.drawerOpen)}
                            className={classNames(classes.menuButton, utility.drawerOpen && classes.hide)}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography className={classes.fillSpace} color="inherit" noWrap={true}>
                            Click & Dossard
                        </Typography>
                        <div>
                            <IconButton
                                aria-haspopup="true"
                                color="inherit"
                                onClick={this.handleNotificationMenu}
                            >
                                <Badge badgeContent={2} color="secondary">
                                    <NotificationIcon/>
                                </Badge>
                            </IconButton>

                            <IconButton
                                aria-owns={open ? 'menu-appbar' : null}
                                aria-haspopup="true"
                                onClick={this.handleMenu}
                                color="inherit"
                            >
                                <AccountCircle/>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={open}
                                onClose={this.handleMenuClose.bind(this, null)}
                            >
                                <MenuItem
                                    onClick={this.handleMenuClose.bind(this, '/account')}>{this.props.authentication.email}</MenuItem>
                                <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBar>
            );
        }

        return null;
    }

    private renderAccount = () => {
        return (
            <AccountPage user={this.props.authentication} login={this.props.login}
                         match={this.props.match} location={this.props.location}/>
        );
    };

    private renderDrawer() {
        const {utility, authentication} = this.props;
        return (
            <Hidden mdDown={!utility.drawerOpen && true}>
                <AppDrawer
                    utility={utility}
                    authentication={authentication}
                    handleDrawer={() => this.handleDrawer(utility.drawerOpen)}
                />
            </Hidden>
        );
    }

    public render() {
        const {classes} = this.props;
        const Dashboard = isAuthenticated((props: any): any => {
            return (
                <HomePage/>
            );
        });

        return (
            <div className={classes.root}>
                {this.renderAppBar()}
                {this.renderDrawer()}

                <main className={classes.content}>
                    <div className={classes.toolbar}/>
                    <Route path='/' exact={true} component={Dashboard}/>
                    <Route path='/competitionchooser' component={isAuthenticated(CompetitionChooser)}/>
                    <Route path='/licences' component={isAuthenticated(LicencesPage)}/>
                    <Route path='/new_licence' component={isAuthenticated(NewLicencePage)}/>
                    <Route path='/results' component={isAuthenticated(ResultatsPage)}/>
                    <Route path='/stats' component={isAuthenticated(StatsPage)}/>
                    <Route path='/account' render={this.renderAccount}/>
                    <Route path='/competition/:id/engagements' component={isAuthenticated(EngagementPage)}/>
                    {this.renderAlert()}
                    {this.renderSpinner()}
                </main>
            </div>
        );
    }
}

const mapStateToProps = (state: ReduxState) => ({
    utility: state.utility,
    authentication: state.authentication,

});

const mapDispatchtoProps = (dispatch: Dispatch) =>
    bindActionCreators(_.assign({}, AppActionCreators), dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchtoProps)(withStyles(styles as any, {withTheme: true})(MiniDrawer as any)) as any);
