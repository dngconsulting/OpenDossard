import React from 'react';
import {createStyles, makeStyles, Theme, useTheme} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {cadtheme} from '../../App';
import ReactDataGrid from 'react-data-grid';

interface EditResultsProps {
    children?: React.ReactNode;
    dir?: string;
    index: any;
    value: any;
}

function TabPanel(props: EditResultsProps) {
    const {children, value, index, ...other} = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`action-tabpanel-${index}`}
            aria-labelledby={`action-tab-${index}`}
            {...other}
        >
            <Box p={3}>{children}</Box>
        </Typography>
    );
}

const resultsCols = [
    {key: 'classement', name: 'Classement',editable: false, width:100},
    {key: 'dossardNumber', name: 'Num. Dossard', editable: true,width:120},
    {key: 'nom', name: 'Nom',editable: false, resizable:true},
    {key: 'prenom', name: 'Prénom',editable: false, resizable:true},
    {key: 'catev', name: 'Caté. valeur',editable: false, resizable:true},
    {key: 'catea', name: 'Caté. age',editable: false, resizable:true},
    {key: 'genre', name: 'Genre',editable: false, resizable:true},
];

const a11yProps = (index: any) => {
    return {
        id: `action-tab-${index}`,
        'aria-controls': `action-tabpanel-${index}`,
    };
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: theme.palette.background.paper,
            width: '100%',
            height: '100%',
            position: 'relative',
        },

    }),
);

const getInitialRows = () => {
    const resultsRows = [];
    for (let i = 0; i <= 30; i++) {
        resultsRows[i] = {id: i, classement: i + 1, dossardNumber: '', nom: '', prenom: ''};
    }
    return resultsRows
}

const EditResultsPage = (props: EditResultsProps) => {
    const classes = useStyles(cadtheme);
    const theme = useTheme();
    const [resultsRows, setRows] = React.useState(getInitialRows());
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const onGridRowsUpdated: any = ({fromRow, toRow, updated}:any) => {
        const rows = resultsRows.slice();
        for (let i = fromRow; i <= toRow; i++) {
            rows[i] = {...rows[i], nom : 'dsds', prenom : 'dfd', ...updated};
        }
        setRows(rows)
    };

    return (
        <div className={classes.root}>
            <AppBar position="static" color="default">
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    aria-label="action tabs example"
                >
                    <Tab label="Course 2/3 " {...a11yProps(0)} />
                    <Tab label="Course 4" {...a11yProps(1)} />
                    <Tab label="Course 5" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <div>
                <TabPanel value={value} index={0} dir={theme.direction}>
                    <ReactDataGrid
                        columns={resultsCols}
                        rowGetter={(i: any) => resultsRows[i]}
                        onGridRowsUpdated={onGridRowsUpdated}
                        rowsCount={resultsRows.length}
                        minHeight={700}
                        enableCellSelect={true}

                    />
                </TabPanel>
                <TabPanel value={value} index={1} dir={theme.direction}>
                    Résultats course 4
                </TabPanel>
                <TabPanel value={value} index={2} dir={theme.direction}>
                    Résultats course 5
                </TabPanel>
            </div>

        </div>
    );
};

export default EditResultsPage;
