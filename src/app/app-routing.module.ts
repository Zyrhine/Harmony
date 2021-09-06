import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChannelComponent } from './channel/channel.component';
import { ControlPanelComponent } from './control-panel/control-panel.component';
import { GroupIndexComponent } from './group-index/group-index.component';
import { GroupComponent } from './group/group.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: 'group/:groupId',
        component: GroupComponent,
        children: [
          {
            path: 'channel/:channelId',
            component: ChannelComponent
          }
        ]
      },
      {
        path: 'group-index',
        component: GroupIndexComponent,
      },
      {
        path: 'control-panel',
        component: ControlPanelComponent,
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
