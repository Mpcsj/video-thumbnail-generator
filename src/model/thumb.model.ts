import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class GetThumbListDTO{
    @IsString()
    @IsNotEmpty()
    fileId:string

    @IsNumber()
    @IsOptional()
    maxThumbCount?:number

    @IsString()
    @IsNotEmpty()
    videoUrl:string

    @IsNumber()
    @IsNotEmpty()
    videoDurationInSec:number

    @IsOptional()
    @IsBoolean()
    isAudioOnly:boolean = false

    getThumbCount(){
        return this.maxThumbCount?this.maxThumbCount:50
    }

}

export interface ThumbInfo{
    url:string,
    thumbStartTimeInSec:number
}