import * as React from 'react';
import {ReactElement} from 'react';
import {Route} from 'react-router';
import {isAuthenticated} from '../state/ReduxState';
import LicencesPage from '../pages/licence/Licences';
import LicencePage from '../pages/licence/LicencePage';
import CompetitionChooser from '../pages/CompetitionChooser';
import PalmaresPage from '../pages/Palmares';
import EngagementPage from '../pages/Engagement';
import HomePage from '../pages/Home';
import EditResultsPage from '../pages/results/Results';
import CompetNavBar from '../navigation/NavBarCompetForm';

const WrappedHomepage = isAuthenticated(HomePage);
const WrappedEngagementPage = isAuthenticated(EngagementPage);
const WrappedEditResultPage = isAuthenticated(EditResultsPage);
const WrappedPalmaresPage = isAuthenticated(PalmaresPage);
const WrappedCompetitionChooser = isAuthenticated(CompetitionChooser)
const WrappedLicencePage = isAuthenticated(LicencePage)
const WrappedLicencesPage = isAuthenticated(LicencesPage)

export default ({renderAccount}: { renderAccount: () => ReactElement }) => {
    return (
        <React.Fragment>
            <Route path='/' exact={true} title="Page d'accueil" component={WrappedHomepage}/>
            <Route path='/licences' title="Les licences" component={isAuthenticated(LicencesPage)}/>
            <Route path='/licence/:id' component={isAuthenticated(LicencePage)}/>
            <Route path='/palmares/:id?' title="Palmares" component={WrappedPalmaresPage}/>
            <Route path='/account' title="Mon compte" render={renderAccount}/>
            <Route path='/competition/:id/engagement' title="Engagement" component={WrappedEngagementPage}/>
            <Route path='/competition/:id/engagementresultats' title="Engagement et édition résultats"
                   component={WrappedEngagementPage}/>
            <Route path='/competition/:id/results/:mode/' title="Editer les résultats"
                   component={WrappedEditResultPage}/>
            <Route path='/competitionchooser' title="Sélection d'une épreuve" component={WrappedCompetitionChooser}/>
            <Route path='/create' title="Création d'une épreuve" component={CompetNavBar}/>
            <Route path='/update/:id' title="Modification d'une épreuve" component={CompetNavBar}/>
        </React.Fragment>
    )
}
