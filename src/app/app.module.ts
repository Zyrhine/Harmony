import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatComponent } from './chat/chat.component';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { MemberListComponent } from './member-list/member-list.component';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupIndexComponent } from './group-index/group-index.component';
import { GroupSettingsComponent } from './group-settings/group-settings.component';
import { GroupComponent } from './group/group.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ChannelListComponent,
    MemberListComponent,
    GroupListComponent,
    GroupIndexComponent,
    GroupSettingsComponent,
    GroupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
