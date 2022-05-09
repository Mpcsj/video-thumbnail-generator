import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { GetThumbListDTO, ThumbInfo } from './model/thumb.model';
import axios from 'axios'
import * as fs from "fs"
import * as path from "path"
import * as uuid4 from "uuid4"
import * as ffmpeg from "fluent-ffmpeg"
import {getDataFolderUrl,getSubDataFolder,logMessageDateInterval} from "./app.utils"

interface DownloadedVideoData{
  localFileUrl:string,
  generatedFileId:string
}

const VIDEO_DURATION_IN_SEC_THRESHOLD = 50

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)
  private readonly localDataFolderUrl:string

  constructor(){
    this.localDataFolderUrl = getDataFolderUrl()
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


  async generateVideoThumbnailsGranularStrategy(
    videoData:DownloadedVideoData,
    numberOfThumbs:number){
      return new Promise((resolve,reject)=>{
        new ffmpeg(videoData.localFileUrl)
        .takeScreenshots({
            count: numberOfThumbs,
          }, getSubDataFolder(
            this.localDataFolderUrl,
            videoData.generatedFileId
            ), function(err) {
          if(err){
            reject(err)
          }else{
            resolve({})
          }
        }).on("end",()=>{
          console.log("end process successfully !")
          resolve({})
        }).on("error",(err)=>{
          console.log("end process with errors!")
          reject(err)
        });
      })
  }
  async generateVideoThumbnailsVideoSeekingStrategy(
    videoData:DownloadedVideoData,
    numberOfThumbs:number,
    videoDurationInSec:number
  ){
    return new Promise((resolve,reject)=>{
      let imagesMissing = numberOfThumbs
      let hasBeenRejectedAlready = false
      const folderUrl = getSubDataFolder(this.localDataFolderUrl,videoData.generatedFileId)
      for(let idx =0;idx<numberOfThumbs;idx++){
        const momentToSeek = (videoDurationInSec/numberOfThumbs)*idx
        const thumbUrl = path.resolve(folderUrl,`img_${idx}.jpg`)
        ffmpeg(videoData.localFileUrl)
        .seekInput(momentToSeek)
        .output(thumbUrl)
        .outputOptions(
            '-frames', '1'  // Capture just one frame of the video
        )
        .on('end', function() {
          imagesMissing -=1
          if(imagesMissing <=0){
            resolve({})
          }
        }).on("error",(err)=>{
          if(!hasBeenRejectedAlready){
            hasBeenRejectedAlready = true
            reject(err)
          }
          
        })
        .run()
      }
    })
  }

  async generateVideoThumbnails(
    videoData:DownloadedVideoData,
    numberOfThumbs:number,
    videoDurationInSec:number
    ){
    this.logger.debug("generateVideoThumbnails")
    if(videoDurationInSec < VIDEO_DURATION_IN_SEC_THRESHOLD){
      return this.generateVideoThumbnailsGranularStrategy(
        videoData,
        numberOfThumbs
      )
    }else{
      return this.generateVideoThumbnailsVideoSeekingStrategy(
        videoData,
        numberOfThumbs,
        videoDurationInSec
      )
    }
  }

  /**
   * Function responsible to upload thumbnail images
   * to a remote bucket (S3 bucket, Cloudinary, etc)
   * and map them to a database to be retrieved later
   * @returns url list to the uploaded images
  */
  handleUploadThumbsToRemote(
    originalVideoData:GetThumbListDTO,
    videoData:DownloadedVideoData):Promise<string[]>{

    throw new NotImplementedException()
  }

  async getThumbList(data:GetThumbListDTO):Promise<ThumbInfo[]>{
    this.logger.debug("getThumbList")
    this.logger.debug(data instanceof GetThumbListDTO)
    const maxThumbCount = data.getThumbCount()
    const initDate1 = new Date()
    const downloadedVideoResult = await this.downloadVideoFile(data.videoUrl) as DownloadedVideoData
    this.logger.debug(logMessageDateInterval(initDate1,new Date(),"downloadVideo"))
    const videoDurationInSec = data.videoDurationInSec

    const initDate2 = new Date()
    await this.generateVideoThumbnails(
      downloadedVideoResult,
      maxThumbCount,
      videoDurationInSec
    )
    this.logger.debug(logMessageDateInterval(initDate2,new Date(),"generateVideoThumbs"))
    const intervalPerThumb = videoDurationInSec/maxThumbCount
    const uploadedResult = await this.handleUploadThumbsToRemote(data,downloadedVideoResult)
    const res:ThumbInfo[] = uploadedResult.map((thumbUrl,idx)=>{
      return{
        url:thumbUrl,
        thumbStartTimeInSec:idx*intervalPerThumb
      }
    })
    return res
  }
}
