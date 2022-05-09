import { Body, Controller, Get, Logger, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { GetThumbListDTO } from './model/thumb.model';
import {logMessageDateInterval} from "./app.utils"

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)
  constructor(private readonly appService: AppService) {}


  @Post("/thumb")
  async getThumbnails(@Body(new ValidationPipe({transform: true})) data:GetThumbListDTO){
    this.logger.debug("generateThumbs")
    this.logger.debug(data)
    const startDate = new Date()
    const res = await this.appService.getThumbList(data)
    const endDate = new Date()
    this.logger.log(logMessageDateInterval(startDate,endDate))
    return res
  }

}
