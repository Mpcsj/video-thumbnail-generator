import { NotImplementedException } from "@nestjs/common"
import { GetThumbListDTO } from "./model/thumb.model"


export class VideoThumbUploader{
    private static INSTANCE = null

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

    static getInstance(){
        if(this.INSTANCE === null){
            this.INSTANCE = new VideoThumbUploader()
        }
        return this.INSTANCE
    }
}

