//#region
import * as React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import {CircularProgress, Menu, MenuItem} from '@material-ui/core';
import {withRouter} from 'react-router-dom';
import Hidden from '@material-ui/core/Hidden';
import {styles} from './styles';
import * as AppActionCreators from '../actions/App.Actions';
import {IApplicationProps} from '../actions/App.Actions';
import {ReduxState} from '../state/ReduxState';
import {connect} from 'react-redux';
import * as _ from 'lodash';
import {bindActionCreators, Dispatch} from 'redux';
import {AlertDialog} from '../alert/Alert';
import SpinnerDialog from '../spinner/Spinner';
import {AccountPage} from '../pages/account/Account';
import AppDrawer from './App.Drawer';
import AppRoutes from './AppRoutes';
import {CadSnackBar} from '../components/CadSnackbar';
import logo from '../assets/logos/logoblanc.svg';
import AccountCircleIcon from "@material-ui/icons/AccountCircle";

const classNames = require('classnames');

//#endregion

interface IAppProps extends IApplicationProps {
    classes: any;
    theme?: any;
    title: any;
    showLoading:boolean;
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
                        <img src={logo} width={84} height={44} alt='logo'/>
                        <Typography className={classes.fillSpace} color="inherit" noWrap={true}>
                            {this.props.history.location.state && this.props.history.location.state.title ? this.props.history.location.state.title : 'ossard '}
                        </Typography>
                        <div>
                            <IconButton
                                aria-owns={open ? 'menu-appbar' : null}
                                aria-haspopup="true"
                                onClick={this.handleMenu}
                                color="inherit"
                            >
                                <AccountCircleIcon htmlColor={'white'}/>
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
                                <MenuItem onClick={this.handleLogout}>Déconnecter</MenuItem>
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

    private renderLoader() {
        if (this.props.showLoading) {
            return (
                <div style={{position:'fixed',display:'block',width:'100%',height:'100%',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',zIndex:10000,cursor:'pointer'}}>
                    <div style={{position:'absolute',top:'40%',left:'40%'}}>
                        <CircularProgress color="primary" />
                    </div>
                </div>
            );
        }
       return null;
    }
    public render() {
        const {classes} = this.props;
        return (
            <div className={classes.root}>
                {this.renderAppBar()}
                {this.renderDrawer()}

                <main className={classes.content}>
                    <div className={classes.toolbar}/>
                    <CadSnackBar>
                        <AppRoutes renderAccount={this.renderAccount}/>
                        {this.renderAlert()}
                        {this.renderSpinner()}
                        {this.renderLoader()}
                    </CadSnackBar>
                </main>
            </div>
        );
    }
}

const mapStateToProps = (state: ReduxState) => ({
    utility: state.utility,
    authentication: state.authentication,
    showLoading:state.app.showLoading,
});

const mapDispatchtoProps = (dispatch: Dispatch) =>
    bindActionCreators(_.assign({}, AppActionCreators), dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchtoProps)(withStyles(styles as any, {withTheme: true})(MiniDrawer as any)) as any);
