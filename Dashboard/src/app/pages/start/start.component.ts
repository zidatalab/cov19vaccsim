import { HttpClient } from '@angular/common/http';
import { ValueTransformer } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
// import {Observable} from 'rxjs/Observable'

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  constructor(private http:HttpClient) { }

  testdata :any;
  testtable:any;
  testbardata:any
  testtimeseriesdata:any;
  testplot1:any;
  testplot2:any;
  barlayout:any;
  hbarlayout:any;
  mainconfig:any;
  colorblue = "#1d96f3";
  colorgreen = "#8bc34a";
  colororange = "#ff7043";
  wert : any;

  ngOnInit(): void {
// see https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js
this.mainconfig = {
  displayModeBar: false,
  scrollZoom: false,
  autosizable:false,
  locale: 'de',
  doubleClick: 'reset+autosize',
  showAxisDragHandles:false,
  showAxisRangeEntryBoxes:false,
  showTips:true,
  responsive:true
};

this.barlayout= {
    xaxis:{fixedrange:true, type: 'category'},
    yaxis: {fixedrange:true,title: '',automargin: true},
    autosize: false,padding:0,      
    margin: {l: 0,r: 100,b: 100,t: 0}, paper_bgcolor: "transparent", plot_bgcolor: "transparent"
    };
      
this.hbarlayout= {
      yaxis:{fixedrange:true, type: 'category',},
      xaxis: {fixedrange:true,title: '',automargin: true},
      autosize: false,padding:0,      
      margin: {l: 200,r: 0,b: 0,t: 0}, paper_bgcolor: "transparent", plot_bgcolor: "transparent"
      };
        

this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/bundeslaender_table.json')
.subscribe(data=>{this.testtable=data;
  this.wert = this.filterArray(this.testtable,"Bundesland","Gesamt");
  console.log("Wert",this.wert)  
  console.log("Table",this.testtable)  
  this.testplot1 = this.make_plotdata(this.testtable,"Bundesland",["R(t)"],"bar");
  console.log("Plotly bar",this.testplot1)  
  this.testplot2 = this.make_plotdata(this.testtable,"Bundesland",["R(t)"],"hbar");
  console.log("Plotly hbar",this.testplot2)  
  
})



this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/plotdata/plot_rwert_bund.json')
.subscribe(data=>{this.testtimeseriesdata=data;
  console.log("Plot",this.testtimeseriesdata); 
})



  }


  make_trace(xdata= [] ,ydata = [],name:string,type=""){
    return {
      x: xdata,
      y: ydata,
      name: name,
      type: type
    }
  }

make_plotdata(source=[], xaxis="",ylist=[],type="bar"){

  let xdata = this.getValues(source,xaxis)
  let list = []
  let i = 0 
  for (let name in ylist) {
  let trace = this.make_trace(xdata ,this.getValues(source,ylist[i]),ylist[i],type=type)
   if (type=="hbar"){
    trace = this.make_trace(this.getValues(source,ylist[i]),xdata,ylist[i],type="bar")
    trace["orientation"]="h"
   }
   list.push(trace)
   i = i+1
  }
  return list
}



getValues(array, key) {
   let values = [];
   for (let item of array){
     values.push(item[key]);
   }
   return values;
}

filterArray(array,key,value){
  return array.find(i => i[key] === value);
}



}
