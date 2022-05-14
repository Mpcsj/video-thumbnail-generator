import { Logger } from "@nestjs/common"
import * as AWS from "aws-sdk"
import * as fs from "fs"

export class VideoThumbUploader{
    private static INSTANCE = null
    private readonly logger = new Logger(VideoThumbUploader.name)
    private readonly s3:AWS.S3
    constructor(){
        this.s3 = new AWS.S3({
            accessKeyId:process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
        })
    }
    
    private async uploadItem(localFileUrl:string,id:string,videoData:DownloadedVideoData):Promise<AWS.S3.ManagedUpload.SendData>{
        const filename = `thumb_${videoData.generatedFileId}_${id}`
        
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${filename}.png`,
          Body: fs.readFileSync(localFileUrl)
        }
        
        return new Promise((resolve,reject)=>{
            this.s3.upload(params, (err, data:AWS.S3.ManagedUpload.SendData) => {
                if (err) {
                  reject(err)
                }
                resolve(data)
              })
        })
    }
  /**
   * Function responsible to upload thumbnail images
   * to a remote bucket (S3 bucket, Cloudinary, etc)
   * and map them to a database to be retrieved later
   * @returns url list to the uploaded images
  */
   async handleUploadThumbsToRemote(
    thumbListUrl:Map<number,string>,
    videoData:DownloadedVideoData):Promise<string[]>{
        const result:string[] = []
        await Promise.all(this.getSortedKeysAsList(thumbListUrl).map(async (key:number,idx:number)=>{
            const url = thumbListUrl.get(key)

            const current = await this.uploadItem(url,idx.toString(),videoData)
            result.push(current.Location)
        }))
        return result
    }

    getSortedKeysAsList(data:Map<number,string>):number[]{
        const keys:number[] = [...data.keys()]
        keys.sort((a,b)=>a - b)
        return keys
    }
    static getInstance(){
        if(this.INSTANCE === null){
            this.INSTANCE = new VideoThumbUploader()
        }
        return this.INSTANCE
    }
}

