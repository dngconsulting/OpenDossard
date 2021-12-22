import * as React from "react";
import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormHelperText,
  Icon,
  Input,
  InputAdornment,
  InputLabel
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import * as querystring from "querystring";
import { Redirect } from "react-router";
import { loadSDK, passportCtrl } from "../../util/api";
import { UserEntity as User } from "../../sdk";
import LogoHorizontal from "../../assets/logos/logood.png";
import { cadtheme } from "../../theme/theme";
import { makeStyles } from "@material-ui/core/styles";

interface ILoginProps {
  login?: (data: any) => void;
  match?: any;
  location?: any;
  classes?: any;
  user: User;
}

interface ILoginState {
  email: string;
  password: string;
  error: boolean;
}

const LoginPage = (props: ILoginProps) => {
  const [isAuthenticating, setAuthenticating] = useState<boolean>(true);
  const [state, setState] = useState<{
    email?: string;
    password?: string;
    error?: boolean;
  }>({
    email: "",
    password: "",
    error: false
  });
  useEffect(() => {
    const fetchToken = async () => {
      const token = localStorage.getItem("token") || "";
      if (token !== null && token !== "") {
        try {
          loadSDK(token);
          const me = await passportCtrl.me();
          setState({ email: me.email });
          props.login(me);
        } catch (e) {
          localStorage.removeItem("token");
        }
      }
      setAuthenticating(false);
    };
    fetchToken();
  }, []);
  const handleEmailAddressChange = (event: any) => {
    if (event.target.value !== state.email) {
      setState({ ...state, email: event.target.value, error: false });
    }
  };

  const handlePasswordChange = (event: any) => {
    if (event.target.password !== state.password) {
      setState({ ...state, password: event.target.value, error: false });
    }
  };

  const handleLogin = async () => {
    try {
      const user: User = await passportCtrl.login({
        userEntity: {
          id: -1,
          email: state.email,
          password: state.password
        }
      });
      loadSDK(user.accessToken);
      localStorage.setItem("token", user.accessToken);
      props.login(user);
    } catch (err) {
      setState({ ...state, error: true });
    }
  };

  const classes = useStyles();

  if (props.user) {
    const path: string =
      (querystring.parse((props.location.search as string).substr(1))
        .redirect as any) || "/engagements";
    return <Redirect to={path} />;
  }
  if (!isAuthenticating) {
    return (
      <div className={classes.container}>
        <Paper
          style={{
            maxWidth: "400px",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            boxShadow: "6px 5px 25px -3px rgba(0,0,0,0.57)",
            borderRadius: 10
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: cadtheme.palette.primary.main,
              alignItems: "center",
              padding: "10px",
              justifyContent: "center"
            }}
          >
            <img src={LogoHorizontal} alt={"Logo"} width="171" height="92" />
          </div>
          <FormControl
            required={true}
            fullWidth={true}
            className={classes.field}
          >
            <InputLabel
              error={state.error}
              style={{ padding: 10, width: "100%" }}
              htmlFor="email"
            >
              Adresse mail ou identifiant Open Dossard
            </InputLabel>
            <Input
              value={state.email}
              error={state.error}
              onChange={handleEmailAddressChange}
              id="email"
              startAdornment={
                <InputAdornment position="start">
                  <Icon>email</Icon>
                </InputAdornment>
              }
            />
          </FormControl>
          <FormControl
            required={true}
            fullWidth={true}
            className={classes.field}
          >
            <InputLabel
              error={state.error}
              style={{ padding: 10 }}
              htmlFor="password"
            >
              Mot de passe
            </InputLabel>
            <Input
              value={state.password}
              error={state.error}
              onChange={handlePasswordChange}
              type="password"
              id="password"
              startAdornment={
                <InputAdornment position="start">
                  <Icon>lock</Icon>
                </InputAdornment>
              }
            />
          </FormControl>
          {state.error && (
            <FormControl
              error={true}
              component="fieldset"
              className={classes.formControl}
            >
              <FormHelperText>
                Login ou mot de passe incorrect (ou serveur injoignable)
              </FormHelperText>
            </FormControl>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100px"
            }}
          >
            <Button
              onClick={handleLogin}
              variant="contained"
              color="primary"
              className={classes.button}
            >
              Valider
            </Button>
          </div>
        </Paper>
      </div>
    );
  } else
    return (
      <p style={{ textAlign: "center" }}>Chargement de la page en cours ...</p>
    );
};

const useStyles = makeStyles({
  container: {
    display: "flex",
    justifyContent: "center",
    minWidth: 281
  },
  formControl: {
    padding: 10
  },
  field: {
    padding: 30
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center"
  },
  button: {
    fontWeight: "bold",
    width: 200,
    height: 40,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
});

export default LoginPage;
