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

export default ( {renderAccount} : {renderAccount: () => ReactElement} ) => (
    <React.Fragment>
        <Route path='/' exact={true} title="Page d'accueil" component={isAuthenticated(HomePage)} />
        <Route path='/licences' title="Les licences" component={isAuthenticated(LicencesPage)} />
        <Route path='/licence/:id' component={isAuthenticated(LicencePage)} />
        <Route title="Sélection d'une épreuve" path='/competitionchooser' component={isAuthenticated(CompetitionChooser)} />
        <Route title="Palmares" path='/palmares/:id?' component={isAuthenticated(PalmaresPage)}/>
        <Route title="Mon compte" path='/account' render={renderAccount} />
        <Route title="Engagement" path='/competition/:id/engagement' component={isAuthenticated(EngagementPage)} />
        <Route title="Engagement et édition résultats" path='/competition/:id/engagementresultats' component={isAuthenticated(EngagementPage)} />
        <Route path='/competition/:id/results/:mode' title="Editer les résultats" component={isAuthenticated(EditResultsPage)} />

    </React.Fragment>
)
