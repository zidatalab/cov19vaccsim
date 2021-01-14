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
  @Input() maptitle:String;
  @Input() Outcome:String;
  @Input() Zoom:number;
  @Input() basemap:any;
  @Input() center:any;
  @Input() opacity:number;
  @Input() feature:string;
  @Input() colorscale:any;
  @Input() cutofflist:any;
  @Input() id:string;
  
  public map;
  constructor(private http:HttpClient) { }

  ngOnInit(): void {
    // Init vars
    if (!this.maptitle){this.maptitle="";};
    if (!this.Zoom){this.Zoom=5;};
    if (!this.center){this.center=[51.948 , 10.265];};
    if (!this.opacity){this.opacity=.6;};
    if (!this.colorscale){this.colorscale=['#800026','#BD0026','#E31A1C','#FC4E2A','#FD8D3C','#FEB24C','#FED976' ,'#FFEDA0'];};
    console.log("MAP",this.basemap);
    console.log("DATA",this.data);
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
    {center: this.center,zoom: this.Zoom}
    );
  
  // Openstreetmap Tiles
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
  {maxZoom: 19,opacity: 0.3 ,  
  attribution: 'Kartenmaterial &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  tiles.addTo(mymap);

  let geojsonFeature:FeatureCollection = this.basemap;
  let colors=this.colorscale;
  let cutoffs=this.cutofflist;
  let propname = this.feature;
  let theid = this.id;
  let thedata = this.data;
  let thefilter = this.filterArray;
  let myStyle = function (feature) {
    let byvalue = feature.properties[theid];
    let thevalue = thefilter(thedata,theid,byvalue)[propname]; // feature.properties[propname];
    console.log(theid,byvalue,thevalue);
    let i = 0;
    let thecolor =colors[i];
    for (let colorcode of colors){
    if (thevalue>cutoffs[i]){
         thecolor = colorcode;        
      };
      i = i+1;
     }
    let result = {
      color: thecolor,
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.3
   };
    return result};
   // method that we will use to update the control based on feature properties passed
   let info;
   info =  L.control.layers();

    info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
    };


info.update = function (props,maptitle=this.maptitle) {
    this._div.innerHTML = (props ? props[theid]: "");
};

info.addTo(mymap);

   const featLayer = L.geoJSON(geojsonFeature, 
    {style: myStyle,
      onEachFeature: (feature, layer) => (
        layer.on({
          mouseover: (e) => (this.highlightFeature(info,e)),
          mouseout: (e) => (this.resetFeature(info,e))  ,
          click: (e) => (this.zoomToFeature(mymap,e))          
          })
          )});

   featLayer.addTo(mymap);

   
  
  };

  highlightFeature(info,e)  {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      opacity: 1.0,
      fillOpacity: 1      
    });
    info.update(layer.feature.properties, this.maptitle);
  }
  
  resetFeature(info,e)  {
    const layer = e.target;
    layer.setStyle({
      weight: 1.5,
      opacity: 1,
      fillOpacity: this.opacity,
    });
    info.update();
  }

  zoomToFeature(map,e) {
    map.fitBounds(e.target.getBounds());
}
  
filterArray(array,key,value){
  let i =0
  let result = {}
  for (let item of array){
    if (item[key]==value){result =item};
    i = i+1
  }
  return result;
}

}

