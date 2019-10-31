import * as React from 'react';
import {Theme, withStyles} from '@material-ui/core';


interface IDashboardProps {
    fetchUsers: (context?: any) => void;
    users: any;
    materialChartData: any[];
    classes?: any;
    theme?: any;
    children?: any;
}

interface IPageState {
    usersTablePage?: number;
    usersTableRowsPerPage: number;
}

class HomePage extends React.Component<IDashboardProps, IPageState> {

    public state: IPageState = {
        usersTablePage: 0,
        usersTableRowsPerPage: 5
    };

    public render(): JSX.Element {
        const {classes} = this.props;
        return (
            <div className={classes.root}>
                L'application Open Dossard est destinée à gérer l'engagement et
                l'édition des résultats d'une course cycliste.
                Elle est éditée par la société <a href='http://www.dng-consulting.com'
                                                  style={{marginRight: 2, marginLeft: 2}}>DNG
                Consulting </a> qui en assure le support.
                <p><strong>Open Dossard</strong> est une plateforme digitale permettant de stocker
                    et partager les informations li&eacute;es aux courses cyclistes des
                    f&eacute;d&eacute;rations FSGT et UFOLEP :</p>
                <ol>
                    <li>A destination des commissaires&nbsp;
                        <ul>
                            <li>Gestion des engagements avec recherche automatique des
                                licences&nbsp;</li>
                            <li>Gestion des r&eacute;sultats par cat&eacute;gorie de valeur ou
                                cat&eacute;gorie d'age
                            </li>
                            <li>Edition de rapports statistiques (fr&eacute;quentation,
                                palmar&egrave;s des coureurs, ...)
                            </li>
                        </ul>
                    </li>
                    <li>A destination des coureurs&nbsp;
                        <ul>
                            <li>Affichage des r&eacute;sultats en ligne aussit&ocirc;t le classement
                                r&eacute;alis&eacute;</li>
                            <li>Classement automatique par cat&eacute;gories de valeur et d'age</li>
                            <li>Statistiques d'un coureur (palmar&egrave;s, assiduit&eacute;, ...)
                            </li>
                        </ul>
                    </li>
                </ol>
                <p>Notre volont&eacute; est de permettre aux diff&eacute;rents acteurs des
                    f&eacute;d&eacute;rations (commissaires mais aussi coureurs)
                    d'acc&eacute;der &agrave; un seul endroit &agrave; toutes les informations d'une
                    course.&nbsp;</p>
            </div>
        );
    }
}

const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        marginBottom: 24,
        padding: '15px'
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    headerTiles: {
        overflowX: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRight: `5px solid ${theme.palette.secondary.main}`,
    },
    headerTileIcon: {
        fontSize: 40,
        color: theme.palette.primary.main,
        paddingRight: 5
    },
    tileText: {
        fontSize: 20,
        color: theme.palette.grey['400'],
    },
    sectionTitle: {
        paddingLeft: theme.spacing(2),
    },
    users: {
        marginBottom: 24,
        overflowX: 'scroll'
    },
    chart: {
        width: '100%'
    },
});

export default withStyles(styles as any)(HomePage as any) as any;
