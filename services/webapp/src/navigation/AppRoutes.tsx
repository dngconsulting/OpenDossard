import * as React from "react";
import {ReactElement} from "react";
import {Route} from "react-router";
import {isAuthenticated} from "../state/ReduxState";
import LicencesPage from "../pages/licence/Licences";
import CompetitionChooser from "../pages/CompetitionChooser";
import NewLicencePage from "../pages/licence/NewLicence";
import StatsPage from "../pages/Stats";
import EngagementPage from "../pages/Engagement";
import HomePage from '../pages/Home';
import EditResultsPage from '../pages/results/Edit';
import ViewResultsPage from '../pages/results/View';

export default ( {renderAccount} : {renderAccount: () => ReactElement} ) => (
    <React.Fragment>
        <Route path='/' exact={true} title="Page d'accueil" component={isAuthenticated(HomePage)}/>
        <Route path='/licences' title="Les licences" component={isAuthenticated(LicencesPage)}/>
        <Route path='/competitionchooser' title="Sélection d'une épreuve" component={isAuthenticated(CompetitionChooser)}/>
        <Route path='/new_licence' title="Créer une nouvelle licence" component={isAuthenticated(NewLicencePage)}/>
        <Route path='/stats' title="Statistiques et reporting" component={isAuthenticated(StatsPage)}/>
        <Route path='/account' title="Mon compte" render={renderAccount}/>
        <Route path='/competition/:id/engagements' title="Engagement des coureurs" component={isAuthenticated(EngagementPage)}/>
        <Route path='/competition/:id/results/create' title="Editer les résultats" component={isAuthenticated(EditResultsPage)}/>
        <Route path='/competition/:id/results/view' title="Visualiser les résultats" component={isAuthenticated(ViewResultsPage)}/>
    </React.Fragment>
)
