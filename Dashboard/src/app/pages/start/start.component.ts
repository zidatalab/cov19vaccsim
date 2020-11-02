import { HttpClient } from '@angular/common/http';
import { ValueTransformer } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  constructor(private http:HttpClient) { }

  testlayout : any;
  testconfig={};
  testdata :any;
  testtable:any;
  colorblue = "#1d96f3";
  colorgreen = "#8bc34a";
  colororange = "#ff7043";


  ngOnInit(): void {

this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/bundeslaender_table.json')
.subscribe(data=>{this.testtable=data;
  console.log(this.testtable);
  this.testdata=[
    { name: 'R-Wert', x: this.getValues(this.testtable,"Bundesland") , y: this.getValues(this.testtable,"R(t)"), type: 'bar' ,marker: {    color: this.colorblue  } },
  ];
})


this.testlayout= {title: 'A Fancy Plot' };
  
  }

getValues(array, key) {
   let values = [];
   for (let item of array){
     values.push(item[key]);
   }
   return values;
}


}
