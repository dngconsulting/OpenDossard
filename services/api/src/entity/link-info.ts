import {ApiProperty} from "@nestjs/swagger";

export class LinkInfo {
    @ApiProperty()
    label: string;
    @ApiProperty()
    link: string;
}
