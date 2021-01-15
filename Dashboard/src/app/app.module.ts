import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MaterialModule} from './../material/material.module'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartComponent } from './pages/start/start.component';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule ,PlotlyService} from 'angular-plotly.js';
import * as SVLocale from 'plotly.js/lib/locales/de.js';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { MapComponent } from './components/leafletmap/map/map.component';
import { PlotComponent } from './components/plotly/plot/plot.component';
import { TableComponent } from './components/table/table/table.component';
import { BoxComponent } from './components/infobox/box/box.component';
import { registerLocaleData } from '@angular/common';
import locales from '@angular/common/locales/de';
import { LOCALE_ID } from '@angular/core';

PlotlyModule.plotlyjs = PlotlyJS;

registerLocaleData(locales, 'de');

@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    MapComponent,
    PlotComponent,
    TableComponent,
    BoxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PlotlyModule,
    FlexLayoutModule  
    
  ],
  providers: [{provide: LOCALE_ID, useValue: 'de-DE' },PlotlyService],
  bootstrap: [AppComponent]
})

export class AppModule { 
  constructor(private plotlyService: PlotlyService) {
    this.plotlyService.getPlotly().register(SVLocale);
  }
}
