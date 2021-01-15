import { Component, OnInit, Input } from '@angular/core';
import { SelectControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-box',
  templateUrl: './box.component.html',
  styleUrls: ['./box.component.scss']
})
export class BoxComponent implements OnInit {
@Input() value:number;
@Input() title:string;
@Input() description:string;
@Input() colors:string[];
@Input() cutoffs:string[];
@Input() maincolor:string;

  
  constructor() { }
  backupcolor = "grey";

  
  ngOnInit() {
          this.setcolor();
        };    
    
   setcolor(){
     let color ="white";
     if (this.maincolor){
      color = this.maincolor;
     }
     if (this.cutoffs.length>0 && this.cutoffs.length == this.colors.length){

     }
     document.documentElement.style.setProperty('--bgcolor', color);
   }
    

}


