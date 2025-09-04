import * as React from 'react';
import {IApplicationProps} from '../../actions/App.Actions';
import {ReduxState} from '../../state/ReduxState';
import {connect} from 'react-redux';
import {Card} from "../../components/Card";
import {Typo} from "../../components/Typo";
import {makeStyles} from "@material-ui/core/styles";
import PeopleIcon from "@material-ui/icons/People";
import PhoneIcon from "@material-ui/icons/Phone";
import EmailIcon from "@material-ui/icons/Email";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import {UserEntity} from 'sdk/models/UserEntity';
import {DangerButton} from "../../components/ActionButton";
import {bindActionCreators, Dispatch} from "redux";
import * as _ from "lodash";
import * as AppActionCreators from "../../actions/App.Actions";

interface IProps {
    user: UserEntity;
}

const useStyles = makeStyles(theme => ({
    attributeCircleIcon: {
        fontSize: "75px",
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: "5px"
    },
    pageContainer: {
        display: 'flex',
        flexDirection: 'row',
        padding: theme.spacing(10),
        justifyContent: 'center',
        width: '100%',
    },
    attributeLabelList: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1)
    },
    attributeWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing(4)
    },
    attributeLabel: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: theme.spacing(1),
        height: "20px"
    }
}));

const Wrapper = ({children}) => {
    const classes = useStyles();

    return (
        <div className={classes.pageContainer}>
            {children}
        </div>
    )
}

const Header = ({user}: IProps) => {
    const classes = useStyles();
    return (
        <div className={classes.header}>
            <AccountCircleIcon fontSize={"large"} color={"primary"} className={classes.attributeCircleIcon}/>
            <Typo size={'large'} centered={true} bold={true}>{user.lastName}</Typo>
            <Typo size={'medium'} centered={true}>{user.firstName}</Typo>
        </div>
    )
}

const AttributesList = ({user}: IProps) => {
    const classes = useStyles();
    return (
        <div className={classes.attributeWrapper}>
            <div className={classes.attributeLabelList}>
                <div className={classes.attributeLabel}>
                    <PeopleIcon fontSize={"small"}/>
                    <Typo size={'small'} centered={true} bold={true}>Prénom</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <PeopleIcon fontSize={"small"}/>
                    <Typo size={'small'} centered={true} bold={true}>Nom</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <EmailIcon fontSize={"small"}/>
                    <Typo size={'small'} centered={true} bold={true}>Email</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <PhoneIcon fontSize={"small"}/>
                    <Typo size={'small'} centered={true} bold={true}>Téléphone</Typo>
                </div>
            </div>
            <div className={classes.attributeLabelList}>
                <div className={classes.attributeLabel}>
                    <Typo size={'small'} centered={true}>{user.firstName}</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <Typo size={'small'} centered={true}>{user.lastName}</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <Typo size={'small'} centered={true}>{user.email}</Typo>
                </div>
                <div className={classes.attributeLabel}>
                    <Typo size={'small'} centered={true}>{user.phone ?? "Non renseigné"}</Typo>
                </div>
            </div>
        </div>
    )
}

const DisconnectButton = ({logout}: { logout: () => {} }) => {
    return (
        <DangerButton
            onClick={(evt: React.MouseEvent) => logout()}
        >
            Se déconnecter
        </DangerButton>
    )
}

class ProfilePage extends React.Component<IApplicationProps, {}> {

    public render(): JSX.Element {
        const {authentication} = this.props;

        return (
            <Wrapper>
                <Card>
                    <Header user={authentication}/>
                    <AttributesList user={authentication}/>
                    <DisconnectButton logout={this.props.logout}/>
                </Card>
            </Wrapper>
        );
    }
}

const mapStateToProps = (state: ReduxState) => ({
    authentication: state.authentication,
});

const mapDispatchtoProps = (dispatch: Dispatch) => bindActionCreators(_.assign({}, AppActionCreators), dispatch);

export default connect(mapStateToProps, mapDispatchtoProps)(ProfilePage);
