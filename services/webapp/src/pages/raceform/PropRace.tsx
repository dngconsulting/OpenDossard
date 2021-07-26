import { TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, createStyles, makeStyles, Theme, Tooltip, TableContainer } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import React, { useState, useEffect, useContext } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import { ButtonBase } from '@material-ui/core';
import { NotificationContext } from 'components/CadSnackbar';
import { CompetitionInfo } from 'sdk';

const useStyles = makeStyles(
    (theme: Theme) => createStyles({
        textField: {
            margin: 8,
            width: '200px',
            marginRight: '150px'
        },
        table: {
            margin: 50,
            marginRight: 'auto',
            marginLeft: 'auto',
            tableLayout: 'auto',
            width: '100%',
        },
    }),
);

interface IError {
    course: boolean,
    horaireEngagement: boolean,
    horaireDepart: boolean,
    info1: boolean,
    info2: boolean,
}

interface IRaceProps {
    infos: CompetitionInfo[],
    updateCompetitionInfos: (races: CompetitionInfo[]) => void,
}

const PropRace = (props: IRaceProps) => {
    const classes = useStyles();
    const errorMessage = 'Veuillez remplir l\'ensemble des champs obligatoires';

    const [, setNotification] = useContext(NotificationContext);
    const [tab, setTab]       = useState<CompetitionInfo[]>(props.infos);
    const [index, setIndex]   = useState<number>();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isHiddenForm, setIsHiddenForm] = useState<boolean>(true);
    const [error, setError]   = useState<IError>({
        course: false,
        horaireEngagement: false,
        horaireDepart: false,
        info1: false,
        info2: false,
    });
    const { register, handleSubmit, getValues, setValue } = useForm<CompetitionInfo>();

    const resetFormValues = ():void => {
        setValue("course", "");
        setValue("info1", "");
        setValue("info2", "");
        setValue("info3", "");
        setValue("horaireDepart", "");
        setValue("horaireEngagement", "");
    }

    const showEmptyFields = (data: CompetitionInfo): void=> {
        setError({
            course: !data.course,
            horaireEngagement: !data.horaireEngagement,
            horaireDepart: !data.horaireDepart,
            info1: !data.info1,
            info2: !data.info2,
        });
    }

    const onSubmit: SubmitHandler<CompetitionInfo> = (data: CompetitionInfo) => {
        showEmptyFields(data);

        if(data.course === "" || data.horaireEngagement === "" || data.horaireDepart === "" || data.info1 === "" ||
            data.info2 === "" ) {
            setNotification({
                message: errorMessage,
                open: true,
                type: 'error'
            });
        }
        else{
            props.infos.push(data);
            props.updateCompetitionInfos(props.infos);
            resetFormValues();
            setIsHiddenForm(true);
        }
    }

    const onEdit = (event: any):void => {
        const row = {...tab[event.currentTarget.value]};
        showEmptyFields(row);

        tab[event.currentTarget.value] = getValues(["course", "horaireEngagement", "horaireDepart", "info1", "info2", "info3"]);
        if(row.course === "" || row.horaireEngagement === "" || row.horaireDepart === "" || row.info1 === "" ||
            row.info2 === "") {
            setNotification({
                message: errorMessage,
                open: true,
                type: 'error'
            });
            if(row){
                tab[event.currentTarget.value].course = row.course;
                tab[event.currentTarget.value].horaireDepart = row.horaireDepart;
                tab[event.currentTarget.value].horaireEngagement = row.horaireEngagement;
                tab[event.currentTarget.value].info1 = row.info1;
                tab[event.currentTarget.value].info2 = row.info2;
                tab[event.currentTarget.value].info3 = row.info3;
            }
        }
        else{
            props.updateCompetitionInfos(tab)
            resetFormValues();
            setIsHiddenForm(true);
        }
    }
  
    const editTabRow = ((event: any): void => {
        setIsHiddenForm(false);
        setIsEditing(true);

        const tabInfo = tab[event.currentTarget.value];
        setValue("course", tabInfo.course);
        setValue("info1", tabInfo.info1);
        setValue("info2", tabInfo.info2);
        setValue("info3", tabInfo.info3);
        setValue("horaireDepart", tabInfo.horaireDepart);
        setValue("horaireEngagement", tabInfo.horaireEngagement);
        setIndex(event.currentTarget.value);
    })

    const deleteTabRow = ((event: any): void => {
        const raceIndex = event.currentTarget.value;
        props.infos.splice(raceIndex, 1);
        props.updateCompetitionInfos(props.infos);
    })

    const addTabRow = () => {
        setIsHiddenForm(false);
        setIsEditing(false);
        resetFormValues();
    }

    useEffect(() => {
        setTab(props.infos);
    }, [props.infos]);

    return (
        <div>
            <div hidden={isHiddenForm}>
                <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <TextField required={true}
                               label="Catégorie"
                               error={error.course}
                               className={classes.textField}
                               name="course"
                               inputRef={register()}
                               inputProps={{ 'name': 'course', 'ref': { register } }}
                               InputLabelProps={{shrink: true}} />
                    <TextField required={true}
                               label="Heure de l'inscription"
                               error={error.horaireEngagement}
                               className={classes.textField}
                               name="horaireEngagement"
                               inputRef={register()}
                               placeholder="ex : 14h"
                               margin="normal"
                               InputLabelProps={{shrink: true}} />
                    <TextField required={true}
                               label="Heure du départ"
                               error={error.horaireDepart}
                               className={classes.textField}
                               inputRef={register()}
                               name="horaireDepart"
                               placeholder="ex : 15h"
                               margin="normal"
                               InputLabelProps={{shrink: true}} />
                </div>
                <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <TextField required={true}
                               label="Tour/Distance"
                               error={error.info1}
                               className={classes.textField}
                               name="info1"
                               inputRef={register()}
                               placeholder="ex : 5 ou 125kms"
                               margin="normal"
                               InputLabelProps={{shrink: true}} />
                    <TextField required={true}
                               label="Kms/Dénivelé"
                               error={error.info2}
                               className={classes.textField}
                               name="info2"
                               inputRef={register()}
                               placeholder="ex: 7,5km ou 1550mD+"
                               margin="normal"
                               InputLabelProps={{shrink: true}} />
                    <TextField label="Lien OpenRunner"
                               className={classes.textField}
                               name="info3"
                               inputRef={register()}
                               style={{margin: 8, marginRight: '150px', width: '250px'}}
                               placeholder="https:/www.lienOpenrunner.com"
                               margin="normal"
                               InputLabelProps={{shrink: true}} />
                </div>

                {
                    isEditing ?
                        <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }}
                                variant={'contained'} value={index} color={'primary'} onClick={onEdit}>
                            Modifier
                        </Button>
                        :
                        <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }}
                                variant={'contained'} value={index} color={'primary'} onClick={handleSubmit(onSubmit)}>
                            Sauvegarder
                        </Button>
                }
            </div>


            <TableContainer component={Paper}>
                <Table className={classes.table} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>Epreuve</TableCell>
                            <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Heure Dossard</TableCell>
                            <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Heure Départ</TableCell>
                            <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Tour Distance</TableCell>
                            <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Kms/Dénivelé</TableCell>
                            <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>Lien OpenRunner</TableCell>
                            <TableCell align="center" style={{ width: '5%', border: '1px solid black' }} />
                            <TableCell align="center" style={{ width: '5%', border: '1px solid black' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { tab.map((info: CompetitionInfo, key: number) => (
                            <TableRow key={key}>
                                <TableCell scope="row" align="center"
                                           style={{ columnWidth: '25%', border: '1px solid black' }}>
                                    {info.course}
                                </TableCell>
                                <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>
                                    {info.horaireEngagement}
                                </TableCell>
                                <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>
                                    {info.horaireDepart}
                                </TableCell>
                                <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>
                                    {info.info1}
                                </TableCell>
                                <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>
                                    {info.info2}
                                </TableCell>
                                <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>
                                    {info.info3}
                                </TableCell>
                                <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}>
                                    <Tooltip title='Modifier cette catégorie'>
                                        <ButtonBase value={key} onClick={editTabRow}>
                                            <EditRounded />
                                        </ButtonBase>
                                    </Tooltip>
                                </TableCell>
                                <TableCell align="center"
                                           style={{ width: '5%', border: '1px solid black', paddingLeft: '16px' }}>
                                    <Tooltip title='Supprimer définitivement cette catégorie'>
                                        <ButtonBase value={key} onClick={deleteTabRow}>
                                            <Delete />
                                        </ButtonBase>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px' }}
                    variant={'contained'} color={'primary'} onClick={addTabRow} >
                Ajouter Epreuve
            </Button>
        </div>
    )
}

export default PropRace;