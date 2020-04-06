import React, {CSSProperties, HTMLAttributes, useEffect, useState} from 'react';
import CreatableSelect from 'react-select/creatable';
import {createStyles, makeStyles, Theme, useTheme} from '@material-ui/core/styles';
import TextField, {BaseTextFieldProps} from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import {ControlProps} from 'react-select/src/components/Control';
import {MenuProps} from 'react-select/src/components/Menu';
import {ValueType} from 'react-select/src/types';
import {apiClubs} from '../../util/api';
import {ClubRow} from '../../sdk/models';

export interface IOptionType {
    label: string;
    value: number;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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
            zIndex: 1,
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


export default function ClubSelect({onSelect, chosenClub} : {onSelect : (value:string)=>void, chosenClub : IOptionType}) {
    // @ts-ignore
    const classes = useStyles();
    const theme = useTheme();
    const [selectedClub, setSelectedClub] = React.useState<ValueType<IOptionType>>(null);
    const [clubs, setClubs] = useState<IOptionType[]>([]);
    const [isLoading,setLoading] = useState<boolean>(false)

    const fetchData = async ()  => {
        const lclubs = await apiClubs.getAllClubs();
        const loptionType = lclubs.map((option: ClubRow) => ({
            value: option.id,
            label:option.longName
        }))
        setClubs(loptionType);
    };
    useEffect(()=>{
        fetchData();
    },[]);

    useEffect(()=>{
        setSelectedClub(chosenClub);
    },[chosenClub]);

    const handleChangeSingle = (value: ValueType<IOptionType>) => {
        setSelectedClub(value);
        const selected = value as IOptionType;
        if (selected && selected.label)
            onSelect(selected.label)
    };
    const handleCreate = async (inputValue:string) => {
        setLoading(true)
        const newClub = await apiClubs.createClub({clubEntity:{id:0,shortName:null,dept:null,longName:inputValue}})
        const newClubOption = {value:newClub.id,label:newClub.longName}
        setClubs(prevState =>
            prevState.concat([newClubOption])
        )
        setSelectedClub(newClubOption)
        onSelect(inputValue)
        setLoading(false)
    }
    const selectStyles = {
        input: (base: CSSProperties) => ({
            ...base,
            color: theme.palette.text.primary,
            '& input': {
                font: 'inherit',
            },
        }),
    };

    return (
                <CreatableSelect
                    isClearable={true}
                    classes={classes}
                    formatCreateLabel={(value:string)=>'Créer le club "' + value + '" ?'}
                    isDisabled={isLoading}
                    isLoading={isLoading}
                    onCreateOption={handleCreate}
                    styles={selectStyles}
                    inputId="react-select-single"
                    TextFieldProps={{
                        label: 'Club',
                        InputLabelProps: {
                            htmlFor: 'react-select-single',
                            shrink: true,
                        },
                    }}
                    placeholder="Rechercher ou Créer un nouveau Club"
                    options={clubs}
                    noOptionsMessage={()=>'Aucune valeur correspondante'}
                    components={components}
                    value={selectedClub}
                    onChange={handleChangeSingle}
                />
    );
}
