import { Body, Controller, Get, Logger, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { GetThumbListDTO } from './model/thumb.model';


@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)
  constructor(private readonly appService: AppService) {}


  @Post("/thumb")
  @UsePipes(ValidationPipe)
  async getThumbnails(@Body() data:GetThumbListDTO){
    this.logger.debug("generateThumbs")
    this.logger.debug(data)
    const startDate = new Date()
    const res = await this.appService.getThumbList(data)
    const endDate = new Date()
    let seconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
    this.logger.log(`Init >> ${startDate}::end>>${endDate}::time taken(seconds) >> ${seconds}`)
    return res
  }

}
