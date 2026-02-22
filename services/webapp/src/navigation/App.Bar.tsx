//#region
import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { Menu, MenuItem } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import Hidden from '@material-ui/core/Hidden';
import { styles } from './styles';
import * as AppActionCreators from '../actions/App.Actions';
import { IApplicationProps } from '../actions/App.Actions';
import { ReduxState } from '../state/ReduxState';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { bindActionCreators, Dispatch } from 'redux';
import { AlertDialog } from '../alert/Alert';
import SpinnerDialog from '../spinner/Spinner';
import { AccountPage } from '../pages/account/Account';
import AppDrawer from './App.Drawer';
import AppRoutes from './AppRoutes';
import { CadSnackBar } from '../components/CadSnackbar';
import Logo from '../assets/logos/logood.png';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { LoaderIndicator } from '../components/LoaderIndicator';

const classNames = require('classnames');

export const V2_BANNER_HEIGHT = 36;

export function getV2Url(): string | null {
  const hostname = window.location.hostname;
  const mapping: Record<string, string> = {
    'app.opendossard.com': 'https://app-v2.opendossard.com',
    'preprod.opendossard.com': 'https://preprod-v2.opendossard.com',
    'test.opendossard.com': 'https://test-v2.opendossard.com',
  };
  return mapping[hostname] || null;
}

//#endregion

interface IAppProps extends IApplicationProps {
  classes: any;
  theme?: any;
  title: any;
  showLoading: boolean;
  isMobile: boolean;
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
    this.setState({ anchorEl: event.currentTarget });
  };

  private handleMenuClose = (path?: string) => {
    this.setState({ anchorEl: null });
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
      return <AlertDialog handleClose={this.props.closePopup} data={this.props.utility.alert} />;
    }

    return null;
  }

  private renderSpinner(): JSX.Element {
    if (this.props.utility.spinner) {
      return <SpinnerDialog message={this.props.utility.spinner.message} />;
    }

    return null;
  }

  private renderAppBar() {
    if (this.props.authentication) {
      const { classes, utility } = this.props;
      const { anchorEl } = this.state;
      const open = Boolean(anchorEl);

      const v2Url = getV2Url();

      return (
        <AppBar position="fixed" className={classNames(classes.appBar, utility.drawerOpen && classes.appBarShift)}>
          {v2Url && (
            <div style={{
              height: V2_BANNER_HEIGHT,
              backgroundColor: '#f57c00',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              gap: 8,
            }}>
              <span>La nouvelle version d'Open Dossard est disponible !</span>
              <a href={v2Url} style={{
                color: 'white',
                fontWeight: 'bold',
                textDecoration: 'underline',
              }}>
                Découvrir la V2
              </a>
            </div>
          )}
          <Toolbar disableGutters={!utility.drawerOpen}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => this.handleDrawer(utility.drawerOpen)}
              className={classNames(classes.menuButton, utility.drawerOpen && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
            <img src={Logo} alt={'Logo'} width={84} height={44} />
            <Typography className={classes.fillSpace} color="inherit" noWrap={true}>
              {this.props.history.location.state && this.props.history.location.state.title
                ? this.props.history.location.state.title
                : ' Bienvenue dans Open Dossard v' + `${process.env.REACT_APP_VERSION}`}
            </Typography>
            <div>
              <IconButton
                aria-owns={open ? 'menu-appbar' : null}
                aria-haspopup="true"
                onClick={this.handleMenu}
                color="inherit"
              >
                <AccountCircleIcon htmlColor={'white'} />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                open={open}
                onClose={this.handleMenuClose.bind(this, null)}
              >
                <MenuItem onClick={this.handleMenuClose.bind(this, '/account')}>
                  {this.props.authentication.email}
                </MenuItem>
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
      <AccountPage
        user={this.props.authentication}
        login={this.props.login}
        match={this.props.match}
        location={this.props.location}
      />
    );
  };

  private renderDrawer() {
    const { utility, authentication, isMobile } = this.props;
    return (
      <Hidden mdDown={!utility.drawerOpen && true}>
        <AppDrawer
          utility={utility}
          isMobile={isMobile}
          authentication={authentication}
          handleDrawer={() => this.handleDrawer(utility.drawerOpen)}
        />
      </Hidden>
    );
  }

  private renderLoader() {
    if (this.props.showLoading) {
      return <LoaderIndicator />;
    }
    return null;
  }
  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        {this.renderAppBar()}
        {this.renderDrawer()}

        <main className={classes.content}>
          <div className={classes.toolbar} style={getV2Url() && this.props.authentication ? { marginTop: V2_BANNER_HEIGHT } : undefined} />
          <CadSnackBar>
            <AppRoutes renderAccount={this.renderAccount} />
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
  showLoading: state.app.showLoading
});

const mapDispatchtoProps = (dispatch: Dispatch) => bindActionCreators(_.assign({}, AppActionCreators), dispatch);

export default withRouter(
  connect(mapStateToProps, mapDispatchtoProps)(withStyles(styles as any, { withTheme: true })(MiniDrawer as any)) as any
);
