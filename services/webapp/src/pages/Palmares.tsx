import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import AutocompleteInput from '../components/AutocompleteInput';
import { filterLicences } from './common/filters';
import { CompetitionEntityCompetitionTypeEnum, LicenceEntity as Licence, RaceRow } from '../sdk/models';
import 'react-vertical-timeline-component/style.min.css';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import './palmares.css';
import { apiLicences, apiRaces } from '../util/api';
import _ from 'lodash';
import moment from 'moment';
import { NotificationContext } from '../components/CadSnackbar';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

interface IStatsPageProps {
  items: any[];
  classes: any;
  match: any;
  history: any;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1)
    }
  })
);

const PalmaresPage = (props: IStatsPageProps) => {
  const licenceId = props.match.params.id;
  const [licence, setLicence] = useState<Licence>(null);
  const [rows, setRows] = useState<RaceRow[]>(null);
  const [, setNotification] = useContext(NotificationContext);
  const selectRef = useRef(null);

  const onRiderChange = async (select: Licence) => {
    if (!select) {
      setLicence(null);
      setRows(null);
      return;
    }
    props.history.push({
      pathname: '/palmares/' + select.id
    });
  };

  const licenceWithLabel = (lic: Licence) => {
    const textToDisplay = lic.name + ' ' + lic.firstName + ' ' + (lic.licenceNumber ? lic.licenceNumber : '');
    return {
      ...lic,
      label: (
        <div style={{ lineHeight: 'normal', position: 'relative', width: '450px' }}>
          <div style={{ fontSize: 'medium' }}>{textToDisplay.toUpperCase()}</div>
          <span style={{ fontSize: 'small' }}>{lic.club}</span>
          <div style={{ position: 'absolute', right: 0, bottom: 0 }}>
            {lic.catev} {lic.catea} {lic.fede}
          </div>
        </div>
      )
    };
  };

  useEffect(() => {
    if (!isNaN(parseInt(licenceId))) {
      async function asyncFun() {
        const lic = await apiLicences.get({ id: licenceId });
        if (!lic) {
          return;
        }
        setLicence(licenceWithLabel(lic));
        const lraceRows: RaceRow[] = await apiRaces.getPalmares({ id: licenceId });
        if (lraceRows.length === 0) {
          setNotification({
            message: `Aucun palmarès disponible pour ce coureur`,
            type: 'error',
            open: true
          });
        }
        setRows(_.orderBy(lraceRows, ['competitionDate'], ['desc']));
      }
      asyncFun();
    }
  }, [licenceId]);

  const getClassement = (rr: RaceRow) => {
    if (rr.rankingScratch != null) {
      return rr.rankingScratch;
    } else if (rr.comment !== null) {
      return rr.comment;
    } else return 'NC';
  };
  const getIeme = (rr: RaceRow) => {
    if (rr.rankingScratch) {
      if (rr.rankingScratch > 1) return 'ème';
      else return 'er';
    }
    return '';
  };

  function linkToCompetition({ competitionId, raceCode }: RaceRow) {
    props.history.push({
      pathname: '/competition/' + competitionId + '/results/view',
      hash: raceCode,
      search: 'palmares=' + licenceId
    });
  }

  const classes = useStyles();
  return (
    <div style={{ flex: 1, padding: 10, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', verticalAlign: 'center', justifyContent: 'center' }}>
        <span style={{ marginRight: 10 }}>Coureur :</span>
        <AutocompleteInput
          selectBox={selectRef}
          style={{ width: '650px' }}
          selection={licence}
          onChangeSelection={onRiderChange}
          placeholder="Nom Prénom Fede NuméroLicence"
          feedDataAndRenderer={(param: string) => filterLicences(param, CompetitionEntityCompetitionTypeEnum.ROUTE)}
        />
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
      </div>
      <div>
        {rows && (
          <VerticalTimeline className={'width500'} layout={'1-column'}>
            {rows.map(raceRow => (
              <VerticalTimelineElement
                key={raceRow.id}
                style={{ width: 450, height: 120 }}
                className="vertical-timeline-element--education"
                dateClassName={'palmaresDate'}
                contentArrowStyle={{ borderRight: '15px solid white' }}
                date={moment(raceRow.competitionDate)
                  .locale('fr')
                  .format('dddd DD MMM YYYY')}
                iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
                icon={<EmojiEventsIcon />}
                onTimelineElementClick={() => linkToCompetition(raceRow)}
              >
                <h4 className="vertical-timeline-element-title">{raceRow.name}</h4>
                <h5 className="vertical-timeline-element-subtitle">Course {raceRow.raceCode}</h5>
                <p style={{ margin: 0 }}>
                  Classement par catégorie : <strong>{getClassement(raceRow) + getIeme(raceRow)}</strong>
                  <br />
                  <a>Consulter classement complet</a>
                </p>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        )}
      </div>
    </div>
  );
};

export default PalmaresPage;
