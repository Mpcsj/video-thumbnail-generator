import { GetThumbListDTO } from "../model/thumb.model";
import * as fs from 'fs'
import { Logger } from "@nestjs/common";
import {exec} from "child_process"


export class AudioOnlyVideoHandlerService{
    private readonly logger = new Logger(AudioOnlyVideoHandlerService.name)
    constructor(private readonly localDataFolderUrl:string){
        this.localDataFolderUrl = localDataFolderUrl
    }


    /**
     * This function is responsible to generate soundwave image from audio file 
    */
    async handleAudioOnlyVideo(
        data:GetThumbListDTO,
        downloadedVideoResult:DownloadedVideoData
    ){
        const localSoundwaveImgUrl = await this.generateSoundwaveImg(downloadedVideoResult)
        return localSoundwaveImgUrl
    }

    private async generateSoundwaveImg(data:DownloadedVideoData){
        this.logger.debug("generateSoundWave")
        const outputFileUrl = 
            data
            .localFileUrl
            .replace("mp4","png")
            .replace(data.generatedFileId,`image_${data.generatedFileId}`)

            const outputFileUrl2 = 
            data
            .localFileUrl
            .replace("mp4","png")
            .replace(data.generatedFileId,`image2_${data.generatedFileId}`)
        this.logger.debug(`outputFileUrl>>${outputFileUrl}`)
        return new Promise((resolve,reject)=>{
            const ffmpegInstruction = `
            ffmpeg -i ${data.localFileUrl} -filter_complex \
            "[0:a]aformat=channel_layouts=mono, \
             compand=gain=-6, \
             showwavespic=s=5000x120:colors=#5a5c57[fg]; \
             color=s=5000x120:color=#ffffff, \
             drawgrid=width=iw/10:height=ih/5:color=#7136ef@0.9[bg]; \
             [bg][fg]overlay=format=auto,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=1:color=#9cf42f" \
            -frames:v 1 ${outputFileUrl}

            ffmpeg -i ${data.localFileUrl} -filter_complex \
            "[0:a]aformat=channel_layouts=mono, \
             compand=gain=-6, \
             showwavespic=s=3000x120:colors=#5a5c57[fg]; \
             color=s=3000x120:color=#ffffff, \
             drawgrid=width=iw/10:height=ih/5:color=#7136ef@0.9[bg]; \
             [bg][fg]overlay=format=auto,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=1:color=#9cf42f" \
            -frames:v 1 ${outputFileUrl2}
            `

            exec(ffmpegInstruction,(error,stdout,sterr)=>{
                if(error){
                    console.log("error")
                    reject(error)
                }else if(sterr){
                    console.log("stderr")
                    if(!fs.existsSync(outputFileUrl)){
                        reject(sterr)
                    }else{
                        resolve(outputFileUrl)
                    }
                }else{
                    this.logger.debug(stdout)
                    resolve(outputFileUrl)
                }
            })
        })
        
    }
}