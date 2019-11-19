import * as React from 'react';
import './App.css';
import AppNavBar from './navigation/App.Bar';
import {BrowserRouter as Router} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store/Store';
import {CssBaseline, MuiThemeProvider} from '@material-ui/core';
import {cadtheme} from './theme/theme';

class App extends React.Component {
    public componentDidMount(): void {
    console.log("Open Dossard Starting...")
    }

    public render() {
        return (
            <Provider store={store}>
                <Router>
                    <MuiThemeProvider theme={cadtheme}>
                        <CssBaseline />
                        <AppNavBar/>
                    </MuiThemeProvider>
                </Router>

            </Provider>
        );
    }
}

export default App;
