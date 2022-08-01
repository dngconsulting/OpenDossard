import { createTheme } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core';

export const BREAK_POINT_MOBILE_TABLET = 800;
const palette = {
  primary: {
    light: '#5f73b9',
    main: '#2d4889',
    dark: '#00215b',
    contrastText: '#fff'
  },
  secondary: {
    light: '#60ac5d',
    main: '#2e7c31',
    dark: '#004f04',
    contrastText: '#fff'
  }
};

export const cadtheme = createTheme({
  shadows: Array<string>(25).fill('none') as Theme['shadows'],
  palette,
  overrides: {
    MuiContainer: {
      root: { marginTop: 0 }
    },
    MuiFormLabel: {
      root: { width: 250 }
    },
    MuiPaper: {
      root: { backgroundColor: 'white' },
      rounded: { borderRadius: 0 }
    },
    MuiDrawer: {},
    MuiTabs: {
      root: {
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: palette.secondary.dark
      }
    },
    MuiTab: {
      root: {
        '&:hover': {
          backgroundColor: palette.secondary.light,
          color: '#000'
        },
        selected: {
          backgroundColor: palette.secondary.light,
          color: '#000',
          '&:hover': {
            backgroundColor: palette.secondary.light,
            color: '#000'
          }
        }
      }
    },
    MuiButton: {
      label: {
        justifyItems: 'center',
        alignItems: 'center'
      },
      containedPrimary: {
        color: '#fff',
        fontSize: 13,
        backgroundColor: palette.primary.main
      },
      containedSecondary: {
        color: '#fff',
        fontSize: 13,
        backgroundColor: palette.secondary.main
      },
      textPrimary: {
        color: '#fff',
        fontSize: 13,
        backgroundColor: palette.primary.main
      },
      textSecondary: {
        color: '#fff',
        fontSize: 13,
        backgroundColor: palette.secondary.main
      }
    },
    MuiTableRow: {
      root: {
        '&$hover:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.07)'
        },
        '&$selected': {
          backgroundColor: '#e5f3ff'
        }
      }
    },
    MuiTableCell: {
      root: {
        fontSize: 15,
        zIndex: 2000
      },
      body: {
        color: 'black',
        fontSize: 15
      },
      sizeSmall: {
        padding: '0px 0px 0px 0px',
        height: '20px'
      },
      head: {
        color: 'white',
        padding: 3,
        fontSize: 15,
        backgroundColor: palette.primary.light
      }
    },
    MuiTableBody: {
      root: {}
    },
    MuiTableSortLabel: {
      root: {
        color: 'white'
      },
      icon: {
        color: 'white'
      },
      active: {
        color: 'white'
      },
      iconDirectionAsc: {
        color: 'white'
      },
      iconDirectionDesc: {
        color: 'white'
      }
    }
  },
  typography: {
    fontFamily: ['Hind Siliguri', 'Helvetica', 'Arial'].join(','),
    fontSize: 15,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700
  }
});
