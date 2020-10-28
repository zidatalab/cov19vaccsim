import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule}from '@angular/material/toolbar';
import { MatIconModule}from '@angular/material/icon';
import { MatListModule}from '@angular/material/list';
import { MatCardModule}from '@angular/material/card';
import { MatButtonModule}from '@angular/material/button';
import {MatTableModule}from '@angular/material/table';
import {   MatDialogModule}from '@angular/material/dialog';
import { MatInputModule  }from '@angular/material/input';
import { MatSelectModule  }from '@angular/material/select';
import { MatGridListModule  }from '@angular/material/grid-list';
import {MatMenuModule} from '@angular/material/menu';
import {MatRadioModule} from '@angular/material/radio';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatBadgeModule} from '@angular/material/badge';
import {MatStepperModule} from '@angular/material/stepper';
import {MatProgressBarModule} from '@angular/material/progress-bar';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,    
    MatSidenavModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatGridListModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatStepperModule,
    MatProgressBarModule


    
  ],
  exports: [
    MatSidenavModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatGridListModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatStepperModule,
    MatProgressBarModule
    
  ]
})
export class MaterialModule { }

