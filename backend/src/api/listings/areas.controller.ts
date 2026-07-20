import { Controller, Get, Query } from '@nestjs/common';

import { CairoAreaService } from '../../services/cairo-area.service';

@Controller('areas')
export class AreasController {
  constructor(private readonly cairoAreaService: CairoAreaService) {}

  @Get('search')
  async searchAreas(@Query('q') query = '') {
    return this.cairoAreaService.searchAreas(query);
  }
}

