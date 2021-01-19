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
  tsplotdata:any;
  tsplotdata2:any;
  barlayout:any;
  blkarte:any;
  hbarlayout:any;
  tslayout:any;
  mainconfig:any;
  setbins = 5;
  colorscheme= ["#004c8c","#0277bd","#58a5f0","#b71c1c","#7f0000"];
  wert : any;
  selected_Land = 'Gesamt';
  bundeslandoptions = [];
  indicators = [];
  selected_Indicator = '7-Tage-Inzidenz';
  testarray= [1,2,4,6]


  
  ngOnInit(): void {

// Import Map data
this.http.get('/assets/data/bl.geojson')
.subscribe(data=>{this.blkarte=data;})


      

this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/bundeslaender_table.json')
.subscribe(data=>{this.testtable=data;
  this.wert = this.filterArray(this.testtable,"Bundesland","Gesamt")[0]; 
  this.indicators = this.getKeys(this.testtable);
  this.indicators.shift();

  
})



this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/plotdata/plot_rwert_bund.json')
.subscribe(data=>{this.testtimeseriesdata=data;
  this.tsplotdata= this.filterArray(this.testtimeseriesdata,'name',this.selected_Land);
  this.bundeslandoptions = this.getOptions(this.testtimeseriesdata,'name');
  this.selected_Land = this.bundeslandoptions[0];

})

this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/plotdata/plot_rwert_bund.json')
.subscribe(data=>{this.tsplotdata2=data;
  this.tsplotdata2= this.filterArray(this.tsplotdata2,'name',this.bundeslandoptions[0]);

})



  }

update_bl(){
  this.tsplotdata= this.filterArray(this.testtimeseriesdata,'name',this.selected_Land);  
}

update_indicator(){
  this.tsplotdata= this.filterArray(this.testtimeseriesdata,'name',this.selected_Land);  
}

getValues(array, key) {
   let values = [];
   for (let item of array){
     values.push(item[key]);
   }
   return values;
}
getKeys(array){
  return Object.keys(array[0]);
}

getOptions(array, key){
  return array.map(item => item[key])
  .filter((value, index, self) => self.indexOf(value) === index)
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
