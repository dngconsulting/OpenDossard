import LeafletMap from 'components/LeafletMap';
import React, { useState } from 'react';
import { AppBar, Tabs, Tab, Button, createStyles, makeStyles, Theme, Box, Typography } from '@material-ui/core';
import InfoRace from 'pages/raceform/InfoRace';
import PropRace from 'pages/raceform/PropRace';
import PriceRace from 'pages/raceform/PriceRace';
import { CompetitionEntityCompetitionTypeEnum, FedeEnum, FedeEnumFromJSONTyped } from 'sdk';



interface Iepreuve {

  error: Boolean;
  epreuve: string;
  club: string;
  longueur: string;
  commune: string;
  date: Date;
  nameContact: string;
  emailContact: string;
  facebook: string;
  phoneContact: string;
  siteWeb: string;
  fede: FedeEnum;
  profil: string;
  type: CompetitionEntityCompetitionTypeEnum;
  checkedA: Boolean;
  checkedB: Boolean;
  obs: string;
  position: number[];
  price: string[];
  race: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({

    Tab: {
      "&:hover": { backgroundColor: '#4169E1' }
    }
  }))

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const classes = useStyles();
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}

      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const CompetNavBar = () => {


  const [value, setValue] = useState(0);
  const [races, setRaces] = useState([]);
  const [prices, setPrices] = useState([]);
  const [infos, setInfos] = React.useState<Iepreuve>({ error: false, epreuve: "", club: "", longueur: "", commune: "", date: null, nameContact: "", emailContact: "", facebook: "", phoneContact: "", siteWeb: "", fede: null, profil: "", type: null, checkedA: false, checkedB: false, obs: "", position: [0, 0], price: prices, race: races });
  const classes = useStyles();

  const handleSubmit = (event: any) => {
    if (infos.epreuve === "" || infos.date === null || infos.type === null || infos.fede === null || infos.club === null) {
      setInfos({ ...infos, error: true })
    } else {
      setInfos({ ...infos, error: false })
    }
  }
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const addRaces = (data: any): void => { races.push(data); setRaces(races); };
  const addPrices = (data: any): void => { prices.push(data); setPrices(prices); };
  const deleteRaces = (value: any): void => { const list = [...races]; list.splice(value, 1); setRaces(list); };
  const deletePrices = (value: any): void => { const list = [...prices]; list.splice(value, 1); setPrices(list); };
  const getRaces = ((value: any): void => { const list = [...value]; setRaces(list) });
  const getPrices = ((value: any): void => { const list = [...value]; setPrices(list) });
  const getInfos = ((value: any): void => { setInfos(value); console.log(infos) });


  return (
    <div>
      <div style={{ display: 'block', minHeight: '700px' }}>
        <AppBar position="static" style={{ backgroundColor: '#008B8B' }}>
          <Tabs value={value} onChange={handleChange} aria-label="simple tabs example" style={{ backgroundColor: '#008B8B' }} centered>
            <Tab className={classes.Tab} label="Informations Générales" />
            <Tab className={classes.Tab} label="Horaires & Circuit" />
            <Tab className={classes.Tab} label="Tarifs" />
            <Tab className={classes.Tab} label="Localisation" />
          </Tabs>
        </AppBar>

        <TabPanel value={value} index={0}>
          <InfoRace value={infos} info={getInfos} />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PropRace races={addRaces} delete={deleteRaces} edit={getRaces} value={races} />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <PriceRace value={prices} prices={addPrices} delete={deletePrices} edit={getPrices} />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <LeafletMap coord={infos} position={getInfos} />
        </TabPanel>
      </div>

      <Button onClick={handleSubmit} style={{ display: 'block', width: '206px', marginLeft: 'auto', marginRight: 'auto', marginBottom: 10 }} variant={'contained'} color={'primary'} >Sauvegarder</Button>
    </div>
  );
}
export default CompetNavBar;



