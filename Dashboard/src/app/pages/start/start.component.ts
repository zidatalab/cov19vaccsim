import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  


  constructor(
    private http:HttpClient,
    private route: ActivatedRoute) { }
mode="simple";
simple_aerzte_impfen=false;
simple_alle_zulassen=false;
map:any;  
token:any;
// Einfacher Schutz, wer ihn aushebelt ist nicht nett. Kann sich aber bei mir melden,
valid_token = "zugang_valid_mp_salz_8_bmg";
ewz_bl:any;
stand_impfungen_data:any;
bl_liste:Array<string>;
stand_impfungen_bund:any;
bev_anteil_land:number;
dosen_projektion:any;
land_changed:boolean;
dosen_projektion_all:any;
current_bl="Gesamt";
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
n_varzt:50000,
n_varzt_pat:20,
varzt_tage:0,
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
  this.token = this.route.snapshot.queryParams['token']===this.valid_token;
  
 if (this.token){
// Import Local data
this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/bl.geojson')
.subscribe(data=>{this.map=data;})

this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/ewz_bl.json')
.subscribe(data=>{this.ewz_bl=data;this.bl_liste=this.getValues(this.ewz_bl,"Bundesland");});

// Import some public data    
this.getexternaldata();
}
}


getexternaldata(){
  this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/vacc_table_faktenblatt.json')
.subscribe(data=>{
  this.stand_impfungen_data=data;  
});
this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_data.json')
.subscribe(data=>{
  this.dosen_projektion_all = data;
  this.update_kapazitaet();     
});


}

change_simple(){
  if (this.simple_aerzte_impfen){
    this.params.varzt_tage=5;
  }
  else {
    this.params.varzt_tage=0;
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

  while ((riskgroup_i+1)<=6){
    riskinfo = riskgroup[riskgroup_i];
    riskinfo["Datum"] = "nie";
    this.risktimes.push(riskinfo);
    riskgroup_i = riskgroup_i+1;
  }
  
  

  this.sim_result=finalresult;  
  
}

update_days_since_start(){
  let date1 = new Date("2020-12-26"); 
  let date2 = new Date();
  this.days_since_start= Number((date2.getTime()-date1.getTime())/ (1000 * 3600 * 24));


}
update_kapazitaet(){
  this.dosen_projektion = this.filterArray(this.dosen_projektion_all,"geo",this.current_bl);
  this.stand_impfungen_bund=this.filterArray(this.stand_impfungen_data,"Bundesland",this.current_bl)[0];  
  this.params.impflinge = this.getValues(this.filterArray(this.ewz_bl,"Bundesland",this.current_bl),"EW_20plus")[0];
  this.bev_anteil_land = this.getValues(this.filterArray(this.ewz_bl,"Bundesland",this.current_bl),"Anteil_20plus")[0];
  if (this.land_changed){
    this.params.n_impfzentren=400*this.bev_anteil_land/100;
    this.params.n_varzt=50000*this.bev_anteil_land/100;
    this.land_changed = false;
  }
  let params = this.params;
  this.params.kapazitaet_pro_tag= 
  (params.impfzentren_tage*params.n_impfzentren*params.n_impfzentren_pat+
  params.varzt_tage*params.n_varzt*params.n_varzt_pat)*1/7;
  this.params.kapazitaet_pro_woche=this.params.kapazitaet_pro_tag*7;
  this.do_simulation(this.dosen_projektion,this.params);
  this.simple_aerzte_impfen = this.params.varzt_tage>0;
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
