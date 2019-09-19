import * as React from 'react';
import './App.css';
import AppNavBar from './navigation/App.Bar';
import {BrowserRouter as Router} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store/Store';
import {createMuiTheme, MuiThemeProvider} from '@material-ui/core';

const theme = createMuiTheme({
    palette: {
        primary: {
            light: '#006064',
            main: '#006064',
            dark: '#00363a',
            contrastText: 'white'
        },
        secondary: {
            light: '#f9683a',
            main: '#bf360c',
            dark: '#870000',
            contrastText: 'white'
        }
    },
});

class App extends React.Component {
    public render() {
        return (
            <Provider store={store}>
                <Router>
                    <MuiThemeProvider theme={theme}>
                        <AppNavBar/>
                    </MuiThemeProvider>
                </Router>
            </Provider>
        );
    }
}

export default App;
