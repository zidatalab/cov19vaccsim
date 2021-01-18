import { NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Feature, FeatureCollection, GeoJsonObject, GeoJsonTypes } from 'geojson';
import { min, max, round, mean, std } from "mathjs";
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],

})
export class MapComponent implements OnInit {
  @Input() data: any;
  @Input() maptitle: String;
  @Input() Outcome: String;
  @Input() Zoom: number;
  @Input() basemap: any;
  @Input() center: any;
  @Input() opacity: number;
  globalmap: any;
  @Input() feature; string;
  @Input() colorscale: any;
  @Input() cutofflist: any;
  @Input() customlabels: any;
  @Input() id: string;
  legend: any;
  map: any;
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // Init vars
    if (!this.maptitle) { this.maptitle = ""; };
    if (!this.Zoom) { this.Zoom = 5; };
    if (!this.center) { this.center = [51.948, 10.265]; };
    if (!this.opacity) { this.opacity = .6; };
    if (!this.customlabels) { this.customlabels = []; };
    if (!this.colorscale) { this.colorscale = ['#800026', '#BD0026', '#E31A1C', '#FC4E2A', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0']; };

  }
  ngAfterViewInit(): void {
    // Import Map data
    this.globalmap = L.map('map',
      { center: this.center, zoom: this.Zoom }
    );
    this.initMap(this.globalmap);

  }

  ngOnChanges(changes: any) {
     this.initMap(this.globalmap);
  }



  initMap(map): void {
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


    // Basemap
    let mymap = map;
    
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

    info.update = function (props, maptitle = this.maptitle) {
      this._div.innerHTML = (props ? props[theid] : "") + '<br>';
      let labelvalue = "";
      // labelvalue = thefilter(thedata,theid,props[theid])[propname];
      this._div.innerHTML += (props ? propname + "=" + '' + labelvalue : "");
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

      this._ldiv = L.DomUtil.create('legend', 'info legend');
      this._ldiv.innerHTML = '<p><strong>' + propname + '</strong></p>';
      for (var i = 0; i < cutoffs.length; i++) {
        if (labels.length == cutoffs.length) {
          this._ldiv.innerHTML +=
            '<i style="background-color:' + colors[i] + ';">&nbsp;&nbsp;&nbsp;</i> ' +
            labels[i];
        }
        else {
          this._ldiv.innerHTML +=
            '<i style="background-color:' + colors[i] + ';">&nbsp;&nbsp;&nbsp;</i> ' +
            cutoffs[i] + (cutoffs[i + 1] ? ' bis unter ' + cutoffs[i + 1] + '<br>' : '+');
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
    info.update(layer.feature.properties, this.maptitle);
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
  makecutoffs(array, method = "equalint", bins = 5) {
    let result = [];
    if (method == "equalint") {
      let minv = min(array);
      let maxv = max(array);
      let steps = round(maxv - minv);
      let i = 0;
      while (i < bins) {
        result.push((i + 1) * steps + minv);
      }
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

}

