import { NgForOf, NgIf } from '@angular/common';
import { AfterViewInit,Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  
})
export class MapComponent implements OnInit {
  karte :any;
  @Input() data:any;
  @Input() Outcome:String;
  
  private map;
  constructor(private http:HttpClient) { }

  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    // Import Map data
this.initMap();


    
  }

  onMapReady(map: L.Map) {
    this.http.get('/assets/data/bl.geojson').subscribe((json: any) => {
        console.log(json);
        let karte = json;
        L.geoJSON(karte).addTo(map);
    })}

initMap(): void {
  this.map = L.map('map', {
    center: [ 51.225556, 6.782778 ],
    zoom: 11
  });
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

  tiles.addTo(this.map);
  this.onMapReady(this.map);
  }
}