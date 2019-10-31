import * as React from 'react';
import {IApplicationProps} from '../../actions/App.Actions';
import {ReduxState} from '../../state/ReduxState';
import {connect} from 'react-redux';

class ProfilePage extends React.Component<IApplicationProps, {}> {

    public render(): JSX.Element {
        const {authentication} = this.props;
        return (
            <div style={{padding:10}}><b>Information de l'utilisateur connecté : <br/></b>
                Nom : {authentication.lastName} <br/>
                Prénom : {authentication.firstName} <br/>
                Email : {authentication.email} <br/>
                Téléphone : {authentication.phone} <br/>
            </div>
        );
    }
}

const mapStateToProps = (state: ReduxState) => ({
    authentication: state.authentication,
});

export default connect(mapStateToProps, {})(ProfilePage);
