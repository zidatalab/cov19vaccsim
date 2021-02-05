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
data:any;

// Sim Params
n_impfzentren=400;
n_impfzentren_pat=500;
impfzentren_tage=7;
n_varzt=40000;
n_varzt_pat=10;
varzt_tage=5;


  
  ngOnInit(): void {

// Import Map data
this.http.get('/assets/data/bl.geojson')
.subscribe(data=>{this.map=data;})

// Import some public data    
this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/bundeslaender_table.json')
.subscribe(data=>{this.data=data;  
})

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
