import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';


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
  altmap:any;
  testtimeseriesdata:any;
  testplot1:any;
  testplot2:any;
  testplot3:any;
  barlayout:any;
  blkarte:any;
  hbarlayout:any;
  tslayout:any;
  mainconfig:any;
  colorscheme= ["#004c8c","#0277bd","#58a5f0","#b71c1c","#7f0000"]
  wert : any;

  ngOnInit(): void {
// Import Map data
this.http.get('/assets/data/bl.geojson')
.subscribe(data=>{this.blkarte=data;})


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
    xaxis:{fixedrange:false, type: 'category',automargin: false},
    yaxis: {fixedrange:true,title: '',automargin: true},
    autosize: false,padding:0,      
    margin: {l: 0,r: 100,b: 100,t: 0}, paper_bgcolor: "transparent", plot_bgcolor: "transparent"
    };

this.tslayout= {
      xaxis:{fixedrange:false, automargin: false},
      yaxis: {fixedrange:true,title: '',automargin: true},
      autosize: false,padding:0,      
      margin: {l: 0,r: 0,b: 20,t: 0}, paper_bgcolor: "transparent", plot_bgcolor: "transparent"
      };
        
      
this.hbarlayout= {
      yaxis:{fixedrange:false, type: 'category',automargin: false},
      xaxis: {fixedrange:true,title: '',automargin: true},
      autosize: false,padding:0,      
      margin: {l: 200,r: 0,b: 20,t: 0}, paper_bgcolor: "transparent", plot_bgcolor: "transparent"
      };
        

this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/bundeslaender_table.json')
.subscribe(data=>{this.testtable=data;
  this.wert = this.filterArray(this.testtable,"Bundesland","Gesamt")[0];
  this.testplot1 = this.make_plotdata(this.testtable,"Bundesland",["R(t)"],"bar");
  this.testplot2 = this.make_plotdata(this.testtable,"Bundesland",["R(t)"],"hbar");

  
})



this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/plotdata/plot_rwert_bund.json')
.subscribe(data=>{this.testtimeseriesdata=data;
  this.testplot3 = this.make_plotdata(this.filterArray(this.testtimeseriesdata,"name","Gesamt"),"date",["R"],"lines");
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

make_plotdata(source=[], xaxis="",ylist=[],type="bar",colors=this.colorscheme){
  let xdata = this.getValues(source,xaxis)
  let list = []
  let i = 0 
  for (let name in ylist) {
  let trace = this.make_trace(xdata ,this.getValues(source,ylist[i]),ylist[i],type=type)
   if (type=="hbar"){
    trace = this.make_trace(this.getValues(source,ylist[i]),xdata,ylist[i],type="bar")
    trace["orientation"]="h"    
   }
   if (type=="bar" || type=="bar" || type=="scatter" ){
    trace["marker"]= {
      color: colors[i]      
    }
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
  let i =0
  let result = []
  for (let item of array){
    if (item[key]==value){result.push(item)};
    i = i+1
  }
  return result
}



}
