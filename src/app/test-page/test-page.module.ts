import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestPageRoutingModule } from './test-page-routing.module';
import { TestPageComponent } from './test-page.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ComponentsModule } from '../layout/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [TestPageComponent],
  imports: [
    CommonModule,
    TestPageRoutingModule,
    ComponentsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class TestPageModule { }
