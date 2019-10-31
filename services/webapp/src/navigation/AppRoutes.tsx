import * as React from 'react';
import {ReactElement} from 'react';
import {Route} from 'react-router';
import {isAuthenticated} from '../state/ReduxState';
import LicencesPage from '../pages/licence/Licences';
import LicencePage from '../pages/licence/LicencePage';
import CompetitionChooser from '../pages/CompetitionChooser';
import StatsPage from '../pages/Stats';
import EngagementPage from '../pages/Engagement';
import HomePage from '../pages/Home';
import EditResultsPage from '../pages/results/Results';

export default ( {renderAccount} : {renderAccount: () => ReactElement} ) => (
    <React.Fragment>
        <Route path='/' exact={true} title="Page d'accueil" component={isAuthenticated(HomePage)} />
        <Route path='/licences' title="Les licences" component={isAuthenticated(LicencesPage)} />
        <Route path='/licence/:id' component={isAuthenticated(LicencePage)} />
        <Route title="Sélection d'une épreuve" path='/competitionchooser/:goto' component={isAuthenticated(CompetitionChooser)} />
        <Route title="Statistiques et reporting" path='/stats' component={isAuthenticated(StatsPage)}/>
        <Route title="Mon compte" path='/account' render={renderAccount} />
        <Route title="Engagement des coureurs" path='/competition/:id/engagements' component={isAuthenticated(EngagementPage)} />
        <Route path='/competition/:id/results/:mode' title="Editer les résultats" component={isAuthenticated(EditResultsPage)} />
    </React.Fragment>
)
