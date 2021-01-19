import { NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, OnInit, Input, EventEmitter, Output, Renderer2 } from '@angular/core';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Feature, FeatureCollection, GeoJsonObject, GeoJsonTypes } from 'geojson';
import { min, max, round, mean, std } from "mathjs";
import * as chroma from "chroma-js";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],

})
export class MapComponent implements OnInit {
  @Input() data: any;
  @Input() Outcome: String;
  @Input() Zoom: number;
  @Input() basemap: any;
  @Input() center: any;
  @Input() opacity: number;
  @Input() feature; string;
  @Input() colorscale: any;
  @Input() cutofflist: any;
  @Input() customlabels: any;
  @Input() binmethod: string;
  @Input() bins: number;
  @Input() id: string;
  legend: any;
  map: any;
  containername : string;
  constructor(private http: HttpClient, private renderer:Renderer2) { }

  ngOnInit(): void {
    // Init vars
    this.containername="mapdiv"+Math.round(Math.random()*1000).toString()+"_"+round(Math.random()*1000).toString();
    if (!this.Zoom) { this.Zoom = 5; };
    if (!this.center) { this.center = [51.948, 10.265]; };
    if (!this.opacity) { this.opacity = .6; };
    if (!this.customlabels) { this.customlabels = []; };       
  }
  ngAfterViewInit(): void {
    // Import Map data
    this.initMap(this.containername);           
  }

  ngOnChanges(changes: any) {
    // On any change remove map-container and add new map-container
    if (changes.feature.previousValue){        
      this.initMap(this.containername);           
    };
    
  
  }

  preparedom(divid){
    if(document.getElementById(divid))
      {document.getElementById(divid).remove()};
      let mapcontainer = this.renderer.createElement("div");
      this.renderer.setProperty(mapcontainer, 'id', divid);
      this.renderer.addClass(mapcontainer,"mapdiv");
      this.renderer.appendChild(document.getElementById("map-frame"), mapcontainer);   
    return true;
  }

  initMap(divid): void {
    let mymap;
    if (this.preparedom(divid)){
      mymap = L.map(divid,
        { center: this.center, zoom: this.Zoom }
      );
      }

    // Fix Icons see https://stackoverflow.com/questions/41144319/leaflet-marker-not-found-production-env
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


    
    // Openstreetmap Tiles
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19, opacity: 0.5,
        attribution: 'Kartenmaterial &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
    tiles.addTo(mymap);

    let geojsonFeature: FeatureCollection = this.basemap;
    let colors = this.colorscale;
    let cutoffs = this.cutofflist;
    if (!cutoffs) {
      cutoffs= this.makecutoffs(this.extractfeature(this.data,this.feature),this.binmethod,this.bins);              
     };
    if (colors.length<cutoffs.length){
      colors = this.makescale(cutoffs.length)
    }
    let propname = this.feature;
    let theid = this.id;
    let thedata = this.data;
    let theopacity = this.opacity;
    let thefilter = this.filterArray;
    let myStyle = function (feature) {
      let byvalue = feature.properties[theid];
      let thevalue = thefilter(thedata, theid, byvalue)[propname]; // feature.properties[propname];
      let i = 0;
      let thecolor = colors[i];
      for (let colorcode of colors) {
        if (thevalue > cutoffs[i]) {
          thecolor = colorcode;
        };
        i = i + 1;
      }
      let result = {
        color: thecolor,
        weight: 1.5,
        opacity: 1,
        fillOpacity: theopacity
      };
      return result
    };
    // Infobox
    let info;
    info = L.control.layers();

    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); 
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML = (props ? props[theid] : "") + '<br>';
      let labelvalue = "";
      // console.log("data:",thefilter(thedata, theid, props[theid]));
      // this._div.innerHTML += (props ? propname + "=" + '' + labelvalue : "");
    };

    info.addTo(mymap);

    // Add Features/Polygons to Map
    const featLayer = L.geoJSON(geojsonFeature,
      {
        style: myStyle,
        onEachFeature: (feature, layer) => (
          layer.on({
            mouseover: (e) => (this.highlightFeature(info, e)),
            mouseout: (e) => (this.resetFeature(info, e)),
            click: (e) => (this.zoomToFeature(mymap, e))
          })
        )
      });

    featLayer.addTo(mymap);

    // Add Legend to Map
    let labels 
    if (this.customlabels){labels=this.customlabels;};

    let legend ;
    legend = L.control.layers({}, {}, { position: 'topright' });

    legend.onAdd = function(map){

      this._ldiv = L.DomUtil.create('div', 'info legend');
      this._ldiv.innerHTML = '<p><strong>' + propname + '</strong></p>';
      for (var i = 0; i < cutoffs.length; i++) {
        if (labels.length == cutoffs.length) {
          this._ldiv.innerHTML +=
            '<i style="background-color:' + colors[i] + ';">&nbsp;&nbsp;&nbsp;</i> ' +
            labels[i];
        }
        else {
          if (colors.length<=5){
          this._ldiv.innerHTML +=
            '<i style="background-color:' + colors[i] + ';">&nbsp;&nbsp;&nbsp;</i> ' +
            cutoffs[i] + (cutoffs[i + 1] ? ' bis unter ' + cutoffs[i + 1] + '<br>' : '+');
          }
          else {
            this._ldiv.innerHTML +=
            '<i style="background-color:' + colors[i] + ';">&nbsp;&nbsp;&nbsp;</i> ' +
            (cutoffs[i + 1] ? 'bis '+cutoffs[i + 1] +"&nbsp;" : cutoffs[i]+'+');
          }
        }
      }

      return this._ldiv;
    };

    legend.addTo(mymap);


  };

  highlightFeature(info, e) {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      opacity: 1.0,
      fillOpacity: 1
    });
    info.update(layer.feature.properties);
  }

  resetFeature(info, e) {
    const layer = e.target;
    layer.setStyle({
      weight: 1.5,
      opacity: 1,
      fillOpacity: this.opacity,
    });
    info.update();
  }
  makecutoffs(array, method = "equalint", bins) {
    let result = [];
    let minv = min(array);
    let maxv = max(array);
    let steps = round((maxv - minv)/bins);
    let i = 0;
      while (i < bins) {
        result.push((i + 1) * steps + minv);
        i = i+1;
      }
    return result;

  }

  
  
  zoomToFeature(map, e) {
    map.fitBounds(e.target.getBounds());
  }

  filterArray(array, key, value) {
    let i = 0
    let result = {}
    for (let item of array) {
      if (item[key] == value) { result = item };
      i = i + 1
    }
    return result;
  }

  extractfeature(array,feature){
    let result = [];
    for (let item of array){
      result.push(item[feature])
    }
    return result;
  }

  makescale(bins=5,startcolor="green",endcolor="red"){
    let midcolor;
    let colors = [startcolor,endcolor];
    if (this.colorscale.length>2){
      colors = [];
      colors.push(this.colorscale[0]);           
      colors.push(this.colorscale[1]);
      colors.push(this.colorscale[2]);      
    }
    if (this.colorscale.length==2) {
      colors=[];
      colors.push(this.colorscale[0]);           
      colors.push(this.colorscale[1]);            
    }
    let scale = chroma.scale(colors).mode('lab');
    let i = 0;
    let result=[];
    while (i<bins){
      result.push(scale((i+1)/bins).hex());
      i = i+1;
    }
    return result;
  }


}

