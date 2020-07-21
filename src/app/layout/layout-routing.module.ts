import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';


const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'publisher', loadChildren: () => import('./publisher/publisher.module').then(m => m.PublisherModule) },
      { path: 'live', loadChildren: () => import('./stream-player/stream-player.module').then(m => m.StreamPlayerModule) },
      { path: 'vod', loadChildren: () => import('./video-list/video-list.module').then(m => m.VideoListModule) }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
