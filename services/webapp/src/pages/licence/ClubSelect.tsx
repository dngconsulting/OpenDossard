import React, {CSSProperties, HTMLAttributes, useEffect, useState} from 'react';
import Select from 'react-select';
import {createStyles, makeStyles, Theme, useTheme} from '@material-ui/core/styles';
import TextField, {BaseTextFieldProps} from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import {ControlProps} from 'react-select/src/components/Control';
import {MenuProps} from 'react-select/src/components/Menu';
import {ValueType} from 'react-select/src/types';
import {apiClubs} from '../../util/api';

interface IOptionType {
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

export default function ClubSelect() {
    // @ts-ignore
    const classes = useStyles();
    const theme = useTheme();
    const [selectedClub, setSelectedClub] = React.useState<ValueType<IOptionType>>(null);
    const [clubs, setClubs] = useState<IOptionType[]>([]);

    const fetchData = async ()  => {
        return await apiClubs.getAllClubs();
    };
    useEffect(()=>{
        fetchData().then(res => setClubs(res.map(option => {
            let label = option.longName;
            if(option.shortName){
                label += " ("+option.shortName+")"
            }
            if(option.dept){
                label += " ["+option.dept+"]"
            }
            return (
            {
            value: option.id,
            label,
        })}))).catch(err=>console.log(err));
    },[]);

    const handleChangeSingle = (value: ValueType<IOptionType>) => {
        setSelectedClub(value);
    };

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
                <Select
                    classes={classes}
                    styles={selectStyles}
                    inputId="react-select-single"
                    TextFieldProps={{
                        label: 'Club',
                        InputLabelProps: {
                            htmlFor: 'react-select-single',
                            shrink: true,
                        },
                    }}
                    placeholder="Rechercher un club"
                    options={clubs}
                    components={components}
                    value={selectedClub}
                    onChange={handleChangeSingle}
                />
    );
}
