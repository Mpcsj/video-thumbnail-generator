import { Injectable, Logger } from '@nestjs/common';
import { GetThumbListDTO, ThumbInfo } from './model/thumb.model';
import axios from 'axios'
import * as fs from "fs"
import * as path from "path"
import * as uuid4 from "uuid4"
import {getDataFolderUrl, logMessageDateInterval} from "./app.utils"
import { VideoHandler } from './file-managers/videoHandler.service';
import { VideoThumbUploader } from './videoThumbUploader.service';
import { AudioOnlyVideoHandlerService } from './file-managers/audioOnlyVideo.service';


@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)
  private readonly localDataFolderUrl:string
  private readonly videohandler:VideoHandler
  private readonly videoThumbUploader: VideoThumbUploader;
  private readonly audioOnlyVideoHandler: AudioOnlyVideoHandlerService;

  constructor(){
    this.localDataFolderUrl = getDataFolderUrl()
    this.videohandler = new VideoHandler(this.localDataFolderUrl)
    this.audioOnlyVideoHandler = new AudioOnlyVideoHandlerService(this.localDataFolderUrl)
    this.videoThumbUploader = VideoThumbUploader.getInstance()
  }

  async downloadVideoFile(videoUrl:string):Promise<DownloadedVideoData>{
    this.logger.debug(`downloadVideoFile::videoUrl >> ${videoUrl}`)
    const generatedFileId = uuid4()
    const filename = `${generatedFileId}.mp4`
    const localFileUrl = path.resolve(this.localDataFolderUrl,filename)
    return new Promise(async(resolve,reject)=>{
      try {
        const response = await axios({
          method:"GET",
          url:videoUrl,
          responseType:"stream"
        })
        const w = response.data.pipe(fs.createWriteStream(localFileUrl))
        w.on("finish",()=>{
          resolve({
            localFileUrl,
            generatedFileId
          })
        })
      } catch (error) {
        reject(error) 
      }
    })
  }


  async handleProcessFileWithVideo(
    data:GetThumbListDTO,
    downloadedVideoResult:DownloadedVideoData,

  ):Promise<ThumbInfo[]>{
    const maxThumbCount = data.getThumbCount()
    const videoDurationInSec = data.videoDurationInSec
    await this.videohandler.generateVideoThumbnails(
      downloadedVideoResult,
      maxThumbCount,
      videoDurationInSec
    )
    const intervalPerThumb = videoDurationInSec/maxThumbCount
    const uploadedResult = await this.videoThumbUploader.handleUploadThumbsToRemote(data,downloadedVideoResult)
    const res:ThumbInfo[] = uploadedResult.map((thumbUrl,idx)=>{
      return{
        url:thumbUrl,
        thumbStartTimeInSec:idx*intervalPerThumb
      }
    })
    return res
  }

  async handleProcessAudioOnlyFile(
    data:GetThumbListDTO,
    downloadedVideoResult:DownloadedVideoData
  ):Promise<ThumbInfo[]>{
    const init = new Date()
    const res = await this.audioOnlyVideoHandler.handleAudioOnlyVideo(
      data,
      downloadedVideoResult
    )
    this.logger.debug(logMessageDateInterval(init,new Date(),"handle_audio_file"))
    return []
  }

  async getThumbList(data:GetThumbListDTO):Promise<ThumbInfo[]>{
    this.logger.debug("getThumbList")
    // TODO: Verify if current file already have a generated list of thumbnails to
    // avoid redoing the same work
    
    const downloadedVideoResult = await this.downloadVideoFile(data.videoUrl) as DownloadedVideoData

    if(data.isAudioOnly){
      return this.handleProcessAudioOnlyFile(data,downloadedVideoResult)
    }else{
      return this.handleProcessFileWithVideo(data,downloadedVideoResult)
    }
  }
}
