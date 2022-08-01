import * as React from 'react';
import './App.css';
import AppNavBar from './navigation/App.Bar';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/Store';
import { CssBaseline, MuiThemeProvider, useMediaQuery } from '@material-ui/core';
import { BREAK_POINT_MOBILE_TABLET, cadtheme } from './theme/theme';
import { loadSDK } from './util/api';
import { useEffect } from 'react';
import { useTheme } from '@material-ui/core/styles';

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(BREAK_POINT_MOBILE_TABLET));
  useEffect(() => {
    loadSDK();
  }, []);
  return (
    <Provider store={store}>
      <Router>
        <MuiThemeProvider theme={cadtheme}>
          <CssBaseline />
          <AppNavBar isMobile={isMobile} />
        </MuiThemeProvider>
      </Router>
    </Provider>
  );
};

export default App;
