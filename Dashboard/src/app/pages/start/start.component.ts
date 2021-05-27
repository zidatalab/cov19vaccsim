import { AnimationFactory } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { unsupported } from '@angular/compiler/src/render3/view/util';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CsvexportService } from 'src/app/services/csvexport.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {


 

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private csv: CsvexportService) { }

  // Plan B
  showdurchimpfung = true;
  datenexport = false;
  mode = "simple";
  simple_aerzte_impfen = false;
  simple_alle_zulassen = false;
  impfstand_rki: any;
  map: any;
  token: any;
  // Einfacher Schutz, wer ihn aushebelt ist nicht nett. Kann sich aber bei mir melden,
  valid_token = "zugang_valid_mp_salz_8_bmg";
  ewz_bl: any;
  stand_impfungen_data: any;
  bl_liste: Array<string>;
  stand_impfungen_hersteller: any;
  kapazitaetsstand: string;
  hersteller_zugelassen: any;
  hersteller_zugelassen_details: any;
  hersteller_nicht_zugelassen: any;
  hersteller_add_nicht_zugelassen: any;

  stand_impfungen_data_aktuell: any;
  geo_lieferungen_bisher: any;
  stand_impfungen_data_aktuell_current: any;
  bev_anteil_land: number;
  impfkapazitaet_land: number;
  impfkapazitaet_bund: number;
  stand_bmg_lieferungen: any;
  herstellerliste: any;
  hst_lager: any;
  geo_impfstand: any;
  news: any = [];
  land_changed: boolean;
  dosen_projektion_all: any;
  dosen_projektion_all_hersteller: any;
  dosen_projektion_all_hersteller_filtered: any;
  current_bl = "Gesamt";
  sim_result: any;
  ignorealter: boolean;
  new_simresult: any;
  all_bl_simresults: any;
  notstarted = true;
  time_until_start: number;
  days_since_start: number;
  risktimes = [];
  risktimes_firstdose = [];
  n_risikogruppen = [
    { Stufe: 1, n: 8.6, anteil:   (8.6)/83.166711 },
    { Stufe: 2, n: 7.0, anteil:   (8.6+7)/83.166711 },
    { Stufe: 3, n: 5.7, anteil:   (8.6+7+5.7)/83.166711 },
    { Stufe: 4, n: 6.9, anteil:   (8.6+7+5.7+6.9)/83.166711 },
    { Stufe: 5, n: 8.4, anteil:   (8.6+7+5.7+6.9+8.4)/83.166711 },
    { Stufe: 6, n: 31.26, anteil: (8.6+7+5.7+6.9+8.4+31.26)/83.166711},
    { Stufe: 7,  anteil: .88971},
    { Stufe: "", anteil: 1000000 },
    { Stufe: "", anteil: 1000000 }
  ];
  impfaltersgruppen = ['pop_ueber_60','pop_18_bis_60']; // ohne 'pop_unter_12',  'pop_12_bis_18',

  // Sim Params
  verteilungszenarien = ["Gleichverteilung", "Linearer Anstieg der Produktion in Q2"];
  params = {
    n_impfzentren_pat: 321429,
    n_varzt: 63000,
    n_varzt_pat: 50,
    varzt_tage: 4,
    kapazitaet_pro_tag: 0,
    kapazitaet_pro_woche: 0,
    warten_dosis_2: 5,
    liefermenge: 1.0,
    impflinge: 67864036,
    addweekstoabstand: 0,
    impfstoffart: "zugelassen",
    addhersteller: [],
    ruecklage: false,
    anteil_impfbereit: 1.0,
    verteilungszenario: this.verteilungszenarien[1],
    bntjgdliche:false
  };
  updateinput: any;
  timer: Date;
  startdate = new Date();
  startportal = new Date("2021-02-24 06:30 UTC+1");


  ngOnInit(): void {
    this.ignorealter=false;
    window.scrollTo(0, 0);
    if (Number(this.startdate) - Number(this.startportal) < 0) {
      this.check_portal_online();
    }
    else {
      this.notstarted = false;
    }

    this.update_days_since_start();
    this.token = this.route.snapshot.queryParams['token'] === this.valid_token;
    
    if (this.token || !this.notstarted) {
      this.loaddata();


    }




  }

  loaddata() {
    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/static/kapazitaeten.json')
      .subscribe(data => {
        this.kapazitaetsstand = data["stand"];
        this.ewz_bl = data["data"];
        this.bl_liste = this.getValues(this.ewz_bl, "Bundesland");
        this.sort_regions();
        this.impfkapazitaet_bund = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", "Gesamt"), "Impfkapazitaet")[0];
        this.params.n_impfzentren_pat = this.impfkapazitaet_bund;
        this.getexternaldata();
      });
  }

  sort_regions() {
    let input = this.bl_liste;
    input = input.filter(word => word != "Gesamt").sort();
    this.bl_liste = ["Gesamt"].concat(input);

  }

  getexternaldata() {
    this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/vacc_table_vaccsim.json')
      .subscribe(data => {
        this.stand_impfungen_data_aktuell = data;
        this.impfstand_rki = new Date(data[0]['Stand_letzteImpfung']);
        this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_start.json')
          .subscribe(data => {
            this.stand_impfungen_hersteller = data;
            let allhersteller = this.filterArray(this.stand_impfungen_hersteller, "geo", "Gesamt");
            this.hersteller_zugelassen = this.getValues(this.filterArray(allhersteller, "zugelassen", 1), "hersteller");
            this.params.addhersteller = this.getValues(this.filterArray(allhersteller, "zugelassen", 1), "hersteller");
            this.hersteller_zugelassen_details = this.filterArray(allhersteller, "zugelassen", 1);
            this.hersteller_nicht_zugelassen = this.filterArray(allhersteller, "zugelassen", 0);
            this.stand_bmg_lieferungen = new Date(data[0]['Stand_BMG']);

            this.http.get('https://raw.githubusercontent.com/zidatalab/covid19dashboard/master/data/tabledata/impfsim_lieferungen.json')
              .subscribe(data => {
                this.dosen_projektion_all_hersteller = data;
                this.update_kapazitaet();
              });

          });

      });
    this.http.get('https://www.zidatasciencelab.de/covid19dashboard/data/news/cov19vaccsim.json').subscribe(
      data => { this.news = data; }
    )


  }

  update_kapazitaet() {
    this.stand_impfungen_data_aktuell_current = this.filterArray(this.stand_impfungen_data_aktuell, "Bundesland", this.current_bl)[0];
    this.geo_lieferungen_bisher = this.sumArray(this.getValues(this.filterArray(this.stand_impfungen_hersteller, 'geo', this.current_bl), 'dosen_geliefert'));
    this.geo_impfstand = this.filterArray(this.stand_impfungen_hersteller, "geo", this.current_bl);
    this.filter_newdata();
    this.update_params();
    this.hst_lager = this.make_hersteller_overview(this.geo_impfstand);
  }


  update_params() {
    this.new_simresult = [];
    this.risktimes = [];
    this.risktimes_firstdose = [];
    this.params.impflinge = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "EW_20plus")[0];
    this.bev_anteil_land = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "Anteil_20plus")[0];
    this.impfkapazitaet_land = this.getValues(this.filterArray(this.ewz_bl, "Bundesland", this.current_bl), "Impfkapazitaet")[0];
    if (this.land_changed) {
      this.params.n_impfzentren_pat = this.impfkapazitaet_land;
      this.params.n_varzt = 50000 * this.bev_anteil_land / 100;
      this.land_changed = false;
    }
    let params = this.params;
    this.params.kapazitaet_pro_tag =
      params.n_impfzentren_pat + ((params.varzt_tage * params.n_varzt * params.n_varzt_pat) * 1 / 7);
    this.params.kapazitaet_pro_woche = this.params.kapazitaet_pro_tag * 7;
    this.new_simresult = this.do_simulation_new(this.dosen_projektion_all_hersteller_filtered, this.params);
    this.risktimes = this.update_risktimes(this.new_simresult, 'Anteil Durchimpfung');
    this.risktimes_firstdose = this.update_risktimes(this.new_simresult, 'Anteil Erst-Dosis');
    this.simple_aerzte_impfen = this.params.varzt_tage > 0;
    this.simple_alle_zulassen = this.params.impfstoffart != "zugelassen";
  }

  change_simple() {
    if (this.simple_aerzte_impfen) {
      this.params.varzt_tage = 4;
      this.params.n_varzt_pat = 50;
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
    let alldata = this.getDateforValueinArray(
      this.filterArray(this.filterArray(this.dosen_projektion_all_hersteller, "Bundesland", this.current_bl), "Verteilungsszenario", this.params.verteilungszenario), "kw", 2021);
    this.dosen_projektion_all_hersteller_filtered = alldata;

    if (this.params.impfstoffart == 'zugelassen') {
      this.dosen_projektion_all_hersteller_filtered = [];
      if (this.params.addhersteller.length > 0) {
        for (const addthehersteller of this.params.addhersteller) {
          let toadd = this.filterArray(alldata, 'hersteller', addthehersteller);
          this.dosen_projektion_all_hersteller_filtered = this.dosen_projektion_all_hersteller_filtered.concat(toadd);
        }
        let data = this.dosen_projektion_all_hersteller_filtered;
        data.sort((a, b) => a.hersteller.localeCompare(b.hersteller) || b.kw - a.kw);
        this.dosen_projektion_all_hersteller_filtered = data;
      }
    }
    this.herstellerliste = this.removeduplicates(this.getValues(this.sortArray(this.filterArray(this.dosen_projektion_all_hersteller_filtered, "kw", this.dosen_projektion_all_hersteller_filtered[0]["kw"]), 'prioritaet'), "hersteller"));    

  }
 

 do_simulation_new(myinput, params) {
    let kapazitaet = params.kapazitaet_pro_woche;
    let liefermenge = params.liefermenge;
    let theruecklage = params.ruecklage;
    let addtheweekstoabstand = params.addweekstoabstand;
    let anteil_impfbereit = params.anteil_impfbereit;
    let hersteller = this.herstellerliste;
    let input = myinput;
    let time: Array<number> = this.getValues(this.sortArray(this.filterArray(input, "hersteller", hersteller[0]), 'kw'), "kw");
    let firstweek = time[0];
    let impfstand = this.geo_impfstand;
    let result_erstimpfungen = [];
    let result_zweitimpfungen = [];
    let finalresult = [];
    let pop_rest_erst = myinput[0]['population'] * anteil_impfbereit;
    let poprest = {
      'pop_unter_12': myinput[0]['pop_unter_12'] * anteil_impfbereit,
      'pop_12_bis_18': myinput[0]['pop_12_bis_18'] * anteil_impfbereit,
      'pop_18_bis_60': myinput[0]['pop_18_bis_60'] * anteil_impfbereit,
      'pop_ueber_60': myinput[0]['pop_ueber_60'] * anteil_impfbereit
    };
    const vacckids = params.bntjgdliche;

    // Schleife Zeit
    for (const thewoche of time) {
      let kapazitaet_verbleibend = kapazitaet;

      // Zweitimpfungen Startwoche
      if (thewoche == firstweek) {
        // Schleife Hersteller Zweitimpfung
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
          let hersteller_restdosen = impfstand_hersteller['dosen_geliefert'] - impfstand_hersteller['dosen_verabreicht_erst'] - impfstand_hersteller['dosen_verabreicht_zweit'];
          let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + hersteller_restdosen / 4;
          // Nur falls Hersteller 2 Anwendungen
          if (theinput["anwendungen"] == 2) {
            let topush = {};
            topush['hersteller'] = thehersteller;
            topush['kw'] = thewoche;
            topush['population'] = theinput['population'] * anteil_impfbereit;
            topush['anwendungen'] = 2;
            topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
            topush['dosen_geliefert'] = theinput['dosen_kw'] * liefermenge;
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

        // Erstimpfungen Startwoche
        for (const thehersteller of hersteller) {
          let theinput = this.filterArray(this.filterArray(myinput, "hersteller", thehersteller), "kw", thewoche)[0];
          let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
          let hersteller_restdosen = impfstand_hersteller['dosen_geliefert'] - impfstand_hersteller['dosen_verabreicht_erst'] - impfstand_hersteller['dosen_verabreicht_zweit'];
          let info_zweitimpfungen_aktuelle_woche = 0;
          let dosen_verfuegbar = theinput['dosen_kw'] * liefermenge + hersteller_restdosen / 4;
          let topush = {};
          let impfpop_empfohlen = 0;
          let verbleibend_impfstand_erst = impfstand_hersteller['dosen_verabreicht_erst'];
          const empfaltersgruppen = theinput["altersgruppe"];
          
          // Sim Zulassung 12+  pop_12_bis_18
          if (vacckids && (thehersteller=="BNT/Pfizer")){
            if (!empfaltersgruppen.includes("pop_12_bis_18")){
              empfaltersgruppen.push("pop_12_bis_18");             
            }
          }

          let impfaltersgruppen = this.impfaltersgruppen;
          let newalter = [];

          // Anpassung Altersgruppen
          // Add Gruppen of impfaltersgruppen to Array in recom. Order
          for (let thegruppe of this.impfaltersgruppen) {
            if (empfaltersgruppen.indexOf(thegruppe) >= 0) {
              newalter.push(thegruppe);

            }
          }
          // Add Gruppen not in impfaltersgruppen if in emp
          for (let thegruppe of empfaltersgruppen) {
            if (newalter.indexOf(thegruppe) == -1) {
              newalter.push(thegruppe);
            }
          }

          // If ignore altersgruppen add missing
          if (this.ignorealter){
            for (let thegruppe of this.impfaltersgruppen) {
              if (newalter.indexOf(thegruppe)==-1) {
                newalter.push(thegruppe);
              }
            }
            }


          // Rewrite
          impfaltersgruppen = newalter;

          for (let inpop of impfaltersgruppen) {
            if (poprest[inpop] >= verbleibend_impfstand_erst) {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = poprest[inpop] - verbleibend_impfstand_erst;
              verbleibend_impfstand_erst = verbleibend_impfstand_erst - (oldpoprest - poprest[inpop]);
            }
            else {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = 0;
              verbleibend_impfstand_erst = verbleibend_impfstand_erst - (oldpoprest - poprest[inpop]);
            };
          }


          if (theinput["anwendungen"] == 2) {
            info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
            dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
          }

          let ruecklage = Math.round(dosen_verfuegbar * theinput['ruecklage']);
          if (!theruecklage) {
            ruecklage = 0;
          }

          for (let inpop of impfaltersgruppen) {
            impfpop_empfohlen = impfpop_empfohlen + poprest[inpop];
          }
          
          topush['hersteller'] = thehersteller;
          topush['kw'] = thewoche;
          topush['population'] = theinput['population'] * anteil_impfbereit;
          topush['anwendungen'] = theinput['anwendungen'];
          topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
          topush['dosen_verfuegbar'] = dosen_verfuegbar - ruecklage;

          topush['impfungen'] = Math.min(topush['dosen_verfuegbar'], kapazitaet_verbleibend, impfpop_empfohlen);
          topush['impfungen_erst_kum'] = topush['impfungen'] + impfstand_hersteller['dosen_verabreicht_erst'];
          pop_rest_erst = pop_rest_erst - (topush['impfungen'] + impfstand_hersteller['dosen_verabreicht_erst']);
          let restvomimpfen_startwoche = (topush['impfungen']);


          for (let inpop of impfaltersgruppen) {
            if (poprest[inpop] >= restvomimpfen_startwoche) {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = poprest[inpop] - restvomimpfen_startwoche;
              restvomimpfen_startwoche = restvomimpfen_startwoche - (oldpoprest - poprest[inpop]);
            }
            else {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = 0;
              restvomimpfen_startwoche = restvomimpfen_startwoche - (oldpoprest - poprest[inpop]);
            };
          }

          kapazitaet_verbleibend = kapazitaet_verbleibend - topush['impfungen'];
          topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
          topush['patienten_geimpft'] = 0;
          if (theinput["anwendungen"] == 1) {
            topush['patienten_geimpft'] = theinput['dosen_verabreicht_erst'] + topush['impfungen'];
            topush['dosen_verfuegbar_initial'] = dosen_verfuegbar;
            topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
          }
          topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen'] + ruecklage;
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

            if ((thewoche - firstweek) < 4) {
              let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
              let hersteller_restdosen = impfstand_hersteller['dosen_geliefert'] - impfstand_hersteller['dosen_verabreicht_erst'] - impfstand_hersteller['dosen_verabreicht_zweit'];
              dosen_verfuegbar = dosen_verfuegbar + hersteller_restdosen / 4;
            }

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
            topush['population'] = theinput['population'] * anteil_impfbereit;
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
          let topush = {};
          let impfpop_empfohlen = 0;
          let empfaltersgruppen = theinput["altersgruppe"];
          let impfaltersgruppen = [];
          let newalter = [];          

          // Sim Zulassung 12+  pop_12_bis_18
              if (vacckids && (thehersteller=="BNT/Pfizer")){
                if (!empfaltersgruppen.includes("pop_12_bis_18")){
                  empfaltersgruppen.push("pop_12_bis_18");                  
                }
              }

          // Anpassung Altersgruppen
          // Add Gruppen of impfaltersgruppen to Array in recom. Order
          for (let thegruppe of this.impfaltersgruppen) {
            if (empfaltersgruppen.indexOf(thegruppe) >= 0) {
              newalter.push(thegruppe);

            }
          }
          // Add Gruppen not in impfaltersgruppen if in emp
          for (let thegruppe of empfaltersgruppen) {
            if (newalter.indexOf(thegruppe) == -1) {
              newalter.push(thegruppe);
            }
          }

          // If ignore altersgruppen add missing
          if (this.ignorealter){
            for (let thegruppe of this.impfaltersgruppen) {
              if (newalter.indexOf(thegruppe)==-1) {
                newalter.push(thegruppe);
              }
            }
            }

          // Rewrite
          impfaltersgruppen = newalter;

          for (let inpop of impfaltersgruppen) {
            impfpop_empfohlen = impfpop_empfohlen + Math.round(poprest[inpop]);
          }

          // Wenn 2 Anwendungen keine Restdosen da verfügbare Dosen = Dosenspeicher aus Zweitimpfungen
          if (theinput["anwendungen"] == 2) {
            info_zweitimpfungen_aktuelle_woche = this.filterArray(this.filterArray(result_zweitimpfungen, "hersteller", thehersteller), "kw", thewoche)[0];
            dosen_verfuegbar = info_zweitimpfungen_aktuelle_woche['dosenspeicher'];
            ruecklage = Math.round(dosen_verfuegbar * theinput['ruecklage']);
          }
          // Wenn 1 Anwendung Restdosen berücksichtigen
          if ((theinput["anwendungen"] == 1) && ((thewoche - firstweek) < 4)) {
            let impfstand_hersteller = this.filterArray(impfstand, "hersteller", thehersteller)[0];
            let hersteller_restdosen = impfstand_hersteller['dosen_geliefert'] - impfstand_hersteller['dosen_verabreicht_erst'] - impfstand_hersteller['dosen_verabreicht_zweit'];
            dosen_verfuegbar = dosen_verfuegbar + hersteller_restdosen / 4;
            ruecklage = Math.round(dosen_verfuegbar * theinput['ruecklage']);
          }

          if (!theruecklage || theinput["anwendungen"] == 1) {
            ruecklage = 0;
          }
          topush['hersteller'] = thehersteller;
          topush['kw'] = thewoche;
          topush['kapazitaet__vorher'] = kapazitaet_verbleibend;
          topush['dosen_verfuegbar'] = dosen_verfuegbar - ruecklage;
          topush['impfungen'] = Math.min(topush['dosen_verfuegbar'], topush['kapazitaet__vorher'], impfpop_empfohlen);
          topush['impfungen_erst_kum'] = topush['impfungen'] + lastweek_erst['impfungen_erst_kum'];
          pop_rest_erst = pop_rest_erst - topush['impfungen'];
          let restvomimpfen_folgewoche = topush['impfungen'];
          for (let inpop of impfaltersgruppen) {
            if (poprest[inpop] >= restvomimpfen_folgewoche) {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = poprest[inpop] - restvomimpfen_folgewoche;
              restvomimpfen_folgewoche = restvomimpfen_folgewoche - (oldpoprest - poprest[inpop]);
            }
            else {
              let oldpoprest = poprest[inpop];
              poprest[inpop] = 0;
              restvomimpfen_folgewoche = restvomimpfen_folgewoche - oldpoprest;
            };
          };
          kapazitaet_verbleibend = topush['kapazitaet__vorher'] - topush['impfungen'];
          topush['kapazitaet_verbleibend'] = kapazitaet_verbleibend;
          topush['patienten_geimpft'] = 0;
          if (theinput["anwendungen"] == 1) {
            topush['patienten_geimpft'] = lastweek_erst['patienten_geimpft'] + topush['impfungen'];
            topush['dosen_verfuegbar_initial'] = dosen_verfuegbar;
            topush['dosenlieferung_kw'] = theinput["dosen_kw"] * liefermenge;
          }
          topush['dosenspeicher'] = topush['dosen_verfuegbar'] - topush['impfungen'] + ruecklage;
          topush['dosenspeicher_ruecklage'] = ruecklage;
          result_erstimpfungen.push(topush);
        }
      }
    }
    // Aggregation der Ergebnisse
    for (const thewoche of time) {
      let input_erst = this.filterArray(result_erstimpfungen, 'kw', thewoche);
      let input_zweit = this.filterArray(result_zweitimpfungen, 'kw', thewoche);
      let kwall2hersteller = this.getValues(input_zweit, "hersteller");
      let kwall1hersteller = this.getValues(input_erst, "hersteller");

      if ((input_erst.length + input_zweit.length) > 0) {
        let topush = {};
        topush['kw'] = thewoche;
        topush['date'] = this.getDateOfISOWeek(thewoche, 2021);
        topush['kapazitaet'] = kapazitaet;
        topush['population'] = this.getValues(input_zweit, 'population')[0];
        topush['Gelieferte Dosen'] =
          this.sumArray(this.getValues(input_erst, 'dosenlieferung_kw')) +
          this.sumArray(this.getValues(input_zweit, 'dosenlieferung_kw'));
        topush['Verfügbare Dosen'] =
          this.sumArray(this.getValues(input_zweit, 'dosen_verfuegbar')) +
          this.sumArray(this.getValues(input_erst, 'dosen_verfuegbar_initial'));
        topush['Verimpfte Dosen'] =
          Math.round(this.sumArray(this.getValues(input_erst, 'impfungen')) +
          this.sumArray(this.getValues(input_zweit, 'impfungen')));
        topush['Zweit-Dosen'] =
        Math.round(this.sumArray(this.getValues(input_zweit, 'impfungen_zweit')));
        topush['Erst-Dosen'] =topush['Verimpfte Dosen']-topush['Zweit-Dosen'];
        topush['Verimpfte Erst-Dosen'] =
          Math.round(this.sumArray(this.getValues(input_erst, 'impfungen_erst_kum')));        
        for (let thehst of kwall1hersteller) {
          topush['Erst: ' + thehst] = this.filterArray(input_erst, 'hersteller', thehst)[0]['impfungen'];
        }        
        topush['Auslastung'] = 100 * (topush['Verimpfte Dosen'] / kapazitaet);
        topush['Unverimpfte Dosen'] = this.sumArray(this.getValues(input_erst, 'dosenspeicher'));
        topush['patienten_durchgeimpft'] =
          this.sumArray(this.getValues(input_erst, 'patienten_geimpft')) +
          this.sumArray(this.getValues(input_zweit, 'patienten_geimpft'));
        topush['Wartschlange Zweitimpfung'] =
          this.sumArray(this.getValues(input_zweit, 'verbleibend_in_warteschlange_zweit_kw'));
        for (let thehst of kwall2hersteller) {

          topush['Warten: ' + thehst] = this.filterArray(input_zweit, 'hersteller', thehst)[0]['verbleibend_in_warteschlange_zweit_kw'];
        }

        // Korrektur Durchimpfung abgeschlossen
        // Nötig durch AZ Problem, ohne AZ unnötig.
        if (topush['patienten_durchgeimpft']>=67.86*1e6 && vacckids==false){
          topush['patienten_durchgeimpft']=67.86*1e6;
        }
        if (topush['Verimpfte Erst-Dosen'] >=67.86*1e6 && vacckids==false){
          topush['Verimpfte Erst-Dosen'] =67.86*1e6;
        }
        if (topush['patienten_durchgeimpft']>=73994326 && vacckids==true){
          topush['patienten_durchgeimpft']=73994327;
        }
        if (topush['Verimpfte Erst-Dosen'] >=73994326 && vacckids==true){
          topush['Verimpfte Erst-Dosen'] =73994327;
        }
        // Berechnung Impfquote
        topush['Anteil Durchimpfung'] = 100 * (topush['patienten_durchgeimpft'] / topush['population']);
        topush['Anteil Erst-Dosis'] = 100 * (topush['Verimpfte Erst-Dosen'] / topush['population']);
        finalresult.push(topush)
      }
    }
    return finalresult;

  }


  update_risktimes(simresult, indicator) {
    let time: Array<number> = this.getValues(this.sortArray(simresult, 'kw'), "kw");
    let riskinfo = {};
    let riskgroup = this.n_risikogruppen;
    let riskgroup_i = 0;
    let localrisktimes = [];


    // Check who is done
    for (const thewoche of time) {
      let anteil_durchimpfung = this.filterArray(simresult, 'kw', thewoche)[0][indicator] / 100;
      let kapazitaet = this.filterArray(simresult, 'kw', thewoche)[0]['kapazitaet'];
      let checkall = true;
      while (checkall) {
        let Stufe = riskgroup[riskgroup_i]['Stufe']
        let Anteil = riskgroup[riskgroup_i]['anteil']
        if (riskgroup.length > (riskgroup_i + 1)) {
          if (anteil_durchimpfung >= riskgroup[riskgroup_i].anteil) {
            riskinfo = { 'Stufe': Stufe };
            riskinfo["Datum"] = this.getDateOfISOWeek(thewoche, 2021);
            if (thewoche == time[0]) {
              riskinfo["Datum"] = "fertig";
            }
            riskinfo["_Quote"] = anteil_durchimpfung;
            riskinfo["_kapazitaet"] = kapazitaet;
            riskinfo['Anteil'] = Anteil;
            localrisktimes.push(riskinfo);
            riskgroup_i = riskgroup_i + 1;
          }
          else {
            checkall = false;
          }
        }
        else {
          checkall = false;
        }
      }
    }

    while ((riskgroup_i + 1) <= 6) {
      riskinfo = riskgroup[riskgroup_i];
      riskinfo["Datum"] = "nie";
      localrisktimes.push(riskinfo);
      riskgroup_i = riskgroup_i + 1;
    }

    return localrisktimes;
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
      timediff = timediff + 1;
      this.time_until_start = timediff;
      if (timediff > 0 && this.notstarted) {
        this.notstarted = false;
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

  filterkeys(array, keys) {
    let result = [];
    for (let item of array) {
      let topush = {};
      for (let key of keys) {
        if (item[key]) {
          topush[key] = item[key];
        }
      }
      result.push(topush);
    }
    return result;
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

  addremovehst(hersteller, status) {
    let check = this.params.addhersteller.includes('hersteller');
    if (check == false && status == true) {
      this.params.addhersteller.push(hersteller);
    }
    if (status == false) {
      this.params.addhersteller = this.params.addhersteller.filter(item => item !== hersteller);
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
      ISOweekStart.setDate(simple.getDate() + 7 - simple.getDay() + 1);
    else
      ISOweekStart.setDate(simple.getDate() + 8 + 7 - simple.getDay());
    return ISOweekStart.toISOString().substring(0, 10);
  }

  getDateforValueinArray(array, value, year, datename = "Datum") {
    let result = [];
    for (let row of array) {
      let topush = row;
      topush[datename] = this.getDateOfISOWeek(row[value], year,)
      result.push(topush);
    }
    return result;
  }

  removeduplicates(list) {
    let uniqueNames = [];
    let lastel;
    for (let el of list) {
      if (el != lastel) {
        uniqueNames.push(el);
        lastel = el;
      }
    }
    return uniqueNames;
  }

  exportascsv(name, data) {
    let result = this.csv.exportToCsv(name, data);
  }

  make_hersteller_overview(data) {
    let result = [];
    for (let row of data) {
      let output = {};
      output['Dosen auf Lager'] = row['dosen_geliefert'] - row['dosen_verabreicht_erst'] - row['dosen_verabreicht_zweit'];
      output['Hersteller'] = row['hersteller'];
      result.push(output);
    }
    this.sortArray(result, 'Dosen auf Lager')
    return result;
  }





}
