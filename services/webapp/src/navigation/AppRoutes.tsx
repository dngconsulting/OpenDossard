import * as React from 'react';
import {ReactElement} from 'react';
import {Route} from 'react-router';
import {isAuthenticated} from '../state/ReduxState';
import LicencesPage from '../pages/licence/Licences';
import LicencePage from '../pages/licence/LicencePage';
import CompetitionChooser from '../pages/competition/CompetitionChooser';
import PalmaresPage from '../pages/Palmares';
import EngagementPage from '../pages/Engagement';
import HomePage from '../pages/Home';
import EditResultsPage from '../pages/results/Results';
import CompetNavBar from '../pages/competition/CompetitionForm';

const WrappedHomepage        = isAuthenticated(HomePage);
const WrappedEngagementPage  = isAuthenticated(EngagementPage);
const WrappedEditResultPage  = isAuthenticated(EditResultsPage);
const WrappedPalmaresPage    = isAuthenticated(PalmaresPage);
const WrappedCompetitionChooser = isAuthenticated(CompetitionChooser);
const WrappedLicencePage     = isAuthenticated(LicencePage);
const WrappedCompetitionPage = isAuthenticated(CompetNavBar);

export default ({renderAccount}: { renderAccount: () => ReactElement }) => {
    return (
        <React.Fragment>
            <Route path='/' exact={true} title="Page d'accueil" component={WrappedHomepage}/>
            <Route path='/licences' title="Les licences" component={WrappedLicencePage}/>
            <Route path='/licence/:id' component={WrappedLicencePage}/>
            <Route path='/palmares/:id?' title="Palmares" component={WrappedPalmaresPage}/>
            <Route path='/account' title="Mon compte" render={renderAccount}/>
            <Route path='/competitions' title="Sélection d'une épreuve" component={WrappedCompetitionChooser}/>
            <Route path='/competition/create' title="Création d'une épreuve" component={WrappedCompetitionPage}/>
            <Route path='/competition/update/:id' title="Modification d'une épreuve" component={WrappedCompetitionPage}/>
            <Route path='/competition/:id/engagement' title="Engagement" component={WrappedEngagementPage}/>
            <Route path='/competition/:id/engagementresultats' title="Engagement et édition résultats"
                   component={WrappedEngagementPage}/>
            <Route path='/competition/:id/results/:mode/' title="Editer les résultats"
                   component={WrappedEditResultPage}/>
        </React.Fragment>
    )
}
