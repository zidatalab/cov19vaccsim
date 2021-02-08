import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  


  constructor(private http:HttpClient) { }
mode="simple";
simple_aerzte_impfen=false;
simple_alle_zulassen=false;
map:any;  
stand_impfungen_bund:any;
dosen_projektion:any;
sim_result:any;
days_since_start:number;
risktimes = [];
n_risikogruppen = [
  {Stufe:1,n:8.6,anteil:0.12672396908},
  {Stufe:2,n:7.0,anteil:0.22987138578},
  {Stufe:3,n:5.7,anteil:0.31386285366},
  {Stufe:4,n:6.9,anteil:0.41553673583},
  {Stufe:5,n:8.4,anteil:0.53931363587},
  {Stufe:6,n:31.26,anteil:1.00},
  {Stufe:"",anteil:1000000},
  {Stufe:"",anteil:1000000}
];
// Sim Params
verteilungszenarien = ["Gleichverteilung","Linearer Anstieg der Produktion in Q2"];
params = {
n_impfzentren:400,
n_impfzentren_pat:500,
impfzentren_tage:7,
n_varzt:0,
n_varzt_pat:20,
varzt_tage:5,
kapazitaet_pro_tag:0,
kapazitaet_pro_woche:0,
liefermenge:1.0,
impflinge : 67864036,
impfstoffart:"zugelassen",
verteilungszenario : this.verteilungszenarien[1]
};
updateinput:any;



  
  ngOnInit(): void {
  this.update_days_since_start();

// Import Map data01
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

change_simple(){
  if (this.simple_aerzte_impfen){
    this.params.n_varzt=50000;
  }
  else {
    this.params.n_varzt=0;
  }
  if (this.simple_alle_zulassen){
    this.params.impfstoffart='alle';
  }
  else {
    this.params.impfstoffart='zugelassen';
    
  }
  this.update_kapazitaet();

}
do_simulation(myinput,params){
  let szenario=params.verteilungszenario;
  let kapazitaet=params.kapazitaet_pro_woche;
  let impflinge=params.impflinge;
  let liefermenge = params.liefermenge;
  let input = this.filterArray(myinput,"Verteilungsszenario",szenario);
  let result=[];
  let finalresult = [];
  let riskinfo = {};
  this.risktimes = [];
  let riskgroup = this.n_risikogruppen;
  let riskgroup_i = 0;
    
  for (var _i = 0; _i < input.length; _i++) {
    let current_item = input[_i];
    let thedosen = current_item.Dosen;
    let thepatienten = current_item.Patienten;
    if (params.impfstoffart=="zugelassen"){
      thedosen = current_item.dosen_zugelassen;
      thepatienten = current_item.patienten_zugelassen;
    }
    current_item['Dosen_aktuell'] = 0;
    if (_i>0){
      current_item['Dosen_aktuell'] = thedosen*liefermenge+result[result.length-1].Rest_Dosen;
      current_item['Patienten_aktuell'] = thepatienten*liefermenge+result[result.length-1].Rest_Patienten;
    }
    else {
      current_item['Dosen_aktuell'] = thedosen*liefermenge;
      current_item['Patienten_aktuell'] = thepatienten*liefermenge;
    }
    current_item['Dosen verfügbar']= thedosen*liefermenge;
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

    // Check who is done
    if (riskgroup.length>=(riskgroup_i+1)){
      if ((current_item['Impfquote']/100)>=riskgroup[riskgroup_i].anteil){
        current_item['riskgroup_done'] =  riskgroup[riskgroup_i].Stufe;
        riskinfo = riskgroup[riskgroup_i];
        riskinfo["kw"] = current_item.kw;
        riskinfo["Datum"] = input[_i].maxdate;
        riskinfo["_Quote"] = current_item.Impfquote/100;
        this.risktimes.push(riskinfo);
        riskgroup_i = riskgroup_i+1;
      };
    }
    
  }
  
  

  this.sim_result=finalresult;
  console.log("this.risktimes", this.risktimes); 
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
  this.simple_aerzte_impfen = this.params.n_varzt>0;
  this.simple_alle_zulassen = this.params.impfstoffart!="zugelassen";
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
