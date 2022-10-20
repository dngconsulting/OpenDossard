import LeafletMap, { DEFAULT_LAT, DEFAULT_LNG } from 'components/LeafletMap';
import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Box, Button, createStyles, makeStyles, Tab, Tabs, Theme, Typography } from '@material-ui/core';
import InfoRace from 'pages/raceform/InfoRace';
import HorairesRace from 'pages/raceform/HorairesRace';
import PriceRace from 'pages/raceform/PriceRace';
import { CompetitionEntity, CompetitionInfo, LinkInfo, PricingInfo } from 'sdk';
import { NotificationContext } from 'components/CadSnackbar';
import { apiCompetitions } from 'util/api';
import {
  CompetitionCreate,
  CompetitionCreateCategoriesEnum,
  CompetitionCreateCompetitionTypeEnum
} from 'sdk/models/CompetitionCreate';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../../navigation/styles';
import { LatLng } from 'leaflet';
import { LoaderIndicator } from '../../components/LoaderIndicator';
import { saveCompetition } from '../common/Competition';
import MediaRace from '../raceform/MediaRace';
import _ from 'lodash';
import { matchPath } from 'react-router';

interface ITabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ICompetNavBar {
  match: any;
  history: any;
}

export interface IErrorProp {
  course: boolean;
  horaireEngagement: boolean;
  horaireDepart: boolean;
  info1: boolean;
  info2: boolean;
}

export interface IErrorMedia {
  label: boolean;
  link: boolean;
}

export interface IErrorPrice {
  name: boolean;
  tarif: boolean;
}

export interface IErrorInfo {
  fede: boolean;
  name: boolean;
  competitionType: boolean;
  eventDate: boolean;
  zipCode: boolean;
  club: boolean;
  contactPhone: boolean;
  contactEmail: boolean;
  facebook: boolean;
  website: boolean;
}

interface IErrorsForm {
  info: boolean;
  price: boolean;
  horaires: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    Tab: {
      '&:hover': {
        backgroundColor: '#004f04',
        color: '#ffffff'
      }
    },
    button: {
      display: 'block',
      width: '206px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: 10
    }
  })
);

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
        <Box
          style={{
            paddingTop: 0,
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingLeft: 0,
            marginBottom: 0
          }}
          p={3}
        >
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const CompetNavBar = (props: ICompetNavBar) => {
  const isDuplication = matchPath(props.history.location.pathname, {
    path: '/competition/create/:id',
    exact: true,
    strict: false
  })?.isExact;
  const id = props.match.params.id;
  const classes = useStyles();
  const [communeLocalisationForMap, setCommuneLocalisationForMap] = useState<string>();
  const [, setNotification] = useContext(NotificationContext);
  const [isSubmitted, setIsSubmited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<number>(0);
  const [errors, setErrors] = useState<IErrorsForm>({
    info: true,
    price: false,
    horaires: true
  });
  const [newCompetition, setNewCompetition] = useState<CompetitionCreate>({
    fede: null,
    name: '',
    competitionType: null,
    avecChrono: false,
    categories: [CompetitionCreateCategoriesEnum.Toutes],
    races: ['2,3,4,5'],
    eventDate: null,
    zipCode: '',
    clubId: null,
    photoUrls: [],
    info: '',
    competitionInfo: [],
    circuitLength: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    facebook: '',
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    pricing: [],
    isOpenedToOtherFede: false,
    isOpenedToNL: false,
    observations: '',
    localisation: '',
    gpsCoordinates: '',
    contactName: '',
    commissaires: '',
    speaker: '',
    aboyeur: '',
    feedback: '',
    dept: '',
    isValidResults: false
  });

  useEffect(() => {
    const loadCompetition = async () => {
      setIsLoading(true);
      if (!isNaN(parseInt(id))) {
        const res: CompetitionEntity = await apiCompetitions.getCompetition({
          id
        });
        const toUpdateCompetition: CompetitionCreate = {
          ...newCompetition,
          fede: res.fede,
          avecChrono: res.avecChrono,
          id: res.id,
          name: res.name,
          competitionType: compareType(res.competitionType),
          races: res.races,
          eventDate: res.eventDate,
          zipCode: res.zipCode,
          clubId: res.club.id,
          info: res.info,
          competitionInfo: res.competitionInfo,
          circuitLength: res.longueurCircuit,
          contactPhone: res.contactPhone,
          contactEmail: res.contactEmail,
          website: res.siteweb,
          facebook: res.facebook,
          latitude: getGPSCoordinates(res.lieuDossardGPS)[0],
          longitude: getGPSCoordinates(res.lieuDossardGPS)[1],
          pricing: res.pricing,
          isOpenedToOtherFede: res.openedToOtherFede,
          isOpenedToNL: res.openedNL,
          observations: res.observations,
          localisation: res.lieuDossard,
          photoUrls: res.photoUrls,
          gpsCoordinates: String(getGPSCoordinates(res.lieuDossardGPS)),
          contactName: res.contactName,
          commissaires: res.commissaires,
          speaker: res.speaker,
          aboyeur: res.aboyeur,
          feedback: res.feedback,
          dept: res.dept,
          isValidResults: res.resultsValidated
        };
        if (!_.isEmpty(toUpdateCompetition.localisation)) {
          setCommuneLocalisationForMap(toUpdateCompetition.localisation);
        }
        if (isDuplication) {
          // We clean obsolete data that can be associated to previous event
          delete toUpdateCompetition.id;
          delete toUpdateCompetition.eventDate;
          delete toUpdateCompetition.photoUrls;
          delete toUpdateCompetition.feedback;
          delete toUpdateCompetition.commissaires;
          delete toUpdateCompetition.speaker;
          delete toUpdateCompetition.aboyeur;
          setNotification({
            message: `L'épreuve ${toUpdateCompetition.name} a bien été dupliquée mais seule sa sauvegarde rendra celle-ci définitive`,
            type: 'success',
            open: true
          });
        }
        setNewCompetition(toUpdateCompetition);
      }
      setIsLoading(false);
    };
    loadCompetition();
  }, []);

  const compareType = (competitionType: string): CompetitionCreateCompetitionTypeEnum => {
    let type: CompetitionCreateCompetitionTypeEnum = null;
    switch (competitionType) {
      case CompetitionCreateCompetitionTypeEnum.CX:
        type = CompetitionCreateCompetitionTypeEnum.CX;
        break;
      case CompetitionCreateCompetitionTypeEnum.ROUTE:
        type = CompetitionCreateCompetitionTypeEnum.ROUTE;
        break;
      case CompetitionCreateCompetitionTypeEnum.VTT:
        type = CompetitionCreateCompetitionTypeEnum.VTT;
        break;
      case CompetitionCreateCompetitionTypeEnum.AUTRE:
        type = CompetitionCreateCompetitionTypeEnum.AUTRE;
        break;
      default:
        setNewCompetition({ ...newCompetition, isValidResults: false });
    }
    return type;
  };

  const convertGPSCoordinates = (gpsCoordinates: LatLng): string => {
    return String(gpsCoordinates.lat + ', ' + gpsCoordinates.lng);
  };

  const getGPSCoordinates = (gpsCoordinates: string): number[] => {
    let coordinates = [DEFAULT_LAT, DEFAULT_LNG];
    if (gpsCoordinates && gpsCoordinates !== '') {
      const coordinatesTab: string[] = gpsCoordinates.split(',');
      const lat: number = parseFloat(coordinatesTab[0]);
      const lng: number = parseFloat(coordinatesTab[1]);
      coordinates = [lat, lng];
    }
    return coordinates;
  };

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const setMainInfos = (competition: CompetitionCreate, errorInfo: boolean): void => {
    setErrors({ ...errors, info: errorInfo });
    setNewCompetition(competition);
    if (!_.isEmpty(competition.localisation)) setCommuneLocalisationForMap(competition.localisation);
  };

  const setPricesInfo = (pricesInfos: PricingInfo[], errorPrice: boolean): void => {
    setErrors({ ...errors, price: errorPrice });
    setNewCompetition({ ...newCompetition, pricing: pricesInfos });
  };

  const setCompetitionInfos = (infos: CompetitionInfo[], errorProp: boolean): void => {
    setErrors({ ...errors, horaires: errorProp });
    setNewCompetition({ ...newCompetition, competitionInfo: infos });
  };

  const setMediasInfo = (mediasInfos: LinkInfo[], errorMedia: boolean): void => {
    setNewCompetition({ ...newCompetition, photoUrls: mediasInfos });
  };
  const setGPSCoordinates = (gpsCoordinates: LatLng): void => {
    setNewCompetition({
      ...newCompetition,
      latitude: gpsCoordinates.lat,
      longitude: gpsCoordinates.lng,
      gpsCoordinates: convertGPSCoordinates(gpsCoordinates)
    });
  };

  return (
    <>
      <LoaderIndicator visible={isLoading} />
      <div style={{ display: 'block', border: 0 }}>
        <AppBar position="static" style={{ backgroundColor: '#60ac5d' }}>
          <Tabs
            TabIndicatorProps={{ style: { background: 'white', height: 4 } }}
            value={value}
            onChange={handleChange}
            style={{ backgroundColor: '#2e7c31' }}
            centered={true}
            indicatorColor={'primary'}
          >
            <Tab className={classes.Tab} label="Informations Générales" />
            <Tab className={classes.Tab} label="Horaires & Circuit" />
            <Tab className={classes.Tab} label="Tarifs" />
            <Tab className={classes.Tab} label="Localisation" />
            <Tab className={classes.Tab} label="Photos/Medias" />
          </Tabs>
        </AppBar>

        <TabPanel value={value} index={0}>
          <InfoRace
            isDuplication={isDuplication}
            history={props.history}
            competition={newCompetition}
            updateMainInfos={setMainInfos}
            onSaveCompetition={() =>
              saveCompetition({
                competition: newCompetition,
                setIsLoading: setIsLoading,
                setIsSubmited: setIsSubmited,
                setNotification: setNotification,
                setNewCompetition: setNewCompetition,
                history: props.history
              })
            }
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <HorairesRace
            competition={newCompetition}
            updateCompetitionInfos={setCompetitionInfos}
            onSaveCompetition={(infos: CompetitionInfo[]) =>
              saveCompetition({
                competition: { ...newCompetition, competitionInfo: infos },
                setIsLoading: setIsLoading,
                setIsSubmited: setIsSubmited,
                setNotification: setNotification,
                setNewCompetition: setNewCompetition,
                history: props.history
              })
            }
          />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <PriceRace
            pricesInfos={newCompetition.pricing}
            updatePricesInfos={setPricesInfo}
            onSaveCompetition={prices =>
              saveCompetition({
                competition: { ...newCompetition, pricing: prices },
                setIsLoading: setIsLoading,
                setIsSubmited: setIsSubmited,
                setNotification: setNotification,
                setNewCompetition: setNewCompetition,
                history: props.history
              })
            }
          />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <>
            <LeafletMap
              commune={communeLocalisationForMap}
              lat={getGPSCoordinates(newCompetition.gpsCoordinates)[0]}
              lng={getGPSCoordinates(newCompetition.gpsCoordinates)[1]}
              updateCoordinates={setGPSCoordinates}
            />
            <div
              style={{
                width: '70%',
                marginRight: 'auto',
                marginLeft: 'auto'
              }}
            >
              Veuillez utiliser le clic droit de la souris pour positionner la localisation exacte de la course (ou du
              retrait des dossards)
            </div>
            <Button
              style={{
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                width: '256px',
                marginTop: '30px'
              }}
              variant={'contained'}
              value={1}
              color={'primary'}
              onClick={async () => {
                await saveCompetition({
                  competition: newCompetition,
                  setIsLoading: setIsLoading,
                  setIsSubmited: setIsSubmited,
                  setNotification: setNotification,
                  setNewCompetition: setNewCompetition,
                  history: props.history
                });
              }}
            >
              Enregistrer la localisation
            </Button>
          </>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <MediaRace
            mediaInfos={newCompetition.photoUrls}
            updateMediaInfos={setMediasInfo}
            onSaveCompetition={async (medias: LinkInfo[]) => {
              await saveCompetition({
                competition: {
                  ...newCompetition,
                  ...(medias.length > 0 ? { photoUrls: medias } : {})
                },
                setIsLoading: setIsLoading,
                setIsSubmited: setIsSubmited,
                setNotification: setNotification,
                setNewCompetition: setNewCompetition,
                history: props.history
              });
            }}
          />
        </TabPanel>
      </div>
    </>
  );
};

export default withStyles(styles as any, { withTheme: true })(CompetNavBar as any);
