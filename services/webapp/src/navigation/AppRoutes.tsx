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
        <Route path='/' exact={true} title="Page d'accueil" component={isAuthenticated(HomePage)}/>
        <Route path='/licences' title="Les licences" component={isAuthenticated(LicencesPage)}/>
        <Route path='/licence/:id' component={isAuthenticated(LicencePage)}/>
        <Route path='/competitionchooser/:goto' title="Sélection d'une épreuve" component={isAuthenticated(CompetitionChooser)}/>
        <Route path='/stats' title="Statistiques et reporting" component={isAuthenticated(StatsPage)}/>
        <Route path='/account' title="Mon compte" render={renderAccount}/>
        <Route path='/competition/:id/engagements' title="Engagement des coureurs" component={isAuthenticated(EngagementPage)}/>
        <Route path='/competition/:id/results/:mode' title="Editer les résultats" component={isAuthenticated(EditResultsPage)}/>
    </React.Fragment>
)
