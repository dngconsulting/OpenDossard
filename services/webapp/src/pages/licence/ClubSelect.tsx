import React, {CSSProperties, HTMLAttributes, useEffect} from 'react';
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
    value: string;
}

const suggestions: IOptionType[] = [
    { label: 'Association Cycliste Le Fousseret' },
    { label: 'Team Exper\'Cycle' },
    { label: 'Cyclo-Club Castanéen' },
    { label: 'Cercle Athlétique Castelsarrasinois Cyclisme' },
    { label: 'Sorèze Vélo-Club' },
    { label: 'Vélo-Club CPRS Pins-Justaret/Vilatte' },
    { label: 'Vélo-Sport Castrais' },
    { label: 'Club Cycliste Le Boulou' },
    { label: 'TOAC Cyclisme' },
    { label: 'Tolosa Cycling Team' },
    { label: 'Saint-Gaudens Cyclisme Comminges' },
].map(suggestion => ({
    value: suggestion.label,
    label: suggestion.label,
}));

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
    const [single, setSingle] = React.useState<ValueType<IOptionType>>(null);

    const fetchData = async ()  => {
        return await apiClubs.getAllClubs();
    };
    useEffect(()=>{
        fetchData().then(res => console.log('clubs :::: ' + JSON.stringify(res)));
    },['loading'])

    const handleChangeSingle = (value: ValueType<IOptionType>) => {
        setSingle(value);
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
                    options={suggestions}
                    components={components}
                    value={single}
                    onChange={handleChangeSingle}
                />
    );
}
