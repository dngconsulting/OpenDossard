import {ApiProperty} from "@nestjs/swagger";

export class CompetitionInfo {
    @ApiProperty()
    catev: string;
    @ApiProperty()
    horaireDossard?: string;
    @ApiProperty()
    horaireDepart?: string;
    @ApiProperty()
    nbTours?: number;
    @ApiProperty()
    totalKms?: number;
    @ApiProperty()
    recompense?: string;
}