import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MaterialModule} from './../material/material.module'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartComponent } from './pages/start/start.component';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule } from 'angular-plotly.js';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { MapComponent } from './components/leafletmap/map/map.component';
import { PlotComponent } from './components/plotly/plot/plot.component';
import { TableComponent } from './components/table/table/table.component';
import { BoxComponent } from './components/infobox/box/box.component';

PlotlyModule.plotlyjs = PlotlyJS;

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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
