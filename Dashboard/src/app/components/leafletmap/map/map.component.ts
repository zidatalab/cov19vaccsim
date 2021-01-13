import { NgForOf, NgIf } from '@angular/common';
import { AfterViewInit,Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  
})
export class MapComponent implements OnInit {
  private map;
  constructor() { }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.initMap();
  }


initMap(): void {
  this.map = L.map('map', {
    center: [ 39.8282, -98.5795 ],
    zoom: 3
  });
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

  tiles.addTo(this.map);
}
}