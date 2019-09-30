import * as React from 'react';
import './App.css';
import AppNavBar from './navigation/App.Bar';
import {BrowserRouter as Router} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store/Store';
import {createMuiTheme, CssBaseline, MuiThemeProvider} from '@material-ui/core';

const theme = createMuiTheme({
    typography: {
        fontFamily: [
            'Roboto', 'Helvetica', 'Arial'
        ].join(','),
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    palette: {
        primary: {
            light: '#6e85dc',
            main: '#3959aa',
            dark: '#00317a',
            contrastText: 'white'
        },
        secondary: {
            light: '#60ac5d',
            main: '#2e7c31',
            dark: '#004f04',
            contrastText: 'white'
        },

    },
});

class App extends React.Component {
    public componentDidMount(): void {
    console.log("App Starting...")
    }

    public render() {
        return (
            <Provider store={store}>
                <Router>
                    <MuiThemeProvider theme={theme}>
                        <CssBaseline />
                        <AppNavBar/>
                    </MuiThemeProvider>
                </Router>

            </Provider>
        );
    }
}

export default App;
