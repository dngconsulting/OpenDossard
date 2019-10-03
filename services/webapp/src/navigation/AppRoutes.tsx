import * as React from "react";
import {ReactElement} from "react";
import {Route} from "react-router";
import {isAuthenticated} from "../state/ReduxState";
import LicencesPage from "../pages/licence/Licences";
import CompetitionChooser from "../pages/CompetitionChooser";
import NewLicencePage from "../pages/licence/NewLicence";
import StatsPage from "../pages/Stats";
import EngagementPage from "../pages/Engagement";
import ResultatsPage from "../pages/Resultats";
import HomePage from '../pages/Home';

export default ( {renderAccount} : {renderAccount: () => ReactElement} ) => (
    <React.Fragment>
        <Route path='/' exact={true} component={isAuthenticated(HomePage)}/>
        <Route path='/account' render={renderAccount}/>
        <Route path='/licences' component={isAuthenticated(LicencesPage)}/>
        <Route path='/competitionchooser' component={isAuthenticated(CompetitionChooser)}/>
        <Route path='/new_licence' component={isAuthenticated(NewLicencePage)}/>
        <Route path='/stats' component={isAuthenticated(StatsPage)}/>
        <Route path='/competition/:id/engagements' component={isAuthenticated(EngagementPage)}/>
        <Route path='/competition/:id/results' component={isAuthenticated(ResultatsPage)}/>
    </React.Fragment>
)
