import {createMuiTheme} from '@material-ui/core';

const palette = {
    primary: {
        light: '#6e85dc',
        main: '#3959aa',
        dark: '#00317a',
        contrastText: '#fff'
    },
    secondary: {
        light: '#60ac5d',
        main: '#2e7c31',
        dark: '#004f04',
        contrastText: '#fff'
    },
}

export const cadtheme = createMuiTheme({
    palette,
    overrides:{
        MuiDrawer: {

        },
        MuiButton: {
            containedPrimary: {
                color: '#fff',
                fontSize: 13,
                backgroundColor: palette.primary.main
            },
            containedSecondary: {
                color: '#fff',
                fontSize: 13,
                backgroundColor : palette.secondary.main
            },
            textPrimary: {
                color: '#fff',
                fontSize: 13
            },
            textSecondary: {
                color : '#fff',
                fontSize: 13
            },

        },
        MuiTableRow: {
            root: {
                '&$hover:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.07)',
                },
                '&$selected': {
                    backgroundColor: '#e5f3ff',
                },
            },
        },
        MuiTableCell: {
            root: {
                padding: 10,
                fontSize:15,
                zIndex:2000,
            },
            body: {
                color: 'black',
                fontSize:15
            },
            head: {
                color: 'white',
                fontSize:15,
                backgroundColor: palette.primary.light,
            },
        },
        MuiTableSortLabel: {
            root: {
                color:'white',
            },
            icon: {
                color : 'white'
            },
            active: {
                color: 'white'
            },
            iconDirectionAsc: {
                color: "white",
            },
            iconDirectionDesc: {
                color: "white",
            }
        }
    },
    typography: {
        fontFamily: [
            'Roboto', 'Helvetica', 'Arial'
        ].join(','),
        fontSize: 15,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
});
