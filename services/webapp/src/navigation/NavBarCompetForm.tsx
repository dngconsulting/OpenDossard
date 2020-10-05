
import React, { useState } from 'react';
import { AppBar, Tabs, Tab, Button, createStyles, makeStyles, Theme, Box, Typography, withStyles } from '@material-ui/core';
import { styles } from './styles';
import InfoRace from 'pages/raceform/InfoRace';
import MapRace from 'pages/raceform/MapRace';
import PropRace from 'pages/raceform/PropRace';
import PriceRace from 'pages/raceform/PriceRace';


interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

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

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}



const CompetNavBar = () => {


  const [value, setValue] = useState(0);

  const [races,setRaces] = useState([]);
  const [prices,setPrices] = useState([]);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  
const addRaces=(data:any): void =>{races.push(data); setRaces(races);console.log(races)};
const addPrices=(data:any): void =>{prices.push(data); setPrices(prices);console.log(prices)};

const deleteRaces=(value:any) : void =>{const list=[...races];console.log(value);list.splice(value,1);setRaces(list);console.log(races)};
const deletePrices=(value:any) : void =>{const list=[...prices];console.log(value);list.splice(value,1);setPrices(list);console.log(races)};

const getRaces = ((value:any) : void =>{const list = [...value];console.log(value); setRaces(list)});
const getPrices = ((value:any) : void =>{const list = [...value];console.log(value); setPrices(list)});

  return (
    <div>


      
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange} aria-label="simple tabs example" centered>
          <Tab label="Informations Générales"/>
          <Tab label="Horaires & Circuit"/>
          <Tab label="Tarifs"/>
          <Tab label="Localisation"/>
        </Tabs>

      </AppBar>
      <TabPanel value={value} index={0}>

        <InfoRace/>

      </TabPanel>
      <TabPanel value={value} index={1}>
        <PropRace races={addRaces} delete={deleteRaces} edit={getRaces} value={races}/>
      </TabPanel>
      <TabPanel value={value} index={2}>
      <PriceRace value={prices} prices={addPrices} delete={deletePrices} edit={getPrices}/>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <MapRace />
      </TabPanel>
      {/* <div>
        <Button style={{ position: 'relative', width: '206px', height: '47px', left: '28%', top: '-110px' }} variant={'contained'} color={'primary'} >Sauvegarder</Button>
      </div> */}
    </div>
  );
}
export default CompetNavBar;



