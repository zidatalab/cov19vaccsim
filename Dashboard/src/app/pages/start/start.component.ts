import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  constructor() { }

  testlayout : any;
  testdata :any;
  colorblue = "#1d96f3";
  colorgreen = "#8bc34a";
  colororange = "#ff7043";


  ngOnInit(): void {
this.testdata=[
  { name: 'Testname 1', x: [1, 2, 3], y: [2, 6, 3], type: 'scatter', mode: 'lines+points', 
  marker: {color: this.colorgreen} },
  { name: 'Testname 2', x: [1, 2, 3], y: [2, 5, 3], type: 'bar' ,marker: {    color: this.colorblue  } },
  { name: 'Testname 3', x: [1, 2, 3], y: [2.3, 3, 2], type: 'bar' , marker: {    color: this.colororange  } },
];

this.testlayout= {title: 'A Fancy Plot' };
  
  }

}
