import * as React from 'react';
import {
    Button,
    FormControl,
    Icon,
    Input,
    InputAdornment,
    InputLabel,
    Theme,
    withStyles
} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import * as querystring from 'querystring';
import {User} from '../../state/User';
import {Redirect} from 'react-router';
import {passportCtrl} from '../../util/api';

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
}

class LoginPage extends React.Component<ILoginProps, ILoginState> {
    public state = {
        email: "",
        password: ""
    };

    private handleEmailAddressChange = (event: any) => {
        this.setState({ email: event.target.value })
    }

    private handlePasswordChange = (event: any) => {
        this.setState({ password: event.target.value })
    }

    private handleLogin = async () => {
        // TODO Ne fonctionne pas en mode BodyParams
        // await passportCtrl.passportCtrlLogin({email : 'xavier@xavier.com',password:'azerty'})
        this.props.login(this.state);
    }

    public render(): JSX.Element {
        const classes = this.props.classes;

        if (this.props.user) {
            const path: string = querystring.
                parse((this.props.location.search as string).substr(1)).redirect as any || '/engagements';
            return <Redirect to={path} />
        }

        return (
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2>{'Login'}</h2>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel htmlFor="email">Email Address</InputLabel>
                        <Input
                            value={this.state.email}
                            onChange={this.handleEmailAddressChange}
                            id="email"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>email</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel htmlFor="password">Password</InputLabel>
                        <Input
                            value={this.state.password}
                            onChange={this.handlePasswordChange}
                            type="password"
                            id="password"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>lock</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    <div className={classes.actions}>
                        <Button variant="text" className={classes.button}>
                            Cancel
                        </Button>
                        <Button
                            onClick={this.handleLogin}
                            variant="text"
                            color="primary"
                            className={classes.button}>
                            Submit
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

export default withStyles(styles, { withTheme: true })(LoginPage as any) as any;

