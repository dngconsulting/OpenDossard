import { Button, FormControl, FormControlLabel, Radio, TextField, useMediaQuery } from '@material-ui/core';
import Popover from '@material-ui/core/Popover';
import { Add, ArrowDownward } from '@material-ui/icons';
import moment from 'moment';
import Select, { components } from 'react-select';
import _ from 'lodash';
import { FEDERATIONS } from '../pages/common/shared-entities';
import { CompetitionType } from '../sdk/models/CompetitionType';
import { LOCATION, LocationType } from '../util/LOCATION';
import React, { useContext, useEffect, useState } from 'react';
import { CompetitionEntity, CompetitionFilter, Departement, RaceRow } from '../sdk';
import { apiRaces } from '../util/api';
import { NotificationContext } from './CadSnackbar';
import { fetchCompetitions } from '../services/competition';
import { BREAK_POINT_MOBILE_TABLET, cadtheme } from '../theme/theme';
import { useTheme } from '@material-ui/core/styles';

const allFedes = () => {
  return Object.keys(FEDERATIONS)
    .filter(f => f != 'NL')
    .map(fede => FEDERATIONS[fede].name);
};
const CHIPS_LIMIT = 1;

export const MoreChips = ({ title, chips }: { title: string; chips: any }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'popover' : undefined;

  return (
    <div
      style={{ zIndex: 9999 }}
      onClick={event => {
        event.nativeEvent.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
      }}
    >
      <Button
        style={{
          zIndex: 9000,
          overflow: 'visible',
          marginLeft: 5,
          marginRight: 5,
          paddingTop: 3,
          paddingBottom: 3
        }}
        aria-describedby={id}
        variant="contained"
        color="primary"
        onClick={handleClick}
      >
        {title}
        <ArrowDownward style={{ height: 20, width: 20, marginLeft: 5 }} />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: 5,
            border: 1,
            borderStyle: 'solid',
            borderColor: cadtheme.palette.grey.A100
          }}
        >
          {chips}
        </div>
      </Popover>
    </div>
  );
};
//@ts-ignore
const LimitedChipsContainer = ({ children, hasValue, getValue, ...props }) => {
  if (!hasValue) {
    return (
      // @ts-ignore
      <components.ValueContainer {...props}>{children}</components.ValueContainer>
    );
  }

  const [chips, otherChildren] = children;
  const overflowCounter = getValue().length;
  const displayChips = chips.slice(0, CHIPS_LIMIT);
  const otherChips = chips.slice(CHIPS_LIMIT, chips.length);

  return (
    // @ts-ignore
    <components.ValueContainer {...props}>
      {displayChips}
      {overflowCounter > CHIPS_LIMIT && <MoreChips title={`+${overflowCounter - CHIPS_LIMIT}`} chips={otherChips} />}
      {otherChildren}
    </components.ValueContainer>
  );
};

const defaultCompetitionFilter = {
  competitionTypes: ['ROUTE', 'CX', 'VTT'],
  fedes: ['FSGT'],
  depts: Array<Departement>(),
  displayFuture: true,
  displayPast: true
};
export const CompetitionFilterPanel = ({
  setData,
  history,
  refreshData,
  setRaceRows,
  setLoading
}: {
  history: any;
  setLoading: (b: boolean) => void;
  refreshData: boolean;
  setData: (data: CompetitionEntity[]) => void;
  setRaceRows: (raceRows: RaceRow[]) => void;
}) => {
  const [, setNotification] = useContext(NotificationContext);
  const [competitionFilter, setCompetitionFilter] = useState<Partial<CompetitionFilter>>(undefined);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(BREAK_POINT_MOBILE_TABLET));
  const fetchAllRaces = async () => {
    try {
      const results = await apiRaces.getRaces({
        competitionFilter
      });
      setRaceRows(results);
    } catch (ex) {
      setNotification({
        message: `Impossible de récupérer la liste des participations`,
        open: true,
        type: 'error'
      });
    }
  };
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        await fetchCompetitions({
          competitionFilter,
          setNotification,
          setData
        });
        await fetchAllRaces();
        localStorage.setItem('competitionFilter', JSON.stringify(competitionFilter));
      } finally {
        setLoading(false);
      }
    };
    if (
      competitionFilter &&
      ((competitionFilter.startDate && competitionFilter.endDate) ||
        (!competitionFilter.startDate && !competitionFilter.endDate))
    )
      initData();
  }, [competitionFilter]);
  useEffect(() => {
    try {
      const c = localStorage.getItem('competitionFilter');
      if (c) {
        const parsedCompFilter = JSON.parse(c);
        setCompetitionFilter(parsedCompFilter);
      } else {
        console.log('[LocalStorage] No competitionFilter in storage, lets create one');
        localStorage.setItem('competitionFilter', JSON.stringify(defaultCompetitionFilter));
        setCompetitionFilter(defaultCompetitionFilter);
      }
    } catch (error) {
      console.log('[LocalStorage] Parsing Error RESET competitionFilter !');
      localStorage.setItem('competitionFilter', JSON.stringify(defaultCompetitionFilter));
      setCompetitionFilter(defaultCompetitionFilter);
    }
  }, [refreshData]);
  if (!competitionFilter) return null;
  return (
    <>
      <div
        style={{
          justifyContent: 'center',
          alignItems: 'flex-end',
          display: isMobile ? 'block' : 'flex',
          marginTop: -5,
          paddingTop: 5,
          paddingBottom: 5,
          marginLeft: -5,
          marginRight: -5,
          backgroundColor: '#F5F5F5'
        }}
      >
        <TextField
          style={{ marginRight: 10, width: isMobile ? '100%' : '200px' }}
          id="date"
          value={
            competitionFilter.startDate
              ? moment(competitionFilter.startDate, 'MM/DD/YYYY').format(moment.HTML5_FMT.DATE)
              : ''
          }
          label="Date de début"
          type="date"
          onChange={dateChanged => {
            const d1 = moment(dateChanged.target.value, moment.HTML5_FMT.DATE)
              .locale('fr')
              .format('MM/DD/YYYY');
            if (d1.includes('Invalid date')) return;

            setCompetitionFilter({
              ...competitionFilter,
              startDate: d1
            });
          }}
          InputLabelProps={{
            shrink: true
          }}
        />
        <TextField
          style={{ marginRight: 10, width: isMobile ? '100%' : '200px' }}
          value={
            competitionFilter.endDate
              ? moment(competitionFilter.endDate, 'MM/DD/YYYY').format(moment.HTML5_FMT.DATE)
              : ''
          }
          id="date"
          label="Date de fin"
          type="date"
          onChange={dateChanged => {
            const d2 = moment(dateChanged.target.value, moment.HTML5_FMT.DATE)
              .locale('fr')
              .format('MM/DD/YYYY');
            if (d2.includes('Invalid date')) return;
            setCompetitionFilter({
              ...competitionFilter,
              endDate: d2
            });
          }}
          InputLabelProps={{
            shrink: true
          }}
        />
        <div
          style={{
            justifySelf: 'center',
            fontSize: 20,
            fontWeight: 'bolder',
            color: cadtheme.palette.primary.dark,
            marginLeft: 10,
            marginRight: 10,
            paddingTop: 10,
            marginTop: 'auto',
            marginBottom: 'auto'
          }}
        >
          OU
        </div>
        <FormControlLabel
          value="past"
          label="Epreuves passées"
          control={
            <Radio
              checked={competitionFilter.displayPast && !competitionFilter.displayFuture}
              onChange={(event, change) => {
                setCompetitionFilter({
                  ...competitionFilter,
                  startDate: undefined,
                  endDate: undefined,
                  displayFuture: false,
                  displayPast: true
                });
              }}
              value="past"
              name="radio-button-demo"
            />
          }
        />
        <FormControlLabel
          value="future"
          label="Epreuves à venir"
          control={
            <Radio
              checked={competitionFilter.displayFuture && !competitionFilter.displayPast}
              value="future"
              onChange={(event, change) => {
                setCompetitionFilter({
                  ...competitionFilter,
                  startDate: undefined,
                  endDate: undefined,
                  displayFuture: true,
                  displayPast: false
                });
              }}
              name="radio-button-demo"
            />
          }
        />
        <FormControlLabel
          value="all"
          label="Toutes les épreuves"
          control={
            <Radio
              checked={competitionFilter.displayFuture && competitionFilter.displayPast}
              onChange={(event, change) => {
                setCompetitionFilter({
                  ...competitionFilter,
                  startDate: undefined,
                  endDate: undefined,
                  displayFuture: true,
                  displayPast: true
                });
              }}
              value="all"
              name="radio-button-demo"
            />
          }
        />
      </div>
      <FormControl
        style={{
          display: isMobile ? 'contents' : 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e9e9e9',
          marginLeft: -5,
          marginRight: -5,
          height: 60
        }}
        component="fieldset"
      >
        <Select
          menuPlacement={'bottom'}
          menuPortalTarget={document.body}
          width={250}
          styles={{ container: () => ({ marginLeft: isMobile ? 0 : 10, width: '100%', marginRight: 10 }) }}
          defaultValue={
            _.isEmpty(competitionFilter.fedes)
              ? undefined
              : competitionFilter.fedes.map(c => {
                  return {
                    value: c,
                    label: c
                  };
                })
          }
          isMulti
          noOptionsMessage={m => m?.inputValue + " n'existe pas"}
          placeholder={'Toutes fédés'}
          options={allFedes()}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={selectedFedes => {
            const onlyValues = selectedFedes?.map((fede: { label: string; value: string }) => fede.value);
            setCompetitionFilter({
              ...competitionFilter,
              fedes: _.isEmpty(onlyValues) ? undefined : onlyValues
            });
          }}
        />
        <Select
          width={250}
          menuPlacement={'bottom'}
          menuPortalTarget={document.body}
          styles={{ container: () => ({ width: '100%', marginRight: 10 }) }}
          noOptionsMessage={m => m?.inputValue + " n'existe pas"}
          placeholder={'Toutes disciplines'}
          defaultValue={
            _.isEmpty(competitionFilter.competitionTypes)
              ? undefined
              : competitionFilter.competitionTypes.map(c => {
                  return {
                    value: c,
                    label: c
                  };
                })
          }
          isMulti
          options={Object.keys(CompetitionType).map(c => {
            return {
              value: c,
              label: c
            };
          })}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={(selectedCompetitionTypes: any) => {
            const onlyValues = selectedCompetitionTypes?.map((cp: { label: string; value: string }) => cp.value);
            setCompetitionFilter({
              ...competitionFilter,
              competitionTypes: _.isEmpty(onlyValues) ? undefined : onlyValues
            });
          }}
        />

        <Select
          menuPlacement={'bottom'}
          {...(!isMobile
            ? {
                styles: {
                  container: () => ({
                    width: '100%'
                  })
                }
              }
            : {})}
          noOptionsMessage={m => m?.inputValue + " n'existe pas"}
          placeholder={'Tous départements'}
          isMulti
          hideSelectedOptions={true}
          components={{
            ValueContainer: props => <LimitedChipsContainer {...props} />
          }}
          value={competitionFilter?.depts?.map(dept => ({
            value: dept.departmentCode,
            label: dept.departmentCode + '-' + dept.departmentName
          }))}
          options={LOCATION.map((l: LocationType) => {
            return {
              value: l.code,
              label: l.code + '-' + l.name
            };
          })}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={(deptsSelected: any) => {
            setCompetitionFilter({
              ...competitionFilter,
              depts: deptsSelected
                ? [
                    ...deptsSelected.map((d: any) => ({
                      departmentName: LOCATION.find(l => l.code === d.value).name,
                      departmentCode: d.value
                    }))
                  ]
                : []
            });
          }}
        />
        <Button
          style={{ alignItems: 'center', marginLeft: 10, marginTop: isMobile ? 10 : 0, minWidth: 200 }}
          variant={'contained'}
          color={'primary'}
          onClick={() => {
            history.push({
              pathname: '/competition/create',
              state: { title: 'Création épreuve' }
            });
          }}
        >
          <Add style={{ marginRight: 5 }} />
          CRÉER UNE EPREUVE
        </Button>
      </FormControl>
    </>
  );
};
