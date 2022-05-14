import { getSubDataFolder } from "../app.utils";
import * as path from "path"
import * as ffmpeg from "fluent-ffmpeg"
import { Logger } from "@nestjs/common";
import { VIDEO_DURATION_IN_SEC_THRESHOLD } from "../app.constants";


export class VideoHandler{
    private readonly logger = new Logger(VideoHandler.name)
    constructor(private readonly localDataFolderUrl:string){
        this.localDataFolderUrl = localDataFolderUrl
    }

    /**
     * This strategy takes more time to finish( is an issue for big videos )
     * but generates better results, mostly for small videos
    */
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
      
      static generateVideoIntervals(videoDurationInSec:number,numberOfThumbs:number){
        const res:number[] = []
        const videoIntervalInSec = videoDurationInSec/numberOfThumbs
        for(let idx =0;idx<numberOfThumbs;idx++){
          res.push(videoIntervalInSec*idx)
        }
        return res
      }

      async generateVideoThumbnailsVideoSeekingStrategy(
        videoData:DownloadedVideoData,
        numberOfThumbs:number,
        videoDurationInSec:number
      ):Promise<Map<number,string>>{
        const outputUrls:string[] = []
        const result = new Map<number,string>()
        return new Promise((resolve,reject)=>{
          let imagesMissing = numberOfThumbs
          let hasBeenRejectedAlready = false
          const folderUrl = getSubDataFolder(this.localDataFolderUrl,videoData.generatedFileId)
          VideoHandler.generateVideoIntervals(
            videoDurationInSec,numberOfThumbs
            ).forEach((momentToSeek:number,idx:number)=>{
              const thumbUrl = path.resolve(folderUrl,`img_${idx}.jpg`)

              outputUrls.push(thumbUrl)
              result.set(momentToSeek,thumbUrl)
              ffmpeg(videoData.localFileUrl)
              .seekInput(momentToSeek)
              .output(thumbUrl)
              .outputOptions(
                  '-frames', '1'  // Capture just one frame of the video
              )
              .on('end', function() {
                imagesMissing -=1
                if(imagesMissing <=0){
                  resolve(result)
                }
              }).on("error",(err)=>{
                if(!hasBeenRejectedAlready){
                  hasBeenRejectedAlready = true
                  reject(err)
                }
                
              })
              .run()
          })

        })
      }
    
      async generateVideoThumbnails(
        videoData:DownloadedVideoData,
        numberOfThumbs:number,
        videoDurationInSec:number
        ):Promise<Map<number,string>>{
        this.logger.debug("generateVideoThumbnails")
        // if(videoDurationInSec < VIDEO_DURATION_IN_SEC_THRESHOLD){
        //   return this.generateVideoThumbnailsGranularStrategy(
        //     videoData,
        //     numberOfThumbs
        //   )
        // }else{
        //   return this.generateVideoThumbnailsVideoSeekingStrategy(
        //     videoData,
        //     numberOfThumbs,
        //     videoDurationInSec
        //   )
        // }
        return this.generateVideoThumbnailsVideoSeekingStrategy(
          videoData,
          numberOfThumbs,
          videoDurationInSec
        )
        
      }

}