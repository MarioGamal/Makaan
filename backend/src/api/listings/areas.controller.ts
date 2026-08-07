import { Controller, Get, Query } from '@nestjs/common';

import { AreaSearchService } from '../../services/area-search.service';

@Controller('areas')
export class AreasController {
  constructor(private readonly areaSearch: AreaSearchService) {}

  @Get()
  searchAreas(@Query('q') query = '') {
    return this.areaSearch.search(query);
  }
}
