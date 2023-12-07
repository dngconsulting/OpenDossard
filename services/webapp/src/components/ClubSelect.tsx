import React, { HTMLAttributes, useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import TextField, { BaseTextFieldProps } from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import { ControlProps } from 'react-select/src/components/Control';
import { MenuProps } from 'react-select/src/components/Menu';
import { ValueType } from 'react-select/src/types';
import { apiClubs } from '../util/api';
import { ClubRow, FedeEnum } from '../sdk/models';
import { Button, FormControl, FormHelperText } from '@material-ui/core';

export interface IOptionType {
  label: string;
  value: number;
}

interface IClubSelect {
  dept: string;
  helperText: string;
  onSelectClubName?: (value: string) => void;
  onSelectClubId?: (value: number) => void;
  defaultChosenClub: IOptionType;
  fede: FedeEnum;
  isError: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      width: '90%',
      marginRight: '50px',
      marginTop: '0px',
      zIndex: 1
    },
    input: {
      display: 'flex',
      padding: 0,
      height: 'auto'
    },
    placeholder: {
      position: 'absolute',
      left: 2,
      bottom: 6,
      fontSize: 16
    },
    paper: {
      position: 'absolute',
      zIndex: 1,
      marginTop: theme.spacing(1),
      left: 0,
      right: 0
    }
  })
);

type InputComponentProps = Pick<BaseTextFieldProps, 'inputRef'> & HTMLAttributes<HTMLDivElement>;

function inputComponent({ inputRef, ...props }: InputComponentProps) {
  return <div ref={inputRef} {...props} />;
}

function Control(props: ControlProps<IOptionType>) {
  const {
    children,
    innerProps,
    innerRef,
    selectProps: { classes, TextFieldProps }
  } = props;

  return (
    <TextField
      fullWidth={true}
      InputProps={{
        inputComponent,
        inputProps: {
          className: classes.input,
          ref: innerRef,
          children,
          ...innerProps
        }
      }}
      {...TextFieldProps}
    />
  );
}

function Menu(props: MenuProps<IOptionType>) {
  return (
    <Paper square={true} className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

const components = {
  Control,
  Menu
};

// TODO All this code would have been better with a CreateableSelect supporting getOptionLabel and getOptionValue
export default function ClubSelect({
  dept,
  onSelectClubId,
  onSelectClubName,
  defaultChosenClub,
  fede,
  helperText,
  isError
}: IClubSelect) {
  // @ts-ignore
  const classes = useStyles();
  const theme = useTheme();
  const [selectedClub, setSelectedClub] = React.useState<ValueType<IOptionType>>(null);
  const [clubsOptionType, setClubsOptionType] = useState<IOptionType[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    let club: IOptionType = null;

    const lclubs = await apiClubs.getClubsByFede({ fede });
    setClubs(lclubs);

    const loptionType = lclubs.map((clubOption: ClubRow) => ({
      value: clubOption.id,
      label: clubOption.longName + (clubOption.dept ? ' (' + clubOption.dept + ')' : '')
    }));
    setClubsOptionType(loptionType);
    // empty chosen club should display "blank" item the list
    // empty chosen club should display "blank" item the list
    if (defaultChosenClub.label === '' || defaultChosenClub.label === null) {
      setSelectedClub(null);
      return;
    }
    if (defaultChosenClub.value !== null) {
      setSelectedClub(loptionType.find(option => option.value === defaultChosenClub.value));
    } else setSelectedClub(loptionType.filter(club => club.label.includes(defaultChosenClub.label))[0]);
  };

  useEffect(() => {
    fetchData();
  }, [fede]);

  const handleChangeSingle = (value: ValueType<IOptionType>) => {
    setSelectedClub(value);
    const selected = value as IOptionType;
    if (selected && selected.label) {
      onSelectClubName
        ? onSelectClubName(clubs.filter(club => club.id === selected.value)[0].longName)
        : onSelectClubId(clubs.filter(club => club.id === selected.value)[0].id);
    } else if (value === null) {
      onSelectClubName ? onSelectClubName('') : onSelectClubId(null);
    }
  };

  const handleCreate = async (inputValue: string) => {
    setLoading(true);
    const newClub = await apiClubs.createClub({
      clubEntity: { id: 0, shortName: null, dept, longName: inputValue, fede }
    });
    const newClubOption = {
      value: newClub.id,
      label: newClub.longName + (dept ? ' (' + dept + ')' : '')
    };
    setClubsOptionType(prevState => prevState.concat([newClubOption]));
    setSelectedClub(newClubOption);
    onSelectClubName ? onSelectClubName(newClub.longName) : onSelectClubId(newClub.id);
    setLoading(false);
  };

  const selectStyles = {
    input: (base: any) => ({
      ...base,
      color: theme.palette.text.primary,
      '& input': {
        font: 'inherit'
      }
    })
  };

  return (
    <FormControl className={classes.formControl}>
      <CreatableSelect
        isClearable={true}
        placeholder="Rechercher ou Créer un nouveau Club"
        options={clubsOptionType}
        value={selectedClub}
        onChange={handleChangeSingle}
        onCreateOption={handleCreate}
        noOptionsMessage={() => 'Aucune valeur correspondante'}
        isDisabled={isLoading}
        isLoading={isLoading}
        components={components}
        classes={classes}
        styles={selectStyles}
        inputId="react-select-single"
        TextFieldProps={{
          helperText: helperText,
          label: 'Club',
          InputLabelProps: {
            required: true,
            error: isError,
            htmlFor: 'react-select-single',
            shrink: true
          }
        }}
        formatCreateLabel={(value: string) => (
          <div
            style={{
              flex: 1,
              flexDirection: 'row',
              padding: 5,
              backgroundColor: 'transparent'
            }}
          >
            <div style={{ alignSelf: 'flex-start', paddingBottom: 10 }}>
              Le club "<i>{value}</i>" n'existe pas
            </div>
            <Button style={{ alignSelf: 'flex-end' }} variant="contained" color="primary">
              Créer ce club
            </Button>
          </div>
        )}
      />
      {isError && !selectedClub && <FormHelperText error={true}>Le club doit être renseigné</FormHelperText>}
    </FormControl>
  );
}
