import LeafletMap from 'components/LeafletMap';
import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Tabs, Tab, Button, createStyles, makeStyles, Theme, Box, Typography } from '@material-ui/core';
import InfoRace from 'pages/raceform/InfoRace';
import PropRace from 'pages/raceform/PropRace';
import PriceRace from 'pages/raceform/PriceRace';
import { PricingInfo, CompetitionInfo, CompetitionEntity } from 'sdk';
import { NotificationContext } from 'components/CadSnackbar';
import { apiCompetitions } from 'util/api';
import { CompetitionCreate, CompetitionCreateCategoriesEnum, CompetitionCreateCompetitionTypeEnum, CompetitionCreateFedeEnum, } from 'sdk/models/CompetitionCreate';


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

const CompetNavBar = (props: any) => {

  const [races, setRaces] = useState<CompetitionInfo[]>([]);
  const [prices, setPrices] = useState<PricingInfo[]>([]);
  const [newCompetition, setNewCompetition] = useState<CompetitionCreate>({ races: ["Toutes"], categories: [CompetitionCreateCategoriesEnum.Toutes], eventDate: null, fede: null, name: "", club: null, competitionType: null, competitionInfo: races, zipCode: "", lieuDossardGPS: "", siteweb: "", facebook: "", contactPhone: "", contactEmail: "", contactName: "", openedToOtherFede: false, openedNL: false, observations:"", pricing: prices, lieuDossard: "", longueurCircuit: "", dept: "", info: "" })
  const [value, setValue] = useState<number>(0);
  const [zipCodeError, setZipCodeError] = useState<boolean>(false);
  const [phoneContactError, setPhoneContactError] = useState<boolean>(false);
  const [facebookError, setFacebookError] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<boolean>(false);
  const [mailContactError, setMailContactError] = useState<boolean>(false)
  const [validateError, setValidateError] = useState<boolean>(false)
  const error: any = [zipCodeError, phoneContactError, facebookError, linkError, mailContactError]
  const [position, setPosition] = useState<number[]>([0, 0])
  const [nav, setNav] = useState<boolean>(false);
  const [loading, showLoading] = React.useState(false);
  const classes = useStyles();
  const [, setNotification] = useContext(NotificationContext);
  const competitionId = props.match.params.id;
  const [isEdit, setIsEdit] = useState<boolean>(false);


  useEffect(() => {
    const editCompetition = async () => {
      if (competitionId) {
        const id = String(competitionId);
        const editComp: CompetitionEntity = await apiCompetitions.getCompetition({ id });
        // ,fede:CompetitionCreateCategoriesEnum.editComp.fede)),type:String(editComp.fede))
        setIsEdit(true);
        setPrices(editComp.pricing);

        setRaces(editComp.competitionInfo);
        
        //position string =>number
        const tab = (editComp.lieuDossardGPS).split(',');
        const lat = Number(tab[0]);
        const lng = Number(tab[1]);
        setPosition([lat, lng]);
        const compareFede= (): any  => {
          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.CYCLOS))) {
            return CompetitionCreateFedeEnum.CYCLOS
          }

          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.FFC))) {
            return CompetitionCreateFedeEnum.FFC
          }

          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.FFTRI))) {
            return CompetitionCreateFedeEnum.FFTRI
          }

          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.FFVELO))) {
            return CompetitionCreateFedeEnum.FFVELO
          }

          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.FSGT))) {
            return CompetitionCreateFedeEnum.FSGT

          }
          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.UFOLEP))) {
            return CompetitionCreateFedeEnum.UFOLEP
          }

          if (String(Object.values(editComp.fede)) === String(Object.values(CompetitionCreateFedeEnum.NL))) {
            return CompetitionCreateFedeEnum.NL
          }

        }
        
        const compareType= (): any  => {
          if (String(Object.values(editComp.competitionType)) === String(Object.values(CompetitionCreateCompetitionTypeEnum.AUTRE))) {
            return CompetitionCreateFedeEnum.CYCLOS
          }

          if (String(Object.values(editComp.competitionType)) === String(Object.values(CompetitionCreateCompetitionTypeEnum.CX))) {
            return CompetitionCreateCompetitionTypeEnum.CX
          }

          if (String(Object.values(editComp.competitionType)) === String(Object.values(CompetitionCreateCompetitionTypeEnum.ROUTE))) {
            return CompetitionCreateCompetitionTypeEnum.ROUTE
          }

          if (String(Object.values(editComp.competitionType)) === String(Object.values(CompetitionCreateCompetitionTypeEnum.VTT))) {
            return CompetitionCreateCompetitionTypeEnum.VTT
          }
        }
        
    

setNewCompetition({ ...newCompetition, id: editComp.id,competitionType: compareType(), eventDate: editComp.eventDate, name: editComp.name, club: editComp.club.id, zipCode: editComp.zipCode, facebook: editComp.facebook, lieuDossardGPS: editComp.lieuDossardGPS, siteweb: editComp.siteweb, contactEmail: editComp.contactEmail, contactName: editComp.contactName, contactPhone: editComp.contactPhone, openedNL: editComp.openedNL, openedToOtherFede: editComp.openedToOtherFede, observations: editComp.observations, lieuDossard: editComp.lieuDossard, dept: editComp.dept, info: editComp.info, longueurCircuit: editComp.longueurCircuit, fede:compareFede() });
      }
    }
    editCompetition();
    
  }, [])



  const handleSubmit = async (event: any): Promise<any> => {


    console.log(JSON.stringify(newCompetition))

    if (newCompetition === null) return;
    showLoading(true)
    try {
      controlCompetition();
      await apiCompetitions.saveCompetition({ competitionCreate: newCompetition });
      window.location.href = "/competitionchooser#all";
    }
    catch (err) {
      setNotification({
        message: `L'épreuve' ${newCompetition.name} n'a pu être créé ou modifiée`,
        type: 'error',
        open: true
      });
      setNav(false);
    }
    finally {
      showLoading(false)
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
  const getnewCompetition = ((value: any): void => { setNewCompetition(value); });
  const getPosition = ((value: any): void => { setPosition([value.lat, value.lng]); setNewCompetition({ ...newCompetition, lieuDossardGPS: String(value.lat + ', ' + value.lng) }); });
  const controlCompetition = (): void => {
    if ((newCompetition.name === "" || newCompetition.eventDate === null || newCompetition.competitionType === null || newCompetition.fede === null || newCompetition.club === null)) {
      setValidateError(true);
      setNotification({
        message: `Une de ces informations est manquante (nom, date, type, féderation de l' épreuve)`,
        open: true,
        type: 'error'
      });
    }
    else {
      setValidateError(false);
    }
    if ((newCompetition.contactPhone).length <= 9 && newCompetition.contactPhone !== "") {
      setPhoneContactError(true);
    }
    else {
      setPhoneContactError(false)
    }
    if ((newCompetition.contactEmail).includes('@', null) === false && newCompetition.contactEmail !== "") {
      setMailContactError(true)
    }
    else {
      setMailContactError(false)
    }
    if ((newCompetition.zipCode).length < 5 && newCompetition.zipCode !== "") {
      setZipCodeError(true);
    }
    else {
      setZipCodeError(false)
    }
    if ((newCompetition.facebook).includes('https', 0) === false && newCompetition.facebook !== "") {
      setFacebookError(true)
    }
    else {
      setFacebookError(false)
    }
    if ((newCompetition.siteweb).includes('https', 0) === false && newCompetition.siteweb !== "") {
      setLinkError(true)
    }
    else {
      setLinkError(false)
    }
  }


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
          <InfoRace value={newCompetition} info={getnewCompetition} error={error} validateError={validateError} isEdit={isEdit} />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PropRace races={addRaces} delete={deleteRaces} edit={getRaces} value={races} />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <PriceRace value={prices} prices={addPrices} delete={deletePrices} edit={getPrices} />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <LeafletMap coord={position} position={getPosition} />
        </TabPanel>
      </div>

      <Button onClick={handleSubmit} style={{ display: 'block', width: '206px', marginLeft: 'auto', marginRight: 'auto', marginBottom: 10 }} variant={'contained'} color={'primary'} >Sauvegarder</Button>
    </div>
  );

}
export default CompetNavBar;



