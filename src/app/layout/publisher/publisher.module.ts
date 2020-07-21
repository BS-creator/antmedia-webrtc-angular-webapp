import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ReactiveFormsModule } from '@angular/forms';

import { PublisherRoutingModule } from './publisher-routing.module';
import { PublisherComponent } from '../publisher/publisher.component';
import { ComponentsModule } from '../components/components.module';


@NgModule({
  declarations: [PublisherComponent],
  imports: [
    CommonModule,
    PublisherRoutingModule,
    FormsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    ComponentsModule
  ]
})
export class PublisherModule { }
