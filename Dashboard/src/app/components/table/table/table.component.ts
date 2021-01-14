import { AfterViewInit, Component, OnInit, Input ,ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @Input() data:any;
  @Input() columns:any;
  datasource:any;
  displayedColumns:String[];

  
  constructor() { }


  ngOnInit(){
  this.displayedColumns =  this.columns;
  this.datasource = new MatTableDataSource(this.data); 
  }
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.datasource.sort = this.sort;
    this.datasource.paginator = this.paginator;    
  }

}
