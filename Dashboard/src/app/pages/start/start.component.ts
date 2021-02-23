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
  stand_impfungen_hersteller: any;
  stand_impfungen_data_aktuell: any;
  geo_lieferungen_bisher:any;
  stand_impfungen_data_aktuell_current: any;
  bev_anteil_land: number;
  impfkapazitaet_land: number;
  impfkapazitaet_bund: number;
  herstellerliste: any;
  land_changed: boolean;
  dosen_projektion_all: any;
  dosen_projektion_all_hersteller: any;
  dosen_projektion_all_hersteller_filtered: any;
  current_bl = "Gesamt";
  sim_result: any;
  new_simresult: any;
  all_bl_simresults: any;
  notstarted=true;
  time_until_start:number;
  days_since_start: number;
  risktimes = [];
  risktimes_firstdose = [];
  n_risikogruppen = [
    { Stufe: 1, n: 8.6, anteil: 0.12672396908 },
    { Stufe: 2, n: 7.0, anteil: 0.22987138578 },
    { Stufe: 3, n: 5.7, anteil: 0.31386285366 },
    { Stufe: 4, n: 6.9, anteil: 0.41553673583 },
    { Stufe: 5, n: 8.4, anteil: 0.53931363587 },
    { Stufe: 6, n: 31.26, anteil: 0.99 },
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
    addweekstoabstand: 0,
    impfstoffart: "zugelassen",
    ruecklage: true,
    verteilungszenario: this.verteilungszenarien[1]
  };
  updateinput: any;
  timer:Date;
  startdate= new Date();
  startportal= new Date("2021-02-24 08:30 UTC+1");


  ngOnInit(): void {
    window.scrollTo(0, 0);
    if (Number(this.startdate)-Number(this.startportal)<0){
      this.check_portal_online();
    }
    else {
      this.notstarted=false;
    }
    
    this.update_days_since_start();
    this.token = this.route.snapshot.queryParams['token'] === this.valid_token;
    

    if (this.token || !this.notstarted) {
     this.loaddata();
     // Import some public data    

    }
  }

  loaddata(){
    this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/bl.geojson')
        .subscribe(data => { this.map = data; })

      this.http.get('https://www.zidatasciencelab.de/cov19vaccsim/assets/data/ewz_bl.json')
        .subscribe(data => {
          this.ewz_bl = data;
          this.bl_liste = this.getValues(this.ewz_bl, "Bundesland");
          this.impfkapazitaet_bund = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", "Gesamt"), "Impfkapazitaet")[0];
          this.getexternaldata();
        });
  }

  getexternaldata() {
    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/vacc_table_vaccsim.json')
      .subscribe(data => {
        this.stand_impfungen_data_aktuell = data;
        this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_start.json')
          .subscribe(data => {
            this.stand_impfungen_hersteller = data;
            this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_lieferungen.json')
              .subscribe(data => {
                this.dosen_projektion_all_hersteller = data;
                this.update_kapazitaet();
              });
          });

      });

  }

  update_kapazitaet() {
    this.stand_impfungen_data_aktuell_current = this.filterArray(this.stand_impfungen_data_aktuell, "Bundesland", this.current_bl)[0];
    this.geo_lieferungen_bisher=this.sumArray(this.getValues(this.filterArray(this.stand_impfungen_hersteller,'geo',this.current_bl),'dosen_geliefert'));
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
    this.new_simresult = this.do_simulation_new(this.dosen_projektion_all_hersteller_filtered, this.params);
    this.risktimes= this.update_risktimes(this.new_simresult,'Anteil Durchimpfung');
    this.risktimes_firstdose= this.update_risktimes(this.new_simresult,'Anteil Erst-Dosis');
    // this.all_bl_simresults = this.all_region_sim();
    // console.log(this.risktimes,this.risktimes_firstdose);
    
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
    let kapazitaet = params.kapazitaet_pro_woche;
    let liefermenge = params.liefermenge;
    let theruecklage = params.ruecklage;
    let addtheweekstoabstand = params.addweekstoabstand;
    let input = myinput;
    let hersteller = this.herstellerliste;
    let time: Array<number> = this.getValues(this.sortArray(this.filterArray(input, "hersteller", hersteller[0]), 'kw'), "kw");
    let firstweek = time[0];
    let impfstand = this.filterArray(this.stand_impfungen_hersteller, "geo", this.current_bl);
    let result_erstimpfungen = [];
    let result_zweitimpfungen = [];
    let finalresult = [];

    // Schleife Zeit
    for (const thewoche of time) {
      let kapazitaet_verbleibend = kapazitaet;

      // Zweitimpfungen Startwoche
      if (thewoche == firstweek) {
        // Schleife Hersteller Zweitimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
          let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + impfstand_hersteller['dosen_geliefert'] - theinput['dosen_verabreicht_erst'] - theinput['dosen_verabreicht_zweit'];
          // Nur falls Hersteller 2 Anwendungen
          if (theinput["anwendungen"] == 2) {            
            let topush = {};
            topush['hersteller'] = thehersteller;
            topush['kw'] = thewoche;
            topush['population'] = theinput['ueber18'];
            topush['anwendungen'] = 2;
            topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
            topush['dosen_geliefert'] = theinput['dosen_kw'] * liefermenge ;
            topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
            topush['dosen_verfuegbar'] = dosen_verfuegbar;
            topush['impfungen'] = Math.min(topush['dosen_verfuegbar'], kapazitaet_verbleibend, theinput['warteschlange_zweit_kw']);
            topush['impfungen_zweit'] = Math.min(topush['dosen_verfuegbar'], kapazitaet_verbleibend, theinput['warteschlange_zweit_kw']);
            topush['verbleibend_in_warteschlange_zweit_kw'] = theinput['warteschlange_zweit_kw'] - topush['impfungen'];
            kapazitaet_verbleibend = kapazitaet_verbleibend - topush['impfungen'];
            topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
            topush['patienten_geimpft'] = theinput['dosen_verabreicht_zweit'] + topush['impfungen'];
            topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen'];
            result_zweitimpfungen.push(topush);
          }
        }

        // Schleife Hersteller Erstimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
          let info_zweitimpfungen_aktuelle_woche = 0;
          let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + impfstand_hersteller['dosen_geliefert'] - theinput['dosen_verabreicht_erst'] - theinput['dosen_verabreicht_zweit'];
          if (theinput["anwendungen"] == 2) {
            info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
            dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
          }

          let ruecklage = Math.round(dosen_verfuegbar * theinput['ruecklage']);
          if (!theruecklage) {
            ruecklage = 0;
          }
          let topush = {};
          topush['hersteller'] = thehersteller;
          topush['kw'] = thewoche;
          topush['population'] = theinput['ueber18'];
          topush['anwendungen'] = theinput['anwendungen'];
          topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
          topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
          topush['dosen_verfuegbar'] = dosen_verfuegbar - ruecklage;
          topush['impfungen'] = Math.min(topush['dosen_verfuegbar'] , kapazitaet_verbleibend);
          topush['impfungen_erst_kum'] = topush['impfungen'] + impfstand_hersteller['dosen_verabreicht_erst'];
          kapazitaet_verbleibend = kapazitaet_verbleibend - topush['impfungen'];
          topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
          topush['patienten_geimpft'] = 0;
          if (theinput["anwendungen"] == 1) {
            topush['patienten_geimpft'] = theinput['dosen_verabreicht_erst'] + topush['impfungen'];
          }
          topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen'] +  ruecklage;
          topush['dosenspeicher_ruecklage'] = ruecklage;
          result_erstimpfungen.push(topush);

        }


      }
      //  Folgewochen
      if ((thewoche > firstweek)) { //  && (thewoche <=(firstweek+10))
        // Zweitimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let abstand = theinput['abstand'] + addtheweekstoabstand;
          // Nur falls Hersteller 2 Anwendungen
          if (theinput["anwendungen"] == 2) {
            let vorwoche = thewoche - 1;
            let lastweek_erst = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw", vorwoche)[0];
            let lastweek_zweit = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", vorwoche)[0];
            let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + lastweek_erst['dosenspeicher'];
            // Bedarf aus zurückliegenden Erstimpfungen seit firstweek
            let previous_erst = 0;
            if ((thewoche - abstand) >= firstweek) {
              let tocheck = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw", thewoche - abstand)[0]['impfungen'];
              if (tocheck) {
                previous_erst = tocheck;
              }
            }
            let topush = {};
            topush['hersteller'] = thehersteller;
            topush['kw'] = thewoche;
            topush['anwendungen'] = 2;
            topush['population'] = theinput['ueber18'];
            topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
            topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
            topush['dosen_verfuegbar'] = dosen_verfuegbar;
            topush['bedarf_neu_erstimpfungen_abstand'] = previous_erst;
            topush['bedarf_aus_warteschlange'] = theinput['warteschlange_zweit_kw'] + lastweek_zweit['verbleibend_in_warteschlange_zweit_kw'];
            topush['bedarf__gesamt'] = topush['bedarf_neu_erstimpfungen_abstand'] + topush['bedarf_aus_warteschlange'];
            topush['impfungen'] = Math.min(topush['dosen_verfuegbar'], topush['kapazitaet__vorher'], topush['bedarf__gesamt']);
            topush['impfungen_zweit'] = topush['impfungen'];
            topush['verbleibend_in_warteschlange_zweit_kw'] = topush['bedarf__gesamt'] - topush['impfungen'];
            kapazitaet_verbleibend = kapazitaet_verbleibend - topush['impfungen'];
            topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
            topush['patienten_geimpft'] = lastweek_zweit['patienten_geimpft'] + topush['impfungen'];
            topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen'];
            result_zweitimpfungen.push(topush);
          }
        }

        // Erstimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let vorwoche = thewoche - 1;
          let lastweek_erst = this.filterArray(this.filterArray(result_erstimpfungen, "hersteller", thehersteller), "kw", vorwoche)[0];
          let info_zweitimpfungen_aktuelle_woche = 0;
          let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + lastweek_erst['dosenspeicher'];
          let ruecklage = 0;
          if (theinput["anwendungen"] == 2) {
            info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
            dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
            ruecklage = Math.round(dosen_verfuegbar * theinput['ruecklage']);
          }

          
          if (!theruecklage || theinput["anwendungen"] == 1) {
            ruecklage = 0;
          }
          let topush = {};
          topush['hersteller'] = thehersteller;
          topush['kw'] = thewoche;
          topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
          topush['dosenlieferung_kw'] = theinput["dosen_kw"];
          topush['dosen_verfuegbar'] = dosen_verfuegbar  - ruecklage;
          topush['impfungen'] = Math.min(topush['dosen_verfuegbar'], kapazitaet_verbleibend);
          topush['impfungen_erst_kum'] = topush['impfungen'] + lastweek_erst['impfungen_erst_kum'];
          kapazitaet_verbleibend = topush['kapazitaet__vorher'] - topush['impfungen'];
          topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
          topush['patienten_geimpft'] = 0;
          if (theinput["anwendungen"] == 1) {
            topush['patienten_geimpft'] = lastweek_erst['patienten_geimpft'] + topush['impfungen'];
          }
          topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen']+ruecklage;
          topush['dosenspeicher_ruecklage'] = ruecklage;
          result_erstimpfungen.push(topush);
        }
      }
    }
    // Aggregation der Ergebnisse
    for (const thewoche of time) {
      let input_erst  = this.filterArray(result_erstimpfungen, 'kw', thewoche);
      let input_zweit = this.filterArray(result_zweitimpfungen, 'kw', thewoche);

      if ((input_erst.length+input_zweit.length) > 0) {
        let topush = {};
        topush['kw'] = thewoche;
        topush['date'] = this.getDateOfISOWeek(thewoche, 2021);
        topush['kapazitaet'] = kapazitaet;
        topush['population'] = this.getValues(input_zweit, 'population')[0];
        topush['Gelieferte Dosen'] = 
          this.sumArray(this.getValues(this.filterArray(input_erst, 'anwendungen', 1), 'dosenlieferung_kw'))+
          this.sumArray(this.getValues(this.filterArray(input_zweit, 'anwendungen', 2), 'dosenlieferung_kw'));
        topush['Verfügbare Dosen'] = 
          this.sumArray(this.getValues(input_zweit, 'dosen_verfuegbar'));       
          this.sumArray(this.getValues(input_erst, 'dosen_verfuegbar'));       
        topush['Verimpfte Dosen'] = 
          this.sumArray(this.getValues(input_erst, 'impfungen'))+
          this.sumArray(this.getValues(input_zweit, 'impfungen'));       
        topush['Verimpfte Erst-Dosen'] = 
          this.sumArray(this.getValues(input_erst, 'impfungen_erst_kum'));
        topush['Auslastung'] = 100 * (topush['Verimpfte Dosen'] / kapazitaet);
        topush['Unverimpfte Dosen'] = topush['Verfügbare Dosen'] - topush['Verimpfte Dosen'];
        topush['patienten_durchgeimpft'] = 
          this.sumArray(this.getValues(input_erst, 'patienten_geimpft'))+
          this.sumArray(this.getValues(input_zweit, 'patienten_geimpft'));  
        topush['Wartschlange Zweitimpfung'] = 
          this.sumArray(this.getValues(input_zweit, 'verbleibend_in_warteschlange_zweit_kw'));

        // Korrektur Durchimpfung abgeschlossen
        topush['Anteil Durchimpfung'] = 100 * (topush['patienten_durchgeimpft'] / topush['population']);
        topush['Anteil Erst-Dosis'] = 100 * (topush['Verimpfte Erst-Dosen'] / topush['population']);
        if (topush['Anteil Durchimpfung'] > 100) {
          topush['Anteil Durchimpfung'] = 100;
          topush['patienten_durchgeimpft'] = topush['population'];
          topush['Auslastung'] = 0;
          topush['Unverimpfte Dosen'] = 0;
          topush['Verimpfte Dosen'] = 0;
          topush['Wartschlange Zweitimpfung'] = 0;
        }

        if (topush['Anteil Erst-Dosis'] > 100) {
          topush['Anteil Erst-Dosis'] = 100;
          topush['Verimpfte Erst-Dosen'] = topush['population'];
        }

        finalresult.push(topush)
      }
    }
    return finalresult;
  }


  update_risktimes(simresult,indicator) {
    let time: Array<number> = this.getValues(this.sortArray(simresult, 'kw'), "kw");
    let riskinfo = {};
    let riskgroup = this.n_risikogruppen;
    let riskgroup_i = 0;
    let risktimes = [];
    

    // Check who is done
    for (const thewoche of time) {
      let anteil_durchimpfung = this.filterArray(simresult, 'kw', thewoche)[0][indicator]/100;
      let Stufe = riskgroup[riskgroup_i]['Stufe']
      let Anteil = riskgroup[riskgroup_i]['anteil']
      let kapazitaet = this.filterArray(simresult, 'kw', thewoche)[0]['kapazitaet'];
      if (riskgroup.length > (riskgroup_i + 1)) {
        if (anteil_durchimpfung >= riskgroup[riskgroup_i].anteil) {
          riskinfo = {'Stufe': Stufe};
          riskinfo["Datum"] = this.getDateOfISOWeek(thewoche, 2021);
          riskinfo["_Quote"] = anteil_durchimpfung;
          riskinfo["_kapazitaet"] = kapazitaet;
          riskinfo['Anteil'] = Anteil;
          risktimes.push(riskinfo);
          riskgroup_i = riskgroup_i + 1;
        };
      }
    }

    while ((riskgroup_i + 1) <= 6) {
      riskinfo = riskgroup[riskgroup_i];
      riskinfo["Datum"] = "nie";
      risktimes.push(riskinfo);
      riskgroup_i = riskgroup_i + 1;
    }

    return risktimes;
  }


  all_region_sim(){
    let result = [];
    let regions = this.bl_liste;
    // Full dataset
    let fulldata = this.filterArray(this.dosen_projektion_all_hersteller, "Verteilungsszenario", this.params.verteilungszenario);
    if (this.params.impfstoffart == 'zugelassen') {
      fulldata = this.filterArray(fulldata, 'zugelassen', 1);      
    }

    let inputparams = this.params;
    let soll_impfkapazitaet = this.impfkapazitaet_land*7;
    let ist_impfkapazitaet = this.params.kapazitaet_pro_woche;
    let vh_zu_soll= (ist_impfkapazitaet/soll_impfkapazitaet);
    
    for (let bundesland of regions){
      let batch = this.filterArray(fulldata, "Bundesland", bundesland);
      let impfkapazitaet_land = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", bundesland), "Impfkapazitaet")[0];
      let localparams = {};
      localparams['kapazitaet_pro_woche']=impfkapazitaet_land*vh_zu_soll;
      localparams['liefermenge']=inputparams.liefermenge;
      localparams['ruecklage']=inputparams.ruecklage;
      localparams['addweekstoabstand']=inputparams.addweekstoabstand;
      let localresult = this.do_simulation_new(batch, localparams);
      let localrisktimes = {'Bundesland': bundesland, risktimes: this.update_risktimes(localresult,'Anteil Durchimpfung')};
      result.push(localrisktimes);
    }
    
    return result;    
  }

  make_nice_regiontable(){
    return ;
  }

  update_days_since_start() {
    let date1 = new Date("2020-12-26");
    let date2 = new Date();
    this.days_since_start = Number((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
  }

  check_portal_online() {
    let date1 = this.startportal;
    let date2 = new Date();
    let timediff = Number((date2.getTime() - date1.getTime()) / (1000));
    setInterval(() => {
       timediff=timediff+1;
       this.time_until_start=timediff;   
       if (timediff>0 && this.notstarted){
        this.notstarted=false;
        this.loaddata();
        return;
       }
  }, 1000);  
   
          
  }

  // HELPER FUNCTIONS

  getValues(array, key) {
    let values = [];
    for (let item of array) {
      if (item[key]) {
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

  sumArray(array) {
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
