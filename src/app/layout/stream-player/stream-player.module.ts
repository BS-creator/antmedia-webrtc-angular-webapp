import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StreamPlayerRoutingModule } from './stream-player-routing.module';
import { StreamPlayerComponent } from './stream-player.component';


@NgModule({
  declarations: [StreamPlayerComponent],
  imports: [
    CommonModule,
    StreamPlayerRoutingModule
  ]
})
export class StreamPlayerModule { }
