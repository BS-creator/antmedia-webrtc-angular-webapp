import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VideoListRoutingModule } from './video-list-routing.module';
import { VideoListComponent } from './video-list.component';


@NgModule({
  declarations: [VideoListComponent],
  imports: [
    CommonModule,
    VideoListRoutingModule
  ]
})
export class VideoListModule { }
