import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  


  constructor(private http:HttpClient) { }

map:any;  
stand_impfungen_bund:any;

// Sim Params
params = {
n_impfzentren:400,
n_impfzentren_pat:500,
impfzentren_tage:7,
n_varzt:0,
n_varzt_pat:10,
varzt_tage:5,
kapazitaet_pro_tag:0,
kapazitaet_pro_woche:0,

};
updateinput:any;

  
  ngOnInit(): void {

// Import Map data
this.http.get('/assets/data/bl.geojson')
.subscribe(data=>{this.map=data;})

// Import some public data    
this.getexternaldata();
this.update_kapazitaet(); 
}


getexternaldata(){
  this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/vacc_table_faktenblatt.json')
.subscribe(data=>{
  this.stand_impfungen_bund=this.filterArray(data,"Bundesland","Gesamt")[0];
  console.log(this.stand_impfungen_bund)  ;
});


}

update_kapazitaet(){
  let params = this.params;
  this.params.kapazitaet_pro_tag= 
  (params.impfzentren_tage*params.n_impfzentren*params.n_impfzentren_pat+
  params.varzt_tage*params.n_varzt*params.n_varzt_pat)*1/7;
  this.params.kapazitaet_pro_woche=this.params.kapazitaet_pro_tag*7;
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
