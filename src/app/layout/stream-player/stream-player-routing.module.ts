import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StreamPlayerComponent } from './stream-player.component';


const routes: Routes = [{ path: '', component: StreamPlayerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StreamPlayerRoutingModule { }
