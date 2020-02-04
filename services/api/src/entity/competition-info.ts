import {ApiProperty} from "@nestjs/swagger";

export class CompetitionInfo {
    @ApiProperty()
    courses: string;
    @ApiProperty()
    horaireEngagement?: string;
    @ApiProperty()
    horaireDepart?: string;
    @ApiProperty()
    info1?: number;
    @ApiProperty()
    info2?: number;
    @ApiProperty()
    info3?: string;
}