import { default as React, useContext, useEffect, useRef, useState } from 'react';
import {
  CompetitionEntity as Competition,
  CompetitionEntityCompetitionTypeEnum,
  LicenceEntity as Licence,
  RaceCreate,
  RaceRow
} from '../../sdk/models';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import AutocompleteInput from '../../components/AutocompleteInput';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { CircularProgress, createStyles, InputLabel, Theme } from '@material-ui/core';
import { apiRaces } from '../../util/api';
import { NotificationContext } from '../../components/CadSnackbar';
import { filterLicences } from '../common/filters';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { FEDERATIONS } from '../common/shared-entities';
import RefreshIcon from '@material-ui/icons/Refresh';
import { ConfirmDialog } from '../../util';
import FormControl from '@material-ui/core/FormControl';
import ForwardIcon from '@material-ui/icons/Forward';

const create = async (newRace: RaceCreate) => {
  await apiRaces.engage({ raceCreate: newRace });
};

const formStyles = makeStyles((theme: Theme) =>
  createStyles({
    field: {
      marginLeft: 10,
      marginRight: 10
    },
    form: {
      backgroundColor: theme.palette.common.white,
      paddingBottom: 9,
      paddingLeft: 10
    }
  })
);

interface ICategory {
  label: string;
  value: string;
}

interface IForm {
  licence: null | {
    id: number;
    name: string;
    firstName: string;
    catev: string;
    catea: string;
    club: string;
    fede: string;
  };
  riderNumber: string;
  catev: string;
}

const EMPTY_FORM: IForm = { licence: null, riderNumber: '', catev: '' };
export const CreationForm = ({
  competition,
  race,
  onSuccess,
  rows,
  saisieResultat
}: {
  competition: Competition;
  race: string;
  onSuccess: (race: IForm) => void;
  rows: RaceRow[];
  saisieResultat: boolean;
}) => {
  const selectRef = useRef(null);
  const dossardSelectRef = useRef(null);
  const [form, setForm] = useState<IForm>(EMPTY_FORM);
  const [, setNotification] = useContext(NotificationContext);
  const [ranking, setRanking] = useState(0);
  const [showSablier, setShowSablier] = React.useState(false);
  const [open, openDialog] = React.useState(false);

  useEffect(() => {
    setRanking(rows.length + 1);
  });
  const onError = (message: string) =>
    setNotification({
      message: !message ? 'une erreur technique est survenue' : message,
      open: true,
      type: 'error'
    });
  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const refresh = async () => {
    try {
      setShowSablier(true);
      onSuccess(form);
    } finally {
      setShowSablier(false);
    }
    selectRef && selectRef.current && selectRef.current.focus();
  };

  const confirmAndSubmit = async () => {
    if (!form.riderNumber || !form.catev || !form.licence) {
      setNotification({
        message: `Merci de saisir un coureur, un numéro de dossard et une catégorie `,
        open: true,
        type: 'error'
      });
      return;
    }
    if (form.licence.fede !== competition.fede) openDialog(true);
    else submit();
  };

  const submit = async () => {
    try {
      const dto: RaceCreate = {
        licenceId: form.licence && form.licence.id,
        raceCode: race,
        ...(saisieResultat ? { riderNumber: ranking } : { riderNumber: parseInt(form.riderNumber) }),
        catev: form.catev,
        catea: form.licence.catea,
        club: form.licence.club,
        competitionId: competition.id,
        ...(saisieResultat ? { rankingScratch: ranking } : null)
      };
      setShowSablier(true);
      await create(dto);
      setRanking(ranking + 1);
      setNotification({
        message: `Le coureur ${form.licence.name} ${form.licence.firstName} a bien été enregistré sous le dossard ${form.riderNumber}`,
        open: true,
        type: 'success'
      });
      onSuccess(form);
      setForm(EMPTY_FORM);
    } catch (e) {
      if (e.json) {
        const { message } = await e.json();
        onError(message);
      } else {
        console.error(e);
        onError('Une erreur est survenue');
      }
    } finally {
      setShowSablier(false);
    }
    selectRef && selectRef.current && selectRef.current.focus();
  };
  const displayCategory = () => {
    if (!competition) return '';
    switch (competition.competitionType) {
      case CompetitionEntityCompetitionTypeEnum.AUTRE:
        return 'Caté.';
      case CompetitionEntityCompetitionTypeEnum.ROUTE:
        return 'Caté. Route';
      case CompetitionEntityCompetitionTypeEnum.VTT:
        return 'Caté. VTT';
      case CompetitionEntityCompetitionTypeEnum.CX:
        return 'Caté. CX';
      default:
        return 'Catégorie';
    }
  };
  const onRiderChange = (licence: Licence) => {
    licence && dossardSelectRef && dossardSelectRef.current && dossardSelectRef.current.focus();
    setForm({
      ...form,
      ...(saisieResultat ? { riderNumber: ranking.toString() } : { riderNumber: '' }),
      licence,
      catev:
        competition && licence && competition.fede.toUpperCase() === licence.fede.toUpperCase() ? licence.catev : ''
    });
  };

  const classes = formStyles({});
  let catecolor = race && form && !race.includes(form.catev) ? 'red' : 'black';

  return (
    <Grid container={true} alignItems="flex-end" className={classes.form}>
      {showSablier && (
        <div
          style={{
            position: 'fixed',
            display: 'block',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            cursor: 'pointer'
          }}
        >
          <div style={{ position: 'absolute', top: '40%', left: '40%' }}>
            <CircularProgress color="primary" />
          </div>
        </div>
      )}
      <ConfirmDialog
        title={'Attention'}
        question={
          'Vous souhaitez engager un coureur avec sa licence ' +
          (form && form.licence && form.licence.fede) +
          ", avez-vous bien vérifié qu'il ne possède pas aussi une licence " +
          (competition && competition.fede) +
          ' ?'
        }
        open={open}
        confirmMessage={"Oui L'Engager"}
        cancelMessage={'Non je ne suis pas sûr'}
        handleClose={() => openDialog(false)}
        handleOk={() => {
          openDialog(false);
          submit();
        }}
      />
      <Grid item={true}>
        <Typography variant="h5" style={{ marginRight: 20 }}>
          Saisir coureur <ForwardIcon style={{ verticalAlign: 'middle' }} />
        </Typography>
      </Grid>
      <Grid item={true} style={{ zIndex: 20, marginTop: 5 }}>
        <AutocompleteInput
          selectBox={selectRef}
          style={{ width: '650px' }}
          selection={form.licence}
          onChangeSelection={onRiderChange}
          placeholder="NOM Prénom Fede NuméroLicence"
          feedDataAndRenderer={(inputValue: string) =>
            filterLicences(inputValue, competition.competitionType, competition.fede)
          }
        />
      </Grid>
      <Grid item={true}>
        <TextField
          label="Dossard"
          inputRef={dossardSelectRef}
          value={saisieResultat ? ranking : form.riderNumber}
          disabled={saisieResultat}
          className={classes.field}
          style={{ width: '100px', fontSize: 15 }}
          onChange={e => setForm({ ...form, riderNumber: e.target.value })}
          inputProps={{
            onKeyPress: e => e.key === 'Enter' && confirmAndSubmit(),
            style: { textAlign: 'center' }
          }}
        />
      </Grid>
      <Grid item={true}>
        <FormControl>
          <InputLabel style={{ fontSize: 15 }} htmlFor="age-native-simple">
            {displayCategory()}
          </InputLabel>
          <Select
            value={form.catev as string}
            style={{ color: catecolor, minWidth: '100px' }}
            inputProps={{
              name: 'Catégorie',
              id: 'age-native-simple'
            }}
            onChange={e => {
              setForm({ ...form, catev: e.target.value as string });
            }}
          >
            {competition &&
              competition.fede &&
              FEDERATIONS[competition.fede].catev.map((value: ICategory, index: number) => (
                <MenuItem key={index} value={value.value}>
                  {value.label}
                </MenuItem>
              ))}
            {race?.split('/')?.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
            ))
          </Select>
        </FormControl>
      </Grid>
      <Grid item={true}>
        <Button
          title={'Ajouter ce coureur'}
          variant="contained"
          color="primary"
          style={{ verticalAlign: 'center', marginLeft: 10 }}
          onClick={confirmAndSubmit}
        >
          Ajouter
        </Button>
        <Button style={{ marginLeft: 10 }} title={'Rafraichir la liste'}>
          <RefreshIcon onClick={refresh} width={30} height={30} htmlColor={'#000000'} />
        </Button>
      </Grid>
      <Grid item={true} style={{ marginLeft: 'auto' }}>
        <Typography style={{ marginRight: 10, textAlign: 'right' }}>
          Total : <b>{rows.length}</b> Engagé(s)
        </Typography>
      </Grid>
    </Grid>
  );
};
