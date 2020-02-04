import {ApiProperty} from "@nestjs/swagger";

export class CompetitionInfo {
    @ApiProperty()
    course: string;
    @ApiProperty()
    horaireEngagement?: string;
    @ApiProperty()
    horaireDepart?: string;
    @ApiProperty()
    info1?: string;
    @ApiProperty()
    info2?: string;
    @ApiProperty()
    info3?: string;
}