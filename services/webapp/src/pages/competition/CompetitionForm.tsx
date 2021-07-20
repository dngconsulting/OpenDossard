import LeafletMap from 'components/LeafletMap';
import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Tabs, Tab, Button, createStyles, makeStyles, Theme, Box, Typography } from '@material-ui/core';
import InfoRace from 'pages/raceform/InfoRace';
import PropRace from 'pages/raceform/PropRace';
import PriceRace from 'pages/raceform/PriceRace';
import { PricingInfo, CompetitionInfo, CompetitionEntity } from 'sdk';
import { NotificationContext } from 'components/CadSnackbar';
import { apiCompetitions } from 'util/api';
import { CompetitionCreate, CompetitionCreateCategoriesEnum, CompetitionCreateCompetitionTypeEnum, } from 'sdk/models/CompetitionCreate';
import {withStyles} from "@material-ui/core/styles";
import {styles} from "../../navigation/styles";

interface ITabPanelProps {
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

function TabPanel(props: ITabPanelProps) {
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

const CompetNavBar = (props: any) => {
  const [races, setRaces] = useState<CompetitionInfo[]>([]);
  const [prices, setPrices] = useState<PricingInfo[]>([]);
  const [newCompetition, setNewCompetition] = useState<CompetitionCreate>({
    races: ["Toutes"],
    categories: [CompetitionCreateCategoriesEnum.Toutes],
    eventDate: null,
    fede: null,
    name: "",
    club: null,
    competitionType: null,
    competitionInfo: races,
    zipCode: "",
    gpsCoordinates: "",
    website: "",
    facebook: "",
    contactPhone: "",
    contactEmail: "",
    contactName: "",
    isOpenedToOtherFede: false,
    isOpenedToNL: false,
    observations: "",
    pricing: [],
    localisation: "",
    circuitLength: "",
    dept: "",
    info: ""
  })

  const competitionId = props.match.params.id;

  const [value, setValue]               = useState<number>(0);
  const [zipCodeError, setZipCodeError] = useState<boolean>(false);
  const [phoneError, setPhoneError]     = useState<boolean>(false);
  const [linkError, setLinkError]       = useState<boolean>(false);
  const [emailError, setEmailError]     = useState<boolean>(false);
  const [isValidInfos, setIsValidInfos] = useState<boolean>(false);
  const [position, setPosition]         = useState<number[]>([0, 0]);
  const [, setIsLoading]                = useState(false);

  const [, setNotification]             = useContext(NotificationContext);

  const classes = useStyles();
  const error: any = [phoneError, linkError, emailError, zipCodeError];

  useEffect(() => {
    const editCompetition = async () => {
      if (competitionId) {
        const id = String(competitionId);
        const editComp: CompetitionEntity = await apiCompetitions.getCompetition({id});
        // ,fede:CompetitionCreateCategoriesEnum.editComp.fede)),type:String(editComp.fede))

        setPrices(editComp.pricing);
        setRaces(editComp.competitionInfo);

        // position string =>number
        if (editComp.gpsCoordinates || editComp.gpsCoordinates !== "") {
          const tab = (editComp.gpsCoordinates).split(',');
          const lat = Number(tab[0]);
          const lng = Number(tab[1]);
          setPosition([lat, lng]);
        }
        else {
          setPosition([0, 0]);
        }

        const compareType = (): any => {
          if (String(Object.values(editComp.competitionType)) === String(Object.values(CompetitionCreateCompetitionTypeEnum.AUTRE))) {
            return CompetitionCreateCompetitionTypeEnum.AUTRE
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

        setNewCompetition({
          ...newCompetition,
          competitionInfo: editComp.competitionInfo,
          pricing:editComp.pricing,
          id: editComp.id,
          competitionType: compareType(),
          eventDate: editComp.eventDate,
          name: editComp.name,
          club: editComp.club.id,
          zipCode: editComp.zipCode,
          facebook: editComp.facebook,
          gpsCoordinates: editComp.gpsCoordinates,
          website: editComp.website,
          contactEmail: editComp.contactEmail,
          contactName: editComp.contactName,
          contactPhone: editComp.contactPhone,
          isOpenedToNL: editComp.isOpenedToNL,
          isOpenedToOtherFede: editComp.isOpenedToOtherFede,
          observations: editComp.observations,
          localisation: editComp.localisation,
          dept: editComp.dept,
          info: editComp.info,
          circuitLength: editComp.circuitLength,
          fede: editComp.fede,
          commissioner : editComp.commissioner,
          speaker:editComp.speaker,
          aboyeur:editComp.aboyeur,
          feedback:editComp.feedback
        });
      }
    }
    editCompetition();

  },[])

  const handleSubmit = async (event: any): Promise<any> => {
    controlCompetition();

    if (newCompetition === null) { return; }
    setIsLoading(true);

    const control=controlTextfield();
    if (control===false) {
      try {


        if (newCompetition.id) {
          const id = String(newCompetition.id);
          await apiCompetitions.updateCompetition({ id, competitionCreate: newCompetition });
          window.location.href = "/competitions#all";

        } else {

          await apiCompetitions.saveCompetition({ competitionCreate: newCompetition });
          window.location.href = "/competitions#all";
        }
      }

      catch (err) {
        setNotification({
          message: `L'épreuve ${newCompetition.name} n'a pu être créé ou modifiée`,
          type: 'error',
          open: true
        });

      }
      finally {
        setIsLoading(false);
      }
    }
    else {
      setNotification({
        message: `Un ou plusieurs champs du formulaire est ou sont non conformes`,
        type: 'error',
        open: true
      });
    }
  }

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const addRaces = (data: any): void => { races.push(data); setRaces(races); setNewCompetition({...newCompetition,competitionInfo:races}) };
  const addPrices = (data: any): void => { prices.push(data); setPrices(prices); setNewCompetition({...newCompetition,pricing:prices})};
  const deleteRaces = (value: any): void => { const list = [...races]; list.splice(value, 1); setRaces(list);setNewCompetition({...newCompetition,competitionInfo:list}) };
  const deletePrices = (value: any): void => { const list = [...prices]; list.splice(value, 1); setPrices(list);setNewCompetition({...newCompetition,pricing:list}) };
  const getRaces = ((value: any): void => { const list = [...value]; setRaces(list) });
  const getPrices = ((value: any): void => { const list = [...value]; setPrices(list) });
  const getnewCompetition = ((value: any): void => { setNewCompetition(value); });
  const getPosition = ((value: any): void => { setPosition([value.lat, value.lng]); setNewCompetition({ ...newCompetition, gpsCoordinates: String(value.lat + ', ' + value.lng) }); });
  // champs obligatoires
  const controlCompetition = (): void => {
    if ((newCompetition.name === "" || newCompetition.eventDate === null || newCompetition.competitionType === null || newCompetition.fede === null || newCompetition.club === null ||newCompetition.zipCode==="")) {
      setIsValidInfos(true);
      setNotification({
        message: `Une de ces informations est manquante (nom, date, type, féderation de l' épreuve)`,
        open: true,
        type: 'error'
      });
    }
    else {
      setIsValidInfos(false);
    }
  }

  // controles format
  const controlTextfield = (): boolean => {
    let bool=false;
    if ((newCompetition.contactPhone).length <= 9 && newCompetition.contactPhone !== "") {
      setPhoneError(true);
      bool= true;
    }
    else {
      setPhoneError(false);
    }
    if ((newCompetition.contactEmail).includes('@', null) === false && newCompetition.contactEmail !== "") {
      setEmailError(true);
      bool= true;
    }
    else {
      setEmailError(false);
    }
    if ((newCompetition.zipCode).length < 5) {
      setZipCodeError(true);
      bool= true;
    }
    else {
      setZipCodeError(false);
    }
    if ((newCompetition.facebook).includes('https', 0) === false && newCompetition.facebook !== "") {
      setLinkError(true);
      bool= true;
    }
    else {
      setLinkError(false);
    }
    if ((newCompetition.website).includes('https', 0) === false && newCompetition.website !== "") {
      setLinkError(true);
      bool= true;
    }
    else {
      setLinkError(false);
    }
    return bool;
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
          <InfoRace value={newCompetition} info={getnewCompetition} error={error} validateError={isValidInfos}/>
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
export default withStyles(styles as any, { withTheme: true })(CompetNavBar as any);



