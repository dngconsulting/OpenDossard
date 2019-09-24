import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from 'typeorm';
import {Federation} from './Federation';
import {Club} from './Club';
import {Type} from '@tsed/core';

/**
 * Cette énum représente les catégories gérées par une épreuve
 */
export enum CategoriesEpreuve {
    PREMIERE = '1ere',
    SECONDE = '2eme',
    TROISIEME = '3eme',
    QUATRIEME = '4eme',
    CINQUIEME = '5eme',
    CADETS = 'Cadets',
    MINIMES = 'Minimes',
    FEMININES = 'Feminines',
}

export enum TypeEpreuve {
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
export class Epreuve {

    @PrimaryGeneratedColumn()
    public id: number;
    /**
     * La date de l'épreuve au format JS
     */
    @Column({nullable: false})
    public dateEpreuve: Date;
    /**
     * La référence du club organisateur
     */
    @ManyToOne((type) => Club)
    @JoinColumn()
    public clubOrganisateur: Club;
    /**
     * Le nom de l'épreuve
     */
    @Column({nullable: true})
    public nom: string;
    /**
     * Le code postal correspondant à la commune
     */
    @Column({nullable: false})
    public codePostal: string;
    /**
     * L'identifiant OpenRunner du circuit, plat/vallonné/montagneux
     */
    @Column({nullable: true})
    public infoCircuit: string;
    /**
     * La liste des catégories de valeurs concernées par l'épreuve
     * [PREMIERES, SECONDES, QUATRIEMES, CADETS, ...]
     */
    @Column('simple-array')
    public categoriesEpreuve: CategoriesEpreuve[];

    /**
     * Toutes les informations concernant la sécurité, le nom du ou des responsables
     * Les tarifs et les conditions d'inscription
     */
    @Column({nullable: true})
    public observations: string;

    /**
     * Les différents tarifs au format JSON de la manière suivante :
     *  {'Non Licenciés' : 10, 'FSGT' : 7, 'UFOLEP' : 9}
     */
    @Column({nullable: true})
    @Column('simple-json')
    public tarifs: { tarifName: string, tarif: number };

    @Column({
        type: 'enum',
        enum: Federation,
        nullable: true,
        default: Federation.NL,
    })
    fede: Federation;

    @Column({
        type: 'enum',
        enum: TypeEpreuve,
        nullable: true,
        default: TypeEpreuve.ROUTE,
    })
    typeEpreuve: TypeEpreuve;
}
