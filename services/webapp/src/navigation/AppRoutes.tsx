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
            <Route path='/licences' title="Les licences" component={WrappedLicencesPage}/>
            <Route path='/licence/:id' component={WrappedLicencePage}/>
            <Route title="Sélection d'une épreuve" path='/competitionchooser' component={WrappedCompetitionChooser}/>
            <Route title="Palmares" path='/palmares/:id?' component={WrappedPalmaresPage}/>
            <Route title="Mon compte" path='/account' render={renderAccount}/>
            <Route title="Engagement" path='/competition/:id/engagement' component={WrappedEngagementPage}/>
            <Route title="Engagement et édition résultats" path='/competition/:id/engagementresultats'
                   component={WrappedEngagementPage}/>
            <Route path='/competition/:id/results/:mode/' title="Editer les résultats"
                   component={WrappedEditResultPage}/>
        </React.Fragment>
    )
}
