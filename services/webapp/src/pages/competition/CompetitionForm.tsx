import LeafletMap from 'components/LeafletMap';
import React, {useContext, useEffect, useState} from 'react';
import {
    AppBar,
    Box,
    Button,
    Container,
    createStyles,
    Grid,
    makeStyles,
    Tab,
    Tabs,
    Theme,
    Typography
} from '@material-ui/core';
import InfoRace from 'pages/raceform/InfoRace';
import PropRace from 'pages/raceform/PropRace';
import PriceRace from 'pages/raceform/PriceRace';
import {CompetitionInfo, PricingInfo} from 'sdk';
import {NotificationContext} from 'components/CadSnackbar';
import {apiCompetitions} from 'util/api';
import {
    CompetitionCreate,
    CompetitionCreateCategoriesEnum,
    CompetitionCreateCompetitionTypeEnum,
} from 'sdk/models/CompetitionCreate';
import {withStyles} from '@material-ui/core/styles';
import {styles} from '../../navigation/styles';
import {LatLng} from 'leaflet';
import {LoaderIndicator} from "../../components/LoaderIndicator";

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
    course: boolean,
    horaireEngagement: boolean,
    horaireDepart: boolean,
    info1: boolean,
    info2: boolean,
}

export interface IErrorPrice {
    name: boolean;
    tarif: boolean;
}

export interface IErrorInfo {
    fede: boolean,
    name: boolean,
    competitionType: boolean,
    eventDate: boolean,
    zipCode: boolean,
    club: boolean,
    contactPhone: boolean,
    contactEmail: boolean,
    facebook: boolean,
    website: boolean
}

interface IErrorsForm {
    info: boolean,
    price: boolean,
    prop: boolean,
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        Tab: {
            "&:hover": {
                backgroundColor: '#004f04',
                color: '#ffffff',
            },
        },
        button: {
            display: 'block',
            width: '206px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: 10,
        }
    })
)

function TabPanel(props: ITabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`}
             aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && (
                <Box p={3}>
                    <Typography component="div">{children}</Typography>
                </Box>
            )}
        </div>
    );
}

const CompetNavBar = (props: ICompetNavBar) => {
    const id = props.match.params.id;
    const classes = useStyles();
    const LAT = 43.604652;
    const LNG = 1.444209;

    const [, setNotification] = useContext(NotificationContext);
    const [isSubmitted, setIsSubmited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState<number>(0);
    const [errors, setErrors] = useState<IErrorsForm>({
        info: true,
        price: false,
        prop: true
    });
    const [newCompetition, setNewCompetition] = useState<CompetitionCreate>({
        fede: null,
        name: "",
        competitionType: null,
        categories: [CompetitionCreateCategoriesEnum.Toutes],
        races: ["2,3,4,5"],
        eventDate: null,
        zipCode: "",
        club: null,
        info: "",
        competitionInfo: [],
        circuitLength: "",
        contactPhone: "",
        contactEmail: "",
        website: "",
        facebook: "",
        latitude: LAT,
        longitude: LNG,
        pricing: [],
        isOpenedToOtherFede: false,
        isOpenedToNL: false,
        observations: "",
        localisation: "",
        gpsCoordinates: "",
        contactName: "",
        commissaires: "",
        speaker: "",
        aboyeur: "",
        feedback: "",
        dept: "",
        isValidResults: false,
    });

    useEffect(() => {
        const loadCompetition = async () => {
            setIsLoading(true);
            if (!isNaN(parseInt(id))) {
                const res = await apiCompetitions.getCompetition({id});
                const toUpdateCompetition: CompetitionCreate = {
                    ...newCompetition,
                    fede: res.fede,
                    id: res.id,
                    name: res.name,
                    competitionType: compareType(res.competitionType),
                    races: res.races,
                    eventDate: res.eventDate,
                    zipCode: res.zipCode,
                    club: res.club.id,
                    info: res.info,
                    competitionInfo: res.competitionInfo,
                    circuitLength: res.circuitLength,
                    contactPhone: res.contactPhone,
                    contactEmail: res.contactEmail,
                    website: res.website,
                    facebook: res.facebook,
                    latitude: getGPSCoordinates(res.gpsCoordinates)[0],
                    longitude: getGPSCoordinates(res.gpsCoordinates)[1],
                    pricing: res.pricing,
                    isOpenedToOtherFede: res.isOpenedToOtherFede,
                    isOpenedToNL: res.isOpenedToNL,
                    observations: res.observations,
                    localisation: res.localisation,
                    gpsCoordinates: String(getGPSCoordinates(res.gpsCoordinates)),
                    contactName: res.contactName,
                    commissaires: res.commissaires,
                    speaker: res.speaker,
                    aboyeur: res.aboyeur,
                    feedback: res.feedback,
                    dept: res.dept,
                    isValidResults: res.isValidResults,
                }
                setNewCompetition(toUpdateCompetition);
            }
          setIsLoading(false);
        }
        loadCompetition();

    }, [])

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
                setNewCompetition({...newCompetition, isValidResults: false});
        }
        return type;
    }

    const convertGPSCoordinates = (gpsCoordinates: LatLng): string => {
        return String(gpsCoordinates.lat + ', ' + gpsCoordinates.lng);
    }

    const getGPSCoordinates = (gpsCoordinates: string): number[] => {
        let coordinates = [LAT, LNG];
        if (gpsCoordinates || gpsCoordinates !== "") {
            const coordinatesTab: string[] = gpsCoordinates.split(',');
            const lat: number = parseFloat(coordinatesTab[0]);
            const lng: number = parseFloat(coordinatesTab[1]);
            coordinates = [lat, lng];
        }
        return coordinates;
    }

    const handleSubmit = async (): Promise<any> => {
        setIsSubmited(true);
        if (newCompetition !== null) {
            try {
                setIsLoading(true);
                if (isCompetitionValid()) {
                    try {
                        await apiCompetitions.saveCompetition({competitionCreate: newCompetition});
                        setNotification({
                            message: `L'épreuve ${newCompetition.name} a bien été modifiée`,
                            type: 'success',
                            open: true
                        });
                    } catch (err) {
                      const er = await err.json();
                        setNotification({
                            message: `L'épreuve ${newCompetition.name} n'a pas pu être créée ou modifiée ${er?.message}`,
                            type: 'error',
                            open: true
                        });
                    }
                } else {
                    setNotification({
                        message: 'Veuillez remplir l\'ensemble des champs obligatoires de chaque onglet.',
                        type: 'error',
                        open: true
                    });
                }
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    }

    const setMainInfos = (competition: CompetitionCreate, errorInfo: boolean): void => {
        setErrors({...errors, info: errorInfo});
        setNewCompetition(competition);
    }

    const setCompetitionInfos = (infos: CompetitionInfo[], errorProp: boolean): void => {
        setErrors({...errors, prop: errorProp})
        setNewCompetition({...newCompetition, competitionInfo: infos})
    }

    const setPricesInfo = (pricesInfos: PricingInfo[], errorPrice: boolean): void => {
        setErrors({...errors, price: errorPrice})
        setNewCompetition({...newCompetition, pricing: pricesInfos})
    }

    const setGPSCoordinates = ((gpsCoordinates: LatLng): void => {
        setNewCompetition({
            ...newCompetition,
            latitude: gpsCoordinates.lat,
            longitude: gpsCoordinates.lng,
            gpsCoordinates: convertGPSCoordinates(gpsCoordinates),
        })
    })

    const isCompetitionValid = (): boolean => {
        return (!!newCompetition.name && !!newCompetition?.eventDate && !!newCompetition?.categories && !!newCompetition?.zipCode && !!newCompetition?.races)
    }

    return (
        <div>
            <LoaderIndicator visible={isLoading}/>
            <div style={{display: 'block', minHeight: '700px', border:0}}>
                <AppBar  position="static" style={{backgroundColor: '#60ac5d'}}>
                    <Tabs TabIndicatorProps={{style: {background:'white'}}} value={value} onChange={handleChange}  style={{backgroundColor: '#2e7c31'}}
                          centered={true} indicatorColor={'primary'}>
                        <Tab className={classes.Tab} label="Informations Générales"
                             style={isSubmitted && errors.info ? {color: '#F66262FF'} : {}}/>
                        <Tab className={classes.Tab} label="Horaires & Circuit"
                             style={isSubmitted && errors.prop ? {color: '#F66262FF'} : {}}/>
                        <Tab className={classes.Tab} label="Tarifs"
                             style={isSubmitted && errors.price ? {color: '#F66262FF'} : {}}/>
                        <Tab className={classes.Tab} label="Localisation"/>
                    </Tabs>
                </AppBar>

                <TabPanel value={value} index={0}>
                    <InfoRace mainInfos={newCompetition} updateMainInfos={setMainInfos}/>
                </TabPanel>

                <TabPanel value={value} index={1}>
                    <PropRace infos={newCompetition.competitionInfo} updateCompetitionInfos={setCompetitionInfos}/>
                </TabPanel>

                <TabPanel value={value} index={2}>
                    <PriceRace pricesInfos={newCompetition.pricing} updatePricesInfos={setPricesInfo}/>
                </TabPanel>

                <TabPanel value={value} index={3}>
                    <LeafletMap lat={newCompetition.latitude} lng={newCompetition.longitude}
                                updateCoordinates={setGPSCoordinates}/>
                </TabPanel>
            </div>
            <Container>
                <Grid container={true} spacing={4} alignItems={'center'}>
                    <Grid item={true} xs={6}>
                        <Button variant="contained" color="secondary" className={classes.button}
                                onClick={() => {
                                    props.history.goBack()
                                }}>
                            Retour
                        </Button>
                    </Grid>
                    <Button onClick={handleSubmit} variant={'contained'} color={'primary'}
                            className={classes.button}>
                        Sauvegarder
                    </Button>
                </Grid>
            </Container>
        </div>
    );
}

export default withStyles(styles as any, {withTheme: true})(CompetNavBar as any);



