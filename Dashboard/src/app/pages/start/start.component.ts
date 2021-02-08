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
dosen_projektion:any;
sim_result:any;
days_since_start:number;
// Sim Params
verteilungszenarien = ["Gleichverteilung","Linearer Anstieg der Produktion in Q2"];
params = {
n_impfzentren:400,
n_impfzentren_pat:500,
impfzentren_tage:7,
n_varzt:0,
n_varzt_pat:10,
varzt_tage:5,
kapazitaet_pro_tag:0,
kapazitaet_pro_woche:0,
liefermenge:1.0,
impflinge : 67864036,
impfstoffart:"zugelassen",
verteilungszenario : this.verteilungszenarien[0]
};
updateinput:any;



  
  ngOnInit(): void {
  this.update_days_since_start();

// Import Map data
this.http.get('/assets/data/bl.geojson')
.subscribe(data=>{this.map=data;})

// Import some public data    
this.getexternaldata();
}


getexternaldata(){
  this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/vacc_table_faktenblatt.json')
.subscribe(data=>{
  this.stand_impfungen_bund=this.filterArray(data,"Bundesland","Gesamt")[0];  
});
this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/impfsim_data.json')
.subscribe(data=>{
  this.dosen_projektion = data;
  this.update_kapazitaet();   
});


}


do_simulation(myinput,params){
  let szenario=params.verteilungszenario;
  let kapazitaet=params.kapazitaet_pro_woche;
  let impflinge=params.impflinge;
  let liefermenge = params.liefermenge;
  let input = this.filterArray(myinput,"Verteilungsszenario",szenario);
  let result=[];
  let finalresult = [];
  for (var _i = 0; _i < input.length; _i++) {
    let current_item = input[_i];
    current_item['Dosen_aktuell'] = 0;
    if (_i>0){
      current_item['Dosen_aktuell'] = current_item.Dosen*liefermenge+result[result.length-1].Rest_Dosen;
      current_item['Patienten_aktuell'] = current_item.Patienten*liefermenge+result[result.length-1].Rest_Patienten;
    }
    else {
      current_item['Dosen_aktuell'] = current_item.Dosen*liefermenge;
      current_item['Patienten_aktuell'] = current_item.Patienten*liefermenge;
    }
    current_item['Dosen verfügbar']= current_item.Dosen*liefermenge;
    current_item['Anteil']= current_item.Dosen_aktuell / kapazitaet;
    if (current_item.Anteil>1){
      current_item['Anwendung']= current_item.Dosen_aktuell * (1 / current_item.Anteil);
      current_item['Anwendung_Patienten']= current_item.Patienten_aktuell * (1 / current_item.Anteil);
      current_item['Rest_Dosen']= current_item.Dosen_aktuell - current_item['Anwendung'];
      current_item['Rest_Patienten']= current_item.Patienten_aktuell - current_item['Anwendung_Patienten'];
    } 
    else {
      current_item['Anwendung']= current_item.Dosen_aktuell;
      current_item['Anwendung_Patienten']= current_item.Patienten_aktuell ;
      current_item['Rest_Dosen']= 0;
      current_item['Rest_Patienten']= 0;
    }
    if (_i>0){
      current_item['Anwendung_kum'] = current_item.Anwendung+result[_i-1].Anwendung_kum;
      current_item['Anwendung_Patienten_kum'] = current_item.Anwendung_Patienten+result[_i-1].Anwendung_Patienten_kum;
      current_item['Impfquote'] = 100*(current_item['Anwendung_Patienten_kum'])/impflinge;
    }
    else {
        current_item['Anwendung_kum'] = current_item.Anwendung+this.stand_impfungen_bund['Zahl der Impfungen gesamt'];
        current_item['Anwendung_Patienten_kum'] = current_item.Anwendung_Patienten+this.stand_impfungen_bund['Zahl der Impfungen gesamt']/2;      
    }

    
      result.push(current_item);  
    if (current_item.Anwendung_Patienten_kum<=impflinge){
      finalresult.push(current_item);
    }
    else {
      current_item['Anwendung_Patienten_kum'] = impflinge;
      current_item['Impfquote'] = 100;
      finalresult.push(current_item);      
    }
    
  }
  
  

  this.sim_result=finalresult;   
}

update_days_since_start(){
  let date1 = new Date("2020-12-26"); 
  let date2 = new Date();
  this.days_since_start= Number((date2.getTime()-date1.getTime())/ (1000 * 3600 * 24));


}
update_kapazitaet(){
  let params = this.params;
  this.params.kapazitaet_pro_tag= 
  (params.impfzentren_tage*params.n_impfzentren*params.n_impfzentren_pat+
  params.varzt_tage*params.n_varzt*params.n_varzt_pat)*1/7;
  this.params.kapazitaet_pro_woche=this.params.kapazitaet_pro_tag*7;
  const data = this.dosen_projektion;
  const myparams = this.params;
  this.do_simulation(data,myparams);
  
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
