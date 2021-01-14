import { NgForOf, NgIf } from '@angular/common';
import { AfterViewInit,Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Feature,FeatureCollection,GeoJsonObject,GeoJsonTypes } from 'geojson';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  
})
export class MapComponent implements OnInit {
  @Input() data:any;
  @Input() Outcome:String;
  @Input() Zoom:number;
  @Input() basemap:any;
  
  public map;
  constructor(private http:HttpClient) { }

  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    // Import Map data
this.initMap();
   
  }

initMap(): void {
  // Fix Icons see https://stackoverflow.com/questions/41144319/leaflet-marker-not-found-production-env
  // See 
  const iconRetinaUrl = 'assets/marker-icon-2x.png';
  const iconUrl = 'assets/marker-icon.png';
  const shadowUrl = 'assets/marker-shadow.png';
  const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
  });
  Marker.prototype.options.icon = iconDefault;


  // Basemap
  let mymap = L.map('map', 
    // Example 1: 
    // {center: [51.509, -0.09 ],zoom: 14}
    // Example 2: 
    //{center: [39.75621, -104.99404 ],zoom: 17}
    // Example 3: 
    {center: [51.948 , 10.265],zoom: 5}
    );
  
  // Openstreetmap Tiles
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
  {maxZoom: 19, color:"white", opacity: 0.3 ,  
  attribution: 'Kartenmaterial &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  tiles.addTo(mymap);

  // Example 1:  // Markers
/*   let circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
    }).addTo(mymap);

  let polygon = L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047],
      [51.52, -0.067]
  ]).addTo(mymap); */

  // Example 2
  // let geojsonFeature:Feature = {
  //   "type": "Feature",
  //   "properties": {
  //       "name": "Coors Field",
  //       "amenity": "Baseball Stadium",
  //       "popupContent": "This is where the Rockies play!"
  //   },
  //   "geometry": {
  //       "type": "Point",
  //       "coordinates": [-104.99404,39.75621]
  //   }
  // };

  // let myStyle = {
  //   "color": "#ff7800",
  //   "weight": 5,
  //   "opacity": 0.65
  // };
  // const featLayer = L.geoJSON(geojsonFeature, {style:myStyle});
  // featLayer.addTo(mymap);

  // Example 3 use provided feature
  let geojsonFeature:FeatureCollection = this.basemap;
  let myStyle = {
     "color": 'red',
     "weight": 1.5,
     "opacity": 1
  };

  const featLayer = L.geoJSON(geojsonFeature, {style:myStyle});
  featLayer.addTo(mymap);
  };


}