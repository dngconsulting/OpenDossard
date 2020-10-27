import React, { HTMLAttributes, useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import TextField, { BaseTextFieldProps } from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import { ControlProps } from 'react-select/src/components/Control';
import { MenuProps } from 'react-select/src/components/Menu';
import { ValueType } from 'react-select/src/types';
import { apiClubs } from '../../util/api';
import { FedeEnum, ClubRow } from '../../sdk/models';
import { Button, FormControl, FormHelperText } from "@material-ui/core";

export interface IOptionType {
    label: string;
    value: number;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({

        formControl: {
            margin: 8,
            width: '350px',
            marginRight: '50px',
            marginTop: '0px',
            zIndex: 1,

        },
        input: {
            display: 'flex',
            padding: 0,
            height: 'auto',
        },
        placeholder: {
            position: 'absolute',
            left: 2,
            bottom: 6,
            fontSize: 16,
        },
        paper: {
            position: 'absolute',
            zIndex: 2,
            marginTop: theme.spacing(1),
            left: 0,
            right: 0,
        },
    }),
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
        selectProps: { classes, TextFieldProps },
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
                    ...innerProps,
                },
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
export default function ClubSelectRace({ dept, onSelect, chosenClub, fede, clubError }: { dept: string, onSelect: (value: number) => void, chosenClub: IOptionType, fede: FedeEnum, clubError: boolean }) {
    // @ts-ignore
    const classes = useStyles();
    const theme = useTheme();
    const [selectedClub, setSelectedClub] = React.useState<ValueType<IOptionType>>(null);
    const [clubsOptionType, setClubsOptionType] = useState<IOptionType[]>([]);
    const [clubs, setClubs] = useState<ClubRow[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false)


    const fetchData = async () => {
        const lclubs = await apiClubs.getClubsByFede({ fede: fede });
        setClubs(lclubs)
        const loptionType = lclubs.map((club: ClubRow) => ({
            value: club.id,
            label: club.longName + (club.dept ? ' (' + club.dept + ')' : '')
        }))
        setClubsOptionType(loptionType);
        // empty chosen club should display "blank" item the list
        if (chosenClub.label === '' || chosenClub.label === null) {
            setSelectedClub(null);
            onSelect(null);
            return;
        }
        setSelectedClub(loptionType.filter(club => club.label.includes(chosenClub.label))[0])
    };

    const onInitData = async () => {
        if(chosenClub.value !==null){
        const id=chosenClub.value;
        const initClub= await apiClubs.getClubsById({id});
        chosenClub.label=initClub.longName;
        }
      
       
    }
   useEffect(() => {
        onInitData();   
    }, []);

    useEffect(() => {
        
        fetchData();
    }, [fede]);

    const handleChangeSingle = (value: ValueType<IOptionType>) => {
        
        setSelectedClub(value);
        const selected = value as IOptionType;
        if (selected && selected.label)
            onSelect(clubs.filter(club => club.id === selected.value)[0].id);

    };
    const handleCreate = async (inputValue: string) => {
        setLoading(true)
        const newClub = await apiClubs.createClub({ clubEntity: { id: 0, shortName: null, dept: dept, longName: inputValue, fede: fede } })
        const newClubOption = { value: newClub.id, label: newClub.longName + (dept ? ' (' + dept + ')' : '') }
        setClubsOptionType(prevState =>
            prevState.concat([newClubOption])
        )
        setSelectedClub(newClubOption)
        onSelect(newClub.id)
        setLoading(false)
    }
    const selectStyles = {

        input: (base: any) => ({
            ...base,
            color: theme.palette.text.primary,
            '& input': {
                font: 'inherit',
            },
        }),
    };


    return (
        <FormControl className={classes.formControl}>
            <CreatableSelect

                isClearable={true}
                classes={classes}
                formatCreateLabel={(value: string) => <div style={{ flex: 1, flexDirection: 'row', padding: 5, backgroundColor: 'transparent' }}><div style={{ alignSelf: 'flex-start', paddingBottom: 10 }}>Le club "<i>{value}</i>" n'existe pas</div><Button style={{ alignSelf: 'flex-end' }} variant="contained" color="primary">Créer ce club</Button></div>}
                isDisabled={isLoading}
                isLoading={isLoading}
                onCreateOption={handleCreate}
                styles={selectStyles}
                inputId="react-select-single"
                TextFieldProps={{
                    error: (clubError && !selectedClub),
                    label: 'Club *',
                    InputLabelProps: {
                        htmlFor: 'react-select-single',
                        shrink: true,
                    },
                }}
                placeholder="Rechercher ou Créer un nouveau Club"
                options={clubsOptionType}
                noOptionsMessage={() => 'Aucune valeur correspondante'}
                components={components}
                value={selectedClub}
                onChange={handleChangeSingle}
            />
            {(clubError && !selectedClub && <FormHelperText error>Le club doit être renseigné</FormHelperText>)}
        </FormControl>
    );
}