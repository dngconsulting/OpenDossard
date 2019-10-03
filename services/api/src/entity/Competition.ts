import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Federation} from './Federation';
import {Club} from './Club';
import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';

/**
 * Cette énum représente les catégories gérées par une épreuve
 */
export enum Category {
    PREMIERE = '1ere',
    SECONDE = '2eme',
    TROISIEME = '3eme',
    QUATRIEME = '4eme',
    CINQUIEME = '5eme',
    CADETS = 'Cadets',
    MINIMES = 'Minimes',
    FEMININES = 'Feminines',
}

export enum CompetitionType {
    CX = 'CX',
    ROUTE = 'ROUTE',
    VTT = 'VTT',
    AUTRE = '',
}

/**
 * Entité représentant une fichier épreuve.
 * Une épreuve contient ensuite une ou plusieurs courses
 */
@Entity()
export class Competition {

    @PrimaryGeneratedColumn()
    @ApiModelProperty()
    public id: number;
    /**
     * La eventDate de l'épreuve au format JS
     */
    @Column({nullable: false})
    @ApiModelProperty({ type: 'string', format: 'date-time'})
    public eventDate: Date;
    /**
     * La référence du club organisateur
     */
    @ManyToOne((type) => Club)
    @JoinColumn()
    @ApiModelProperty()
    public clubId: Club;
    /**
     * Le nom de l'épreuve
     */
    @Column({nullable: true})
    @ApiModelProperty()
    public name: string;
    /**
     * Le code postal correspondant à la commune
     */
    @Column({nullable: false})
    @ApiModelProperty()
    public zipCode: string;
    /**
     * L'identifiant OpenRunner du circuit, plat/vallonné/montagneux
     */
    @Column({nullable: true})
    @ApiModelPropertyOptional()
    public info: string;
    /**
     * La liste des catégories de valeurs concernées par l'épreuve
     * [PREMIERES, SECONDES, QUATRIEMES, CADETS, ...]
     */
    @Column('simple-array')
    @ApiModelProperty()
    public categories: Category[];

    /**
     * Toutes les informations concernant la sécurité, le nom du ou des responsables
     * Les tarifs et les conditions d'inscription
     */
    @Column({nullable: true})
    @ApiModelPropertyOptional()
    public observations: string;

    /**
     * Les différents tarifs au format JSON de la manière suivante :
     *  {'Non Licenciés' : 10, 'FSGT' : 7, 'UFOLEP' : 9}
     */
    @Column({nullable: true})
    @Column('simple-json')
    @ApiModelPropertyOptional()
    public pricing: { name: string, price: number };

    /**
     * Liste des courses ['1/2/3','4/5']
     */
    @Column({nullable: true})
    @Column('simple-array')
    @ApiModelPropertyOptional()
    public races: string[];

    @Column({
        type: 'enum',
        enum: Federation,
        nullable: true,
        default: Federation.NL,
    })
    @ApiModelProperty()
    fede: Federation;

    @Column({
        type: 'enum',
        enum: CompetitionType,
        nullable: true,
        default: CompetitionType.ROUTE,
    })
    @ApiModelPropertyOptional()
    competitionType: CompetitionType;
}
