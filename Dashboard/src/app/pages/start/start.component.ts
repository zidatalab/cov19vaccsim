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
    private http: HttpClient,
    private route: ActivatedRoute) { }

  // Plan B
  showdurchimpfung = true;

  mode = "simple";
  simple_aerzte_impfen = false;
  simple_alle_zulassen = false;
  map: any;
  token: any;
  // Einfacher Schutz, wer ihn aushebelt ist nicht nett. Kann sich aber bei mir melden,
  valid_token = "zugang_valid_mp_salz_8_bmg";
  ewz_bl: any;
  stand_impfungen_data: any;
  bl_liste: Array<string>;
  stand_impfungen_bund: any;
  stand_impfungen_hersteller: any;
  bev_anteil_land: number;
  impfkapazitaet_land: number;
  impfkapazitaet_bund: number;
  dosen_projektion: any;
  herstellerliste: any;
  land_changed: boolean;
  dosen_projektion_all: any;
  dosen_projektion_all_hersteller: any;
  dosen_projektion_all_hersteller_filtered: any;
  current_bl = "Gesamt";
  sim_result: any;
  new_simresult:any;

  days_since_start: number;
  risktimes = [];
  n_risikogruppen = [
    { Stufe: 1, n: 8.6, anteil: 0.12672396908 },
    { Stufe: 2, n: 7.0, anteil: 0.22987138578 },
    { Stufe: 3, n: 5.7, anteil: 0.31386285366 },
    { Stufe: 4, n: 6.9, anteil: 0.41553673583 },
    { Stufe: 5, n: 8.4, anteil: 0.53931363587 },
    { Stufe: 6, n: 31.26, anteil: 1.00 },
    { Stufe: "", anteil: 1000000 },
    { Stufe: "", anteil: 1000000 }
  ];
  // Sim Params
  verteilungszenarien = ["Gleichverteilung", "Linearer Anstieg der Produktion in Q2"];
  params = {
    n_impfzentren: 433,
    n_impfzentren_pat: 789,
    impfzentren_tage: 7,
    n_varzt: 50000,
    n_varzt_pat: 20,
    varzt_tage: 0,
    kapazitaet_pro_tag: 0,
    kapazitaet_pro_woche: 0,
    warten_dosis_2: 5,
    liefermenge: 1.0,
    impflinge: 67864036,
    impfstoffart: "zugelassen",
    verteilungszenario: this.verteilungszenarien[1] 
  };
  updateinput: any;




  ngOnInit(): void {
    this.update_days_since_start();
    this.token = this.route.snapshot.queryParams['token'] === this.valid_token;

    if (this.token) {
      // Import Local data
      this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/bl.geojson')
        .subscribe(data => { this.map = data; })

      this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/ewz_bl.json')
        .subscribe(data => {
          this.ewz_bl = data;
          this.bl_liste = this.getValues(this.ewz_bl, "Bundesland");
          this.impfkapazitaet_bund = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", "Gesamt"), "Impfkapazitaet")[0];
        });

      // Import some public data    
      this.getexternaldata();
    }
  }


  getexternaldata() {
    this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/tabledata/vacc_table_faktenblatt.json')
      .subscribe(data => {
        this.stand_impfungen_data = data;
      });

    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_lieferungen.json')
      .subscribe(data => {
        this.dosen_projektion_all_hersteller = data;
        this.update_kapazitaet();
      });

    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_start.json')
      .subscribe(data => {
        this.stand_impfungen_hersteller = data;
      });


    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_data.json')
      .subscribe(data => {
        this.dosen_projektion_all = data;



      });

  }

  update_kapazitaet() {
    this.dosen_projektion = this.filterArray(this.filterArray(this.dosen_projektion_all, "geo", this.current_bl), "Verteilungsszenario", this.params.verteilungszenario);
    this.stand_impfungen_bund = this.filterArray(this.stand_impfungen_data, "Bundesland", this.current_bl)[0];
    this.filter_newdata();
    this.update_params();

  }


  update_params() {
    this.params.impflinge = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "EW_20plus")[0];
    this.bev_anteil_land = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "Anteil_20plus")[0];
    this.impfkapazitaet_land = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "Impfkapazitaet")[0];
    if (this.land_changed) {
      this.params.n_impfzentren = 433 * this.impfkapazitaet_land / this.impfkapazitaet_bund;
      this.params.n_varzt = 50000 * this.bev_anteil_land / 100;
      this.land_changed = false;
    }
    let params = this.params;
    this.params.kapazitaet_pro_tag =
      (params.impfzentren_tage * params.n_impfzentren * params.n_impfzentren_pat +
        params.varzt_tage * params.n_varzt * params.n_varzt_pat) * 1 / 7;
    this.params.kapazitaet_pro_woche = this.params.kapazitaet_pro_tag * 7;
    this.do_simulation(this.dosen_projektion, this.params);
    this.do_simulation_new(this.dosen_projektion_all_hersteller_filtered, this.params);
    this.simple_aerzte_impfen = this.params.varzt_tage > 0;
    this.simple_alle_zulassen = this.params.impfstoffart != "zugelassen";
  }

  change_simple() {
    if (this.simple_aerzte_impfen) {
      this.params.varzt_tage = 5;
    }
    else {
      this.params.varzt_tage = 0;
    }
    if (this.simple_alle_zulassen) {
      this.params.impfstoffart = 'alle';
    }
    else {
      this.params.impfstoffart = 'zugelassen';

    }
    this.update_kapazitaet();

  }

  filter_newdata() {
    this.dosen_projektion_all_hersteller_filtered = this.filterArray(this.filterArray(this.dosen_projektion_all_hersteller, "Bundesland", this.current_bl), "Verteilungsszenario", this.params.verteilungszenario);
    if (this.params.impfstoffart == 'zugelassen') {
      this.dosen_projektion_all_hersteller_filtered = this.filterArray(this.dosen_projektion_all_hersteller_filtered, 'zugelassen', 1);
    }
    this.herstellerliste = this.getValues(this.sortArray(this.filterArray(this.dosen_projektion_all_hersteller_filtered, "kw", this.dosen_projektion_all_hersteller_filtered[0]["kw"]), 'prioritaet'), "hersteller");
  }

  do_simulation_new(myinput, params) {
    let szenario = params.verteilungszenario;
    let kapazitaet = params.kapazitaet_pro_woche;
    let impflinge = params.impflinge;
    let liefermenge = params.liefermenge;
    let warten_dosis_2 = params.warten_dosis_2;
    let input = myinput;
    let hersteller = this.herstellerliste;
    let time: Array<number> = this.getValues(this.sortArray(this.filterArray(input, "hersteller", hersteller[0]), 'kw'), "kw");
    let firstweek = time[0];
    let impfstand = this.filterArray(this.stand_impfungen_hersteller, "geo", this.current_bl);
    let result_erstimpfungen = [];
    let result_zweitimpfungen = [];
    let finalresult = [];
    let riskinfo = {};
    let riskgroup = this.n_risikogruppen;
    let riskgroup_i = 0;
    this.risktimes = [];

    console.log("NEW SIM");
    console.log("TIME", time);
    console.log("Hersteller", hersteller);

    // Schleife Zeit
    console.log("Auswahl:", myinput[0]['Bundesland'], myinput[0]['Verteilungsszenario']);
    console.log("Datenstruktur Impfstand", impfstand);
    console.log("Datenstruktur Dosen", myinput[0]);
    for (const thewoche of time) {
      let kapazitaet_verbleibend = kapazitaet;
      // Zweitimpfungen Startwoche
      if (thewoche == firstweek) {
        // Schleife Hersteller Zweitimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          // Nur falls Hersteller 2 Anwendungen
          if (theinput["anwendungen"] == 2) {
            let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
            let topush = {};
            topush['hersteller'] = thehersteller;
            topush['kw'] = thewoche;
            topush['population'] = theinput['ueber18'];
            topush['anwendungen'] = 2;
            topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
            topush['dosen_geliefert'] = theinput['dosen_kw'] * liefermenge + impfstand_hersteller['dosen_geliefert'];
            topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
            topush['dosen_verfuegbar'] = theinput['dosen_kw'] * liefermenge + impfstand_hersteller['dosen_geliefert']-theinput['dosen_verabreicht_erst']-theinput['dosen_verabreicht_zweit'];
            topush['impfungen'] = Math.min(topush['dosen_verfuegbar'],kapazitaet_verbleibend,theinput['warteschlange_zweit_kw']);
            topush['impfungen_zweit'] = Math.min(topush['dosen_verfuegbar'],kapazitaet_verbleibend,theinput['warteschlange_zweit_kw']);
            topush['verbleibend_in_warteschlange_zweit_kw']= theinput['warteschlange_zweit_kw']-topush['impfungen'];
            kapazitaet_verbleibend = kapazitaet_verbleibend-topush['impfungen'];
            topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
            topush['patienten_geimpft'] = theinput['dosen_verabreicht_zweit'] +topush['impfungen'];
            topush['dosenspeicher'] = topush['dosen_verfuegbar'] -topush['impfungen'];
            result_zweitimpfungen.push(topush);
          }
        }

        // Schleife Hersteller Erstimpfung
       for (const thehersteller of hersteller) {
        let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
        let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
        let info_zweitimpfungen_aktuelle_woche = 0;
        let dosen_verfuegbar = theinput['dosen_kw']* liefermenge + impfstand_hersteller['dosen_geliefert']-theinput['dosen_verabreicht_erst']-theinput['dosen_verabreicht_zweit'];
        if (theinput["anwendungen"] == 2) {
        info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
        dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
        }
        
        let ruecklage = Math.round(dosen_verfuegbar*theinput['ruecklage']);
        let topush = {};  
        topush['hersteller'] = thehersteller;
        topush['kw'] = thewoche; 
        topush['population'] = theinput['ueber18'];  
        topush['anwendungen'] = theinput['anwendungen'];   
        topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
        topush['dosenlieferung_kw'] = theinput["dosen_kw"]* liefermenge;
        topush['dosen_verfuegbar'] = dosen_verfuegbar;
        topush['impfungen'] = Math.min(topush['dosen_verfuegbar']-ruecklage,kapazitaet_verbleibend);
        topush['impfungen_erst'] = topush['impfungen'];
        kapazitaet_verbleibend = kapazitaet_verbleibend-topush['impfungen'];
        topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
        topush['patienten_geimpft'] = 0;
        if (theinput["anwendungen"] == 1) {
        topush['patienten_geimpft'] = topush['dosen_verabreicht_erst'] +topush['impfungen'];
        }
        topush['dosenspeicher'] = topush['dosen_verfuegbar'] -topush['impfungen'];
        result_erstimpfungen.push(topush); 
        
      }


      }
      //  Folgewochen
      if ((thewoche > firstweek)) { //  && (thewoche <=(firstweek+10))
        // Schleife Hersteller Zweitimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];  
          let abstand = 4 ;  
          if (theinput['abstand']){
            abstand = theinput['abstand'];
          }
          // Nur falls Hersteller 2 Anwendungen
          if (theinput["anwendungen"] == 2) {
            let vorwoche = thewoche-1;
            let lastweek_erst = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw",vorwoche )[0];
            let lastweek_zweit = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", vorwoche)[0];
            // Bedarf aus zurückliegenden Erstimpfungen seit firstweek
            let previous_erst = 0;
            if ((thewoche-abstand)>=firstweek){
              let tocheck = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw",thewoche-abstand)[0]['impfungen'];
              if (tocheck){
                previous_erst = tocheck;
              }
            }            
            let topush = {};
            topush['hersteller'] = thehersteller;
            topush['kw'] = thewoche;
            topush['anwendungen'] = 2;
            topush['population'] = theinput['ueber18'];  
            topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
            topush['dosenlieferung_kw'] = theinput["dosen_kw"]* liefermenge;
            topush['dosen_verfuegbar'] = theinput['dosen_kw']* liefermenge + lastweek_erst['dosenspeicher'];
            topush['bedarf_neu_erstimpfungen_abstand'] = previous_erst;
            topush['bedarf_aus_warteschlange'] = theinput['warteschlange_zweit_kw']+lastweek_zweit['verbleibend_in_warteschlange_zweit_kw'];
            topush['bedarf__gesamt']=topush['bedarf_neu_erstimpfungen_abstand']+topush['bedarf_aus_warteschlange'];
            topush['impfungen'] = Math.min(topush['dosen_verfuegbar'],kapazitaet_verbleibend,topush['bedarf__gesamt']);
            topush['impfungen_zweit'] = topush['impfungen'];
            topush['verbleibend_in_warteschlange_zweit_kw']= topush['bedarf__gesamt']-topush['impfungen'];
            kapazitaet_verbleibend = kapazitaet_verbleibend-topush['impfungen'];
            topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
            topush['patienten_geimpft'] = lastweek_zweit['patienten_geimpft'] +topush['impfungen'];
            topush['dosenspeicher'] = topush['dosen_verfuegbar'] -topush['impfungen']; 
            result_zweitimpfungen.push(topush);
          }
        }

        // Schleife Hersteller Erstimpfung
       for (const thehersteller of hersteller) {
        let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
        let vorwoche = thewoche-1;
        let lastweek_erst = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw",vorwoche )[0];
        let info_zweitimpfungen_aktuelle_woche = 0;
        let dosen_verfuegbar = theinput['dosen_kw']* liefermenge + lastweek_erst['dosenspeicher'];
        if (theinput["anwendungen"] == 2) {
        info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
        dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
        }
        
        let ruecklage = Math.round(dosen_verfuegbar*theinput['ruecklage']);
        let topush = {};  
        topush['hersteller'] = thehersteller;
        topush['kw'] = thewoche;      
        topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
        topush['dosenlieferung_kw'] = theinput["dosen_kw"]* liefermenge;
        topush['dosen_verfuegbar'] = dosen_verfuegbar;
        topush['impfungen'] = Math.min(topush['dosen_verfuegbar']-ruecklage,kapazitaet_verbleibend);
        topush['impfungen_erst'] = topush['impfungen'];
        kapazitaet_verbleibend = kapazitaet_verbleibend-topush['impfungen'];
        topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
        topush['patienten_geimpft'] = 0;
        if (theinput["anwendungen"] == 1) {
        topush['patienten_geimpft'] = topush['dosen_verabreicht_erst'] +topush['impfungen'];
        }
        topush['dosenspeicher'] = topush['dosen_verfuegbar'] -topush['impfungen'];
        result_erstimpfungen.push(topush);         
      }        
      }      
    }
    // Aggregation der Ergebnisse
    for (const thewoche of time) {
      let gesamtinput_immunisierung = this.filterArray(this.filterArray(result_zweitimpfungen,'kw',thewoche),"anwendungen",2).concat(this.filterArray(this.filterArray(result_erstimpfungen,'kw',thewoche),"anwendungen",1));
      let gesamtinput_alle = this.filterArray(result_zweitimpfungen,'kw',thewoche).concat(this.filterArray(result_erstimpfungen,'kw',thewoche));

      if (gesamtinput_immunisierung.length>0){
      let topush = {};
      topush['kw'] = thewoche;
      topush['date'] = this.getDateOfISOWeek(thewoche,2020);
      topush['kapazitaet'] = kapazitaet;
      topush['population'] = this.getValues(gesamtinput_immunisierung,'population')[0];
      topush['Gelieferte Dosen'] = this.sumArray(this.getValues(gesamtinput_immunisierung,'dosenlieferung_kw'));
      topush['Verfügbare Dosen'] = this.sumArray(this.getValues(gesamtinput_immunisierung,'dosen_verfuegbar'));
      topush['Verimpfte Dosen'] = this.sumArray(this.getValues(gesamtinput_alle,'impfungen'));
      topush['Auslastung'] = 100 * (topush['Verimpfte Dosen'] / kapazitaet) ;
      topush['Unverimpfte Dosen'] = topush['Verfügbare Dosen']-topush['Verimpfte Dosen'];
      topush['immunisierungen'] = this.sumArray(this.getValues(gesamtinput_immunisierung,'impfungen'));      
      topush['patienten_durchgeimpft'] = this.sumArray(this.getValues(gesamtinput_immunisierung,'patienten_geimpft'));
      topush['Anteil Durchimpfung'] = 100* (topush['patienten_durchgeimpft']/ topush['population']);
      if (topush['Anteil Durchimpfung']>100 ){
        topush['Anteil Durchimpfung']=100;
        topush['patienten_durchgeimpft']=topush['population'];
        topush['Auslastung']= 0;
        // topush['Unverimpfte Dosen']  = topush['Unverimpfte Dosen'] + topush['Verimpfte Dosen'] ;
        topush['Verimpfte Dosen'] = 0;                
      }

      // Check who is done
    if (riskgroup.length >= (riskgroup_i + 1)) {
      if ((topush['Anteil Durchimpfung'] / 100) >= riskgroup[riskgroup_i].anteil) {
        topush['riskgroup_done'] = riskgroup[riskgroup_i].Stufe;
        riskinfo = riskgroup[riskgroup_i];
        riskinfo["kw"] = thewoche;
        riskinfo["Datum"] = this.getDateOfISOWeek(thewoche,2020);
        riskinfo["_Quote"] = topush['Anteil Durchimpfung'] / 100;
        this.risktimes.push(riskinfo);
        riskgroup_i = riskgroup_i + 1;
      };
    }

      finalresult.push(topush);
      }
    }

    this.new_simresult = finalresult;


    

    console.log('Datenstruktur finalresult:',finalresult[0]);




  }

  do_simulation(myinput, params) {
    let szenario = params.verteilungszenario;
    let kapazitaet = params.kapazitaet_pro_woche;
    let impflinge = params.impflinge;
    let liefermenge = params.liefermenge;
    let warten_dosis_2 = params.warten_dosis_2;
    let input = myinput;
    let result = [];
    let finalresult = [];
    let riskinfo = {};
    this.risktimes = [];
    let riskgroup = this.n_risikogruppen;
    let riskgroup_i = 0;

    // Loop over weeks
    for (var _i = 0; _i < input.length; _i++) {
      // Firs week
      let current_item = input[_i];
      let thedosen = current_item.Dosen;
      let thepatienten = current_item.Patienten;
      if (params.impfstoffart == "zugelassen") {
        thedosen = current_item.dosen_zugelassen;
        thepatienten = current_item.patienten_zugelassen;
      }
      current_item['Dosen_aktuell'] = 0;
      if (_i > 0) {
        current_item['Dosen_aktuell'] = thedosen * liefermenge + result[result.length - 1].Rest_Dosen;
        current_item['Patienten_aktuell'] = thepatienten * liefermenge + result[result.length - 1].Rest_Patienten;
      }
      else {
        current_item['Dosen_aktuell'] = thedosen * liefermenge;
        current_item['Patienten_aktuell'] = thepatienten * liefermenge;
      }
      current_item['Dosen verfügbar'] = thedosen * liefermenge;
      current_item['Anteil'] = current_item.Dosen_aktuell / kapazitaet;
      if (current_item.Anteil > 1) {
        current_item['Anwendung'] = current_item.Dosen_aktuell * (1 / current_item.Anteil);
        current_item['Anwendung_Patienten'] = current_item.Patienten_aktuell * (1 / current_item.Anteil);
        current_item['Rest_Dosen'] = current_item.Dosen_aktuell - current_item['Anwendung'];
        current_item['Rest_Patienten'] = current_item.Patienten_aktuell - current_item['Anwendung_Patienten'];
      }
      else {
        current_item['Anwendung'] = current_item.Dosen_aktuell;
        current_item['Anwendung_Patienten'] = current_item.Patienten_aktuell;
        current_item['Rest_Dosen'] = 0;
        current_item['Rest_Patienten'] = 0;
      }
      if (_i > 0) {
        current_item['Anwendung_kum'] = current_item.Anwendung + result[_i - 1].Anwendung_kum;
        current_item['Anwendung_Patienten_kum'] = current_item.Anwendung_Patienten + result[_i - 1].Anwendung_Patienten_kum;
        current_item['Impfquote'] = 100 * (current_item['Anwendung_Patienten_kum']) / impflinge;
      }
      else {
        current_item['Anwendung_kum'] = current_item.Anwendung + this.stand_impfungen_bund['Zahl der Impfungen gesamt'];
        current_item['Anwendung_Patienten_kum'] = current_item.Anwendung_Patienten + this.stand_impfungen_bund['Zahl der Impfungen gesamt'] / 2;
      }


      result.push(current_item);

      if (current_item.Anwendung_Patienten_kum <= impflinge) {
        finalresult.push(current_item);
      }
      else {
        current_item['Anwendung_Patienten_kum'] = impflinge;
        current_item['Impfquote'] = 100;
        finalresult.push(current_item);
      }

      // Check who is done
      if (riskgroup.length >= (riskgroup_i + 1)) {
        if ((current_item['Impfquote'] / 100) >= riskgroup[riskgroup_i].anteil) {
          current_item['riskgroup_done'] = riskgroup[riskgroup_i].Stufe;
          riskinfo = riskgroup[riskgroup_i];
          riskinfo["kw"] = current_item.kw;
          riskinfo["Datum"] = input[_i].maxdate;
          riskinfo["_Quote"] = current_item.Impfquote / 100;
          this.risktimes.push(riskinfo);
          riskgroup_i = riskgroup_i + 1;
        };
      }

    }

    while ((riskgroup_i + 1) <= 6) {
      riskinfo = riskgroup[riskgroup_i];
      riskinfo["Datum"] = "nie";
      this.risktimes.push(riskinfo);
      riskgroup_i = riskgroup_i + 1;
    }



    this.sim_result = finalresult;

  }

  update_days_since_start() {
    let date1 = new Date("2020-12-26");
    let date2 = new Date();
    this.days_since_start = Number((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));


  }

  // HELPER FUNCTIONS

  getValues(array, key) {
    let values = [];
    for (let item of array) {
      if (item[key]){
        values.push(item[key]);
      }      
    }
    return values;
  }
  getKeys(array) {
    return Object.keys(array[0]);
  }

  getOptions(array, key) {
    return array.map(item => item[key])
      .filter((value, index, self) => self.indexOf(value) === index)
  }

  filterArray(array, key, value) {
    let i = 0
    let result = []
    for (let item of array) {
      if (item[key] == value) { result.push(item) };
      i = i + 1
    }
    return result
  }

  sortArray(array, key, order = "ascending") {
    let result = array;
    if (order == "ascending") {
      return result.sort((a, b) => (a[key] < b[key] ? -1 : 1));
    }
    else {
      return result.sort((a, b) => (a[key] > b[key] ? -1 : 1));
    }



  }

  sumArray(array){
    return array.reduce((a, b) => a + b, 0);    
  }

  getDateOfISOWeek(w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart.toISOString().substring(0, 10);
}
}
