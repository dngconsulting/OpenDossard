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
import {passportCtrl} from '../../util/api';
import {User} from '../../sdk';
import logohorizontal from '../../assets/logos/logohorizontal.png';

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
            const user = await passportCtrl.login({
                email: this.state.email,
                password: this.state.password
            });
            console.log('User = ' + JSON.stringify(user));
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
                <Paper className={classes.paper}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}><img src={logohorizontal} width='225' height='60'/></div>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel error={this.state.error} htmlFor="email">Email
                            Address</InputLabel>
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
                        <InputLabel error={this.state.error}
                                    htmlFor="password">Password</InputLabel>
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
        justifyContent: 'center'
    },
    paper: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing(3),
        width: '30%',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        [theme.breakpoints.down('md')]: {
            width: '100%',
        },
    }),
    field: {
        marginTop: theme.spacing(3)
    },
    actions: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing(3),
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center'
    }),
    button: {
        marginRight: theme.spacing(1)
    },
});

export default withStyles(styles, {withTheme: true})(LoginPage as any) as any;

