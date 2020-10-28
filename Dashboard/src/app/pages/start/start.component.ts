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

  ngOnInit(): void {
this.testdata=[
  { x: [1, 2, 3], y: [2, 6, 3], type: 'scatter', mode: 'lines+points', marker: {color: 'red'} },
  { x: [1, 2, 3], y: [2, 5, 3], type: 'bar' },
];

this.testlayout= {width: "100%" , height: 400, title: 'A Fancy Plot'};
  
  }

}
