import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from '../layout/layout.component';
import { ComponentsModule } from './components/components.module';

import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterUserComponent } from './register-user/register-user.component';

@NgModule({
  declarations: [LayoutComponent, RegisterUserComponent],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    ComponentsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class LayoutModule { }
