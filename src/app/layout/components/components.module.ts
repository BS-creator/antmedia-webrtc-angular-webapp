import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { VideoStreamerComponent } from './video-streamer/video-streamer.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SideBarComponent } from './side-bar/side-bar.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [NavBarComponent, VideoStreamerComponent, SideBarComponent],
  imports: [
    CommonModule,
    NgxSpinnerModule,
    RouterModule,
    FormsModule,
  ],
  exports: [
    NavBarComponent,
    SideBarComponent,
    VideoStreamerComponent
  ]
})
export class ComponentsModule { }
