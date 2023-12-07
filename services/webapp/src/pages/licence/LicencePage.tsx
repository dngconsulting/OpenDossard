import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

import { TextareaAutosize, useMediaQuery, withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ClubSelect, { IOptionType } from '../../components/ClubSelect';
import { FedeEnum, LicenceEntity, LicenceEntity as Licence } from '../../sdk';
import { apiLicences, apiRaces } from '../../util/api';
import { FEDERATIONS } from '../common/shared-entities';
import { NotificationContext } from '../../components/CadSnackbar';

import { ConfirmDialog } from '../../util';
import { LoaderIndicator } from '../../components/LoaderIndicator';
import { BREAK_POINT_MOBILE_TABLET } from '../../theme/theme';
import { toMMDDYYYY, toTime } from '../../util/date';
import { CompetitionEntityCompetitionTypeEnum } from '../../sdk/models/CompetitionEntity';

interface ILicencesProps {
  items: any[];
  classes: any;
  history: any;
  match: any;
}

interface ICategory {
  label: string;
  value: string;
  competitionType: CompetitionEntityCompetitionTypeEnum | undefined;
}

interface IAgeCategory {
  label: string;
  value: string;
  gender: string;
}

interface IValidationForm {
  name?: boolean;
  genre?: boolean;
  firstName?: boolean;
  fede?: boolean;
  licenceNumber?: boolean;
  club?: boolean;
  catea?: boolean;
  catev?: boolean;
  dept?: boolean;
  birthYear?: boolean;
  saison?: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      width: '90%',
      minWidth: 167
    },
    button: {
      margin: theme.spacing(1)
    }
  })
);

const LicencesPage = (props: ILicencesProps) => {
  const id = props.match.params.id;

  const [, setNotification] = useContext(NotificationContext);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [open, openDialog] = useState(false);
  const [loading, showLoading] = useState(false);
  const [newLicence, setNewLicence] = useState<Licence>({
    id: null,
    name: '',
    firstName: '',
    licenceNumber: 'NC',
    gender: null,
    fede: null,
    birthYear: '',
    dept: '',
    club: '',
    catea: '',
    catev: '',
    catevCX: '',
    saison: !isNaN(parseInt(id)) ? '' : new Date().getFullYear().toString(),
    author: null,
    lastChanged: null,
    comment: ''
  });
  const [validation, setValidation] = useState<IValidationForm>({
    name: false,
    firstName: false,
    fede: false,
    licenceNumber: false,
    genre: false,
    club: false,
    catea: false,
    catev: false,
    dept: false,
    birthYear: false,
    saison: false
  });
  const [updatedLicence, setUpdatedLicence] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(BREAK_POINT_MOBILE_TABLET));

  const fedeDetails = FEDERATIONS[newLicence.fede];

  useEffect(() => {
    if (!isNaN(parseInt(id))) {
      setEditMode(true);
      apiLicences.get({ id }).then((res: Licence) => {
        const toUpdateLicence = {
          ...newLicence,
          id: res.id,
          name: res.name,
          firstName: res.firstName,
          licenceNumber: res.licenceNumber,
          saison: res.saison,
          gender: res.gender,
          birthYear: res.birthYear ? res.birthYear : '',
          fede: res.fede,
          dept: res.dept,
          club: res.club,
          catea: res.catea.toUpperCase(),
          catev: res.catev.toUpperCase(),
          catevCX: res.catevCX ? res.catevCX.toUpperCase() : '',
          comment: res.comment,
          lastChanged: res.lastChanged,
          author: res.author
        };
        setNewLicence(toUpdateLicence);
      });
    } else {
      setEditMode(false);
    }
    return () => setEditMode(false);
  }, []);

  const autoSelectCateA = (saison: string, birthyear: string) => {
    const age = saison ? parseInt(saison) - parseInt(birthyear) : new Date().getFullYear() - parseInt(birthyear);
    console.log('age ' + parseInt(saison));
    let catea = '';
    if (newLicence.gender === 'F') {
      catea += 'F';
    }
    if (age >= 5 && age <= 6) {
      catea += 'MO';
    } else if (age >= 7 && age <= 8) {
      catea += 'PO';
    } else if (age >= 9 && age <= 10) {
      catea += 'PU';
    } else if (age >= 11 && age <= 12) {
      catea += 'B';
    } else if (age >= 13 && age <= 14) {
      catea += 'M';
    } else if (age >= 15 && age <= 16) {
      catea += 'C';
    } else if (age >= 17 && age <= 18) {
      catea += 'J';
    } else if (age >= 19 && age <= 22) {
      catea += 'E';
    } else if (age >= 23 && age <= 39) {
      catea += 'S';
    } else if (age >= 40 && age <= 49) {
      catea += 'V';
    } else if (age >= 50 && age <= 59) {
      catea += 'SV';
    } else if (age >= 60) {
      catea += 'A';
    }
    return catea;
  };

  const cateAOptions =
    newLicence.fede &&
    fedeDetails.catea
      .map((catea: IAgeCategory) => ({
        value: catea.value,
        label: `${catea.label} (${catea.value})`,
        gender: catea.gender
      }))
      .filter((catea: IAgeCategory) => catea.gender === newLicence.gender);

  const handleFEDEChange = (target: string | any) => {
    if (target) {
      const newLicenceToUpdate = {
        ...newLicence,
        fede: target.value,
        catev: '',
        catevCX: '',
        club: ''
      };
      setNewLicence(newLicenceToUpdate);
    } else {
      setNewLicence({ ...newLicence, fede: null });
    }
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewLicence(oldValues => ({
      ...oldValues,
      catea: '',
      catev: '',
      catevCX: '',
      gender: (event.target as HTMLInputElement).value
    }));
  };

  const createOrUpdateLicence = async (key: number) => {
    let returnedLicence: LicenceEntity = null;

    const isNameValid = !newLicence.name;
    const isFirstnameValid = !newLicence.firstName;
    const isFedeValid = !newLicence.fede;
    const isGenreValid = !newLicence.gender;
    const isLicenceNumberValid = !newLicence.licenceNumber;
    const isCateaValid = !newLicence.catea;
    const isCatevValid = !newLicence.catev;
    const isClubValid = newLicence.fede !== FedeEnum.NL && !newLicence.club;
    const isDeptValid = !newLicence.dept;
    const isBirthYearValid = !newLicence.birthYear;
    const isSeasonValid = newLicence.saison ? newLicence.saison.length !== 4 : false;

    setValidation({
      name: isNameValid,
      firstName: isFirstnameValid,
      fede: isFedeValid,
      licenceNumber: isLicenceNumberValid,
      club: isClubValid,
      genre: isGenreValid,
      catea: isCateaValid,
      catev: isCatevValid,
      dept: isDeptValid,
      birthYear: isBirthYearValid,
      saison: isSeasonValid
    });

    if (
      isNameValid ||
      isGenreValid ||
      isFirstnameValid ||
      isFedeValid ||
      (newLicence.fede !== FedeEnum.NL && isLicenceNumberValid) ||
      isCateaValid ||
      isCatevValid ||
      isDeptValid ||
      isBirthYearValid ||
      (newLicence.fede !== FedeEnum.NL && isSeasonValid) ||
      (newLicence.fede !== FedeEnum.NL && isClubValid)
    ) {
      setNotification({
        message: "Veuillez remplir l'ensemble des champs obligatoires.",
        open: true,
        type: 'error'
      });
    } else {
      showLoading(true);
      returnedLicence = newLicence;
      try {
        if (key) {
          await apiLicences.update({ licenceEntity: newLicence });
        } else {
          newLicence.lastChanged = new Date();
          returnedLicence = await apiLicences.create({
            licenceEntity: newLicence
          });
        }
      } catch (err) {
        setNotification({
          message: `Le coureur ${newLicence.firstName} ${newLicence.name} n'a pu être créé ou modifié`,
          type: 'error',
          open: true
        });
      } finally {
        showLoading(false);
      }
    }
    return returnedLicence;
  };

  const competitionId =
    props.history.location.hash && props.history.location.hash.length > 0
      ? props.history.location.hash.toString().split('_')[1]
      : null;

  const updateEngagement = async (key: number, licenceId: number) => {
    await apiRaces.refreshEngagement({ competitionId: key, licenceId });
  };

  const onSubmit = async () => {
    const licenceUpdated = await createOrUpdateLicence(newLicence.id);

    if (licenceUpdated === null) return;
    if (props.history.location.hash && props.history.location.hash.length > 0) {
      setUpdatedLicence(licenceUpdated);
      openDialog(true);
    } else {
      props.history.push({
        pathname: '/licences/',
        search: 'id=' + licenceUpdated.id
      });
      setNotification({
        message: 'La licence a bien été enregistrée.',
        open: true,
        type: 'success'
      });
    }
  };

  // @ts-ignore
  const classes = useStyles();

  return (
    <div
      style={{
        display: isMobile ? 'block' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        marginLeft: '50px',
        marginRight: '50px'
      }}
    >
      <LoaderIndicator visible={loading} />
      <ConfirmDialog
        title={'Attention '}
        question={`Vous venez de modifier la licence du coureur ${newLicence.firstName} ${newLicence.name}, souhaitez-vous actualiser son engagement avec ces dernières informations ?`}
        open={open}
        confirmMessage={'Oui'}
        cancelMessage={'Non'}
        handleClose={() => {
          openDialog(false);
          props.history.goBack();
        }}
        handleOk={async () => {
          openDialog(false);
          await updateEngagement(parseInt(competitionId), parseInt(updatedLicence.id));
          props.history.goBack();
        }}
      />

      <h1 style={{ color: 'black', textAlign: 'left', width: '100%' }}>
        {editMode ? 'Modifier' : 'Ajouter'} une licence
      </h1>
      <Grid direction={isMobile ? 'column' : 'row'} container={true} spacing={2}>
        <Grid item={true} xs={4}>
          <FormControl className={classes.formControl}>
            <Autocomplete
              value={fedeDetails ? fedeDetails.name : null}
              getOptionLabel={option => option.label}
              getOptionSelected={(option, target) => option.value === target.value}
              autoComplete={true}
              autoSelect={true}
              autoHighlight={true}
              renderInput={params => (
                <TextField
                  {...params}
                  required={true}
                  label="Fédération"
                  variant="standard"
                  error={validation.fede}
                  helperText={validation.fede ? 'Veuillez compléter la fédération' : ''}
                />
              )}
              style={{ width: '100%' }}
              onChange={(event: any, target: string | any) => {
                handleFEDEChange(target);
              }}
              options={Object.keys(FEDERATIONS).map(key => ({
                value: FEDERATIONS[key].name.value,
                label: FEDERATIONS[key].name.label
              }))}
            />
          </FormControl>
        </Grid>
        {newLicence.fede && newLicence.fede !== FedeEnum.NL ? (
          <>
            <Grid item={true} xs={4}>
              <FormControl className={classes.formControl}>
                <TextField
                  required={true}
                  id="licenceNumber"
                  label="Numéro Licence"
                  error={validation.licenceNumber}
                  value={newLicence.licenceNumber}
                  helperText={validation.licenceNumber ? 'Veuillez indiquer le numéro de licence.' : ''}
                  onChange={e =>
                    setNewLicence({
                      ...newLicence,
                      licenceNumber: e.target.value
                    })
                  }
                />
              </FormControl>
            </Grid>
            <Grid item={true} xs={4}>
              <FormControl className={classes.formControl} error={validation.saison}>
                <TextField
                  required={true}
                  style={{ width: 100 }}
                  id="saison"
                  label="Saison"
                  margin="none"
                  type="number"
                  value={newLicence.saison}
                  onChange={e => {
                    setNewLicence({
                      ...newLicence,
                      saison: e.target.value,
                      ...(newLicence.birthYear ? { catea: autoSelectCateA(e.target.value, newLicence.birthYear) } : {})
                    });
                  }}
                  error={validation.saison}
                />
                <FormHelperText id="component-error-text" hidden={!validation.saison}>
                  Veuillez saisir une saison correspondant à la saison actuelle ou antérieure.
                </FormHelperText>
              </FormControl>
            </Grid>
          </>
        ) : (
          <Grid item={true} xs={8}></Grid>
        )}
        <Grid item={true} xs={6}>
          <FormControl className={classes.formControl} error={validation.name}>
            <TextField
              required={true}
              id="name"
              label="Nom"
              margin="none"
              error={validation.name}
              {...(!validation.name && {
                helperText:
                  'En majuscule, ne pas utiliser de caractères accentués, pour les noms composés, mettre un tiret sans espace'
              })}
              value={newLicence.name}
              onChange={e => setNewLicence({ ...newLicence, name: e.target.value })}
            />
            <FormHelperText id="component-error-text" hidden={!validation.name}>
              Veuillez compléter le nom
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item={true} xs={6}>
          <FormControl className={classes.formControl} error={validation.firstName}>
            <TextField
              required={true}
              label="Prénom"
              id="firstName"
              {...(!validation.name && {
                helperText:
                  newLicence.fede === 'FSGT'
                    ? 'Première lettre du prénom en majuscule, puis le reste en minuscule (Ex: Jean-Paul)'
                    : 'Tout en majuscule, ne pas utiliser les caractères accentués en majuscule (Ex: JEAN-PAUL)'
              })}
              margin="none"
              error={validation.firstName}
              value={newLicence.firstName}
              onChange={e => setNewLicence({ ...newLicence, firstName: e.target.value })}
            />
            <FormHelperText id="component-error-text" hidden={!validation.firstName}>
              Veuillez compléter le prénom
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item={true} xs={6} style={{ display: 'flex' }}>
          <div>
            <span style={{ position: 'relative', top: '11px' }}>Genre</span>
          </div>
          <RadioGroup
            aria-label="position"
            name="position"
            value={newLicence.gender}
            onChange={handleRadioChange}
            row={true}
          >
            <FormControlLabel value="H" control={<Radio color="primary" />} label="H" labelPlacement="start" />
            <FormControlLabel value="F" control={<Radio color="primary" />} label="F" labelPlacement="start" />
          </RadioGroup>
        </Grid>
        <Grid item={true} xs={6}>
          <FormControl className={classes.formControl} error={validation.birthYear}>
            <TextField
              required={true}
              error={validation.birthYear}
              id="birthYear"
              type="number"
              label="Année de la naissance"
              margin="none"
              value={newLicence.birthYear}
              onBlur={e => {
                if (
                  new Date().getFullYear() - parseInt(e.target.value) > 130 ||
                  new Date().getFullYear() - parseInt(e.target.value) < 4
                ) {
                  setNewLicence({ ...newLicence, birthYear: '' });
                  setValidation({ ...validation, birthYear: true });
                } else {
                  setValidation({ ...validation, birthYear: false });
                }
              }}
              onChange={e => {
                setNewLicence({
                  ...newLicence,
                  birthYear: e.target.value,
                  catea: autoSelectCateA(newLicence.saison, e.target.value)
                });
              }}
            />
            <FormHelperText id="component-error-text" hidden={!validation.birthYear}>
              Veuillez indiquer une année entre {new Date().getFullYear() - 4} et {new Date().getFullYear() - 130}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>

      {newLicence.fede && (
        <Grid direction={isMobile ? 'column' : 'row'} container={true} spacing={2} style={{ marginTop: '1em' }}>
          <Grid item={true} xs={4}>
            <FormControl className={classes.formControl}>
              <Autocomplete
                noOptionsText={
                  !newLicence.gender || !newLicence.birthYear
                    ? "N'oubliez pas de saisir un genre et une année de naissance"
                    : 'Aucune valeur'
                }
                options={cateAOptions}
                value={cateAOptions.find((option: ICategory) => option.value === newLicence.catea) || null}
                getOptionLabel={option => option.label}
                getOptionSelected={(option, target) => option.value === target.value}
                autoComplete={true}
                autoSelect={true}
                autoHighlight={true}
                renderInput={params => (
                  <TextField
                    {...params}
                    required={true}
                    label="Catégorie Age"
                    variant="standard"
                    error={validation.catea}
                    helperText={validation.catea ? 'Veuillez compléter la Catégorie âge' : ''}
                  />
                )}
                onChange={(event: any, target: string | any) => {
                  setNewLicence(oldValues => ({
                    ...oldValues,
                    catea: target ? target.value : ''
                  }));
                }}
              />
            </FormControl>
          </Grid>
          <Grid item={true} xs={4}>
            <FormControl className={classes.formControl}>
              <Autocomplete
                value={
                  (newLicence.fede && fedeDetails.catev.find((catev: ICategory) => catev.value === newLicence.catev)) ||
                  null
                }
                getOptionLabel={option => option.label}
                getOptionSelected={(option, target) => option.value === target.value}
                autoComplete={true}
                autoSelect={true}
                autoHighlight={true}
                renderInput={params => (
                  <TextField
                    {...params}
                    required={true}
                    label="Catégorie Valeur"
                    variant="standard"
                    error={validation.catev}
                    helperText={validation.catev ? 'Veuillez compléter la Catégorie valeur' : ''}
                  />
                )}
                onChange={(event: any, target: string | any) => {
                  setNewLicence(oldValues => ({
                    ...oldValues,
                    catev: target ? target.value : ''
                  }));
                }}
                options={
                  newLicence.fede &&
                  fedeDetails.catev
                    .filter(catev =>
                      catev.competitionTypes.includes(
                        CompetitionEntityCompetitionTypeEnum.ROUTE,
                        CompetitionEntityCompetitionTypeEnum.VTT
                      )
                    )
                    .map((catev: ICategory) => ({
                      value: catev.value,
                      label: catev.label
                    }))
                }
              />
            </FormControl>
          </Grid>
          <Grid item={true} xs={4}>
            <FormControl className={classes.formControl}>
              <Autocomplete
                value={
                  (newLicence.fede &&
                    fedeDetails.catev.find((catev: ICategory) => catev.value === newLicence.catevCX)) ||
                  null
                }
                getOptionLabel={option => option.label}
                getOptionSelected={(option, target) => option.value === target.value}
                autoComplete={true}
                autoSelect={true}
                autoHighlight={true}
                renderInput={params => <TextField {...params} label="Catégorie CX" variant="standard" />}
                onChange={(event: any, target: string | any) => {
                  setNewLicence(oldValues => ({
                    ...oldValues,
                    catevCX: target ? target.value : ''
                  }));
                }}
                options={
                  newLicence.fede &&
                  fedeDetails.catev
                    .filter(catev => catev.competitionTypes.includes(CompetitionEntityCompetitionTypeEnum.CX))
                    .map((catev: ICategory) => ({
                      value: catev.value,
                      label: catev.label
                    }))
                }
                style={{ width: '87%' }}
              />
            </FormControl>
          </Grid>

          <Grid item={true} xs={2}>
            <FormControl className={classes.formControl} error={validation.dept}>
              <TextField
                required={true}
                error={validation.dept}
                id="department"
                label="Département"
                type="number"
                margin="none"
                value={newLicence.dept}
                onBlur={e => {
                  if (parseInt(e.target.value) < 1 || parseInt(e.target.value) > 99) {
                    setNewLicence({ ...newLicence, dept: '' });
                    setValidation({ dept: true });
                    return;
                  }
                  setValidation({ dept: false });
                }}
                onChange={e => {
                  setNewLicence({ ...newLicence, dept: e.target.value });
                }}
              />
              <FormHelperText id="component-error-text" hidden={!validation.dept}>
                Veuillez saisir un département dont la valeur est entre 01 et 99.
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item={true} xs={10}>
            {newLicence.fede && newLicence.fede !== FedeEnum.NL && (
              <ClubSelect
                helperText={
                  newLicence.fede === FedeEnum.UFOLEP || newLicence.fede === FedeEnum.FFC
                    ? 'En majuscule, ne pas utiliser de caractères accentués'
                    : 'Première lettre du club en majuscule, puis le reste en minuscule (Ex: Jean-Paul)'
                }
                isError={validation.club}
                dept={newLicence.dept}
                fede={newLicence.fede}
                onSelectClubName={value => {
                  setNewLicence({ ...newLicence, club: value });
                }}
                defaultChosenClub={{ value: null, label: newLicence.club } as IOptionType}
              />
            )}
          </Grid>
        </Grid>
      )}
      <Grid style={{ marginTop: '2em' }} container={true} item={true} xs={12}>
        <TextareaAutosize
          minRows={5}
          defaultValue=""
          value={newLicence?.comment}
          style={{ width: '90%' }}
          onChange={evt => {
            setNewLicence({ ...newLicence, comment: evt.target.value });
          }}
          placeholder={'Commentaires'}
        />
      </Grid>
      {newLicence.lastChanged && (
        <div>
          Dernière modification réalisée le {toMMDDYYYY(newLicence?.lastChanged)} à {toTime(newLicence?.lastChanged)}{' '}
          par {newLicence?.author}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          marginTop: 24
        }}
      >
        <Grid item={true} xs={6}>
          <Button
            variant="contained"
            color="secondary"
            className={classes.button}
            onClick={() => {
              props.history.goBack();
            }}
          >
            Retour
          </Button>
        </Grid>
        <Grid item={true} xs={6}>
          <Button variant="contained" color="primary" className={classes.button} onClick={onSubmit}>
            Sauvegarder
          </Button>
        </Grid>
      </div>
    </div>
  );
};

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(LicencesPage as any) as any;
