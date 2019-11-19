import * as React from 'react';
import {
    Button,
    FormControl,
    FormHelperText,
    Icon,
    Input,
    InputAdornment,
    InputLabel,
    Theme,
    withStyles
} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import * as querystring from 'querystring';
import {Redirect} from 'react-router';
import {passportCtrl, setBearerToken} from '../../util/api';
import {User} from '../../sdk';
import logohorizontal from '../../assets/logos/logoblanc.svg';
import {cadtheme} from '../../theme/theme';

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
    error: boolean
}

class LoginPage extends React.Component<ILoginProps, ILoginState> {
    public state = {
        email: '',
        password: '',
        error: false
    };

    private handleEmailAddressChange = (event: any) => {
        if (event.target.value !== this.state.email) {
            this.setState({email: event.target.value, error: false});
        }
    };

    private handlePasswordChange = (event: any) => {
        if (event.target.password !== this.state.password) {
            this.setState({password: event.target.value, error: false});
        }
    };

    private handleLogin = async () => {
        try {
            const user : User = await passportCtrl.login({
                email: this.state.email,
                password: this.state.password
            });
            setBearerToken(user.accessToken);
            this.props.login(user);
        } catch (err) {
            this.setState({error: true});
        }
    };

    public render(): JSX.Element {
        const classes = this.props.classes;

        if (this.props.user) {
            const path: string = querystring.parse((this.props.location.search as string).substr(1)).redirect as any || '/engagements';
            return <Redirect to={path}/>;
        }

        return (
            <div className={classes.container}>
                <Paper style={{maxWidth:'400px',
                    width:'90%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignContent: 'center'}}>
                    <div style={{
                        display: 'flex',
                        backgroundColor: cadtheme.palette.primary.main,
                        alignItems: 'center',
                        padding:'10px',
                        justifyContent: 'center',
                    }}><img src={logohorizontal} width='171' height='92' alt='logo'/></div>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel error={this.state.error} style={{padding:10}} htmlFor="email">Adresse mail ou identifiant Open Dossard</InputLabel>
                        <Input
                            value={this.state.email}
                            error={this.state.error}
                            onChange={this.handleEmailAddressChange}
                            id="email"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>email</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel error={this.state.error} style={{padding:10}}
                                    htmlFor="password">Mot de passe</InputLabel>
                        <Input
                            value={this.state.password}
                            error={this.state.error}
                            onChange={this.handlePasswordChange}
                            type="password"
                            id="password"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>lock</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    {this.state.error &&
                    <FormControl error={true} component="fieldset" className={classes.formControl}>
                      <FormHelperText>Le login ou le mot de passe est incorrect</FormHelperText>
                    </FormControl>}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100px'
                    }}>
                        <Button
                            onClick={this.handleLogin}
                            variant="contained"
                            color="primary"
                            className={classes.button}>
                            Valider
                        </Button>
                    </div>
                </Paper>
            </div>
        );
    }
}

const styles = (theme: Theme) => ({
    container: {
        display: 'flex',
        justifyContent: 'center',
        minWidth:281
    },
    formControl: {
      padding : 10
    },
    field: {
        padding: theme.spacing(3)
    },
    actions: theme.mixins.gutters({
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center'
    }),

});

export default withStyles(styles, {withTheme: true})(LoginPage as any) as any;

