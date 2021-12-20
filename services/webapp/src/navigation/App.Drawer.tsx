import * as React from "react";
import AssignmentIcon from "@material-ui/icons/Assignment";
import PeopleIcon from "@material-ui/icons/People";
import ShowChartIcon from "@material-ui/icons/ShowChart";
import DashboardIcon from "@material-ui/icons/Dashboard";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
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
  Theme,
  Tooltip,
  Typography,
  withStyles
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { Utility } from "../state/Utility";
import { NavLink } from "react-router-dom";
import { styles } from "./styles";
import PalmaresPage from "../pages/Palmares";
import { UserEntity as User } from "../sdk";
import { grey } from "@material-ui/core/colors";
import { cadtheme } from "../theme/theme";
import { version } from "../../package.json";

const classNames = require("classnames");

interface IAppDrawer {
  authentication?: User;
  utility: Utility;
  classes?: any;
  theme?: Theme;
  handleDrawer?: (open: boolean) => void;
}

class AppDrawer extends React.Component<IAppDrawer, {}> {
  private getRoutes = (props: IAppDrawer) => [
    {
      key: "1",
      path: "/",
      state: { title: "Tableau de bord de l'ensemble des courses" },
      title: "Tableau de bord de l'ensemble des course",
      icon: () => <DashboardIcon />
    },
    {
      key: "2",
      path: "/licences",
      state: { title: "Gestion des licences" },
      title: "Licences",
      icon: () => <PeopleIcon />
    },
    {
      key: "3",
      path: "/competitions",
      state: { title: "Liste des épreuves" },
      title: "Épreuves",
      icon: () => <AssignmentIcon />
    },
    ...(props &&
    props.authentication &&
    props.authentication.roles &&
    props.authentication.roles.includes("ADMIN")
      ? [
          {
            key: "999",
            path: "/competitions/engagementresultats",
            state: { title: "Gestion des Engagements" },
            title: "Saisie Rapide résultats",
            icon: () => <AssignmentIcon color={"error"} />
          }
        ]
      : []),
    {
      key: "5",
      path: "/palmares",
      component: PalmaresPage,
      state: { title: "Palmarès coureurs" },
      title: "Palmarès",
      icon: () => <ShowChartIcon />
    },
    {
      key: "6",
      path: "/account",
      state: { title: "Profile" },
      title: "Mon compte",
      icon: () => <AccountCircleIcon />
    }
  ];

  public render(): JSX.Element {
    const { authentication, classes, utility, theme } = this.props;
    return (
      <Drawer
        hidden={!authentication}
        variant="permanent"
        classes={{
          paper: classNames(
            classes.drawerPaper,
            !utility.drawerOpen && classes.drawerPaperClose
          )
        }}
        open={utility.drawerOpen}
      >
        {utility.drawerOpen && (
          <Box display="flex" bgcolor="background.paper" boxShadow={3}>
            <Box flexGrow={1} bgcolor={cadtheme.palette.secondary.dark}>
              <List style={{ padding: "0px" }}>
                <ListItem
                  style={{ color: "white", padding: "4px 0px 0px 5px" }}
                >
                  <ListItemAvatar style={{ padding: 0 }}>
                    <Avatar style={{ backgroundColor: grey[500] }}>
                      <AccountCircleIcon htmlColor={"white"} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    color={"#FFFFFF"}
                    primary={
                      <Typography
                        style={{
                          fontSize: 20,
                          color: "#FFFFFF"
                        }}
                      >
                        {authentication && authentication.lastName
                          ? authentication.lastName
                          : ""}{" "}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        style={{
                          fontSize: 13,
                          color: "#FFFFFF"
                        }}
                      >
                        {authentication && authentication.email}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>
            <Box bgcolor={cadtheme.palette.secondary.dark}>
              <IconButton onClick={() => this.props.handleDrawer(true)}>
                {!utility.drawerOpen ? (
                  <ChevronRightIcon htmlColor={"#FFFFFF"} />
                ) : (
                  <ChevronLeftIcon htmlColor={"#FFFFFF"} />
                )}
              </IconButton>
            </Box>
          </Box>
        )}
        {!utility.drawerOpen && (
          <div className={classes.toolbar}>
            <IconButton
              onClick={() => this.props.handleDrawer(utility.drawerOpen)}
            >
              {theme.direction === "rtl" ? (
                <ChevronRightIcon htmlColor={"#FFFFFF"} />
              ) : (
                <ChevronLeftIcon htmlColor={"#FFFFFF"} />
              )}
            </IconButton>
          </div>
        )}
        <Divider />
        {this.getRoutes(this.props).map((route, index) => {
          return (
            <NavLink
              key={index}
              exact={true}
              activeClassName={classes.current}
              className={classes.link}
              to={{
                pathname: route.path,
                state: route.state
              }}
            >
              <Tooltip title={route.title}>
                <ListItem button={true}>
                  <ListItemIcon>{route.icon()}</ListItemIcon>
                  <ListItemText primary={route.title} />
                </ListItem>
              </Tooltip>
            </NavLink>
          );
        })}
        <Divider />
        <div
          style={{
            marginTop: 10,
            fontSize: "12px",
            width: "100%",
            textAlign: "center"
          }}
        >
          V{version}
        </div>
      </Drawer>
    );
  }
}

export default withStyles(styles as any, { withTheme: true })(
  AppDrawer as any
) as any;
