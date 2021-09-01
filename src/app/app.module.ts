import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { MemberListComponent } from './member-list/member-list.component';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupIndexComponent } from './group-index/group-index.component';
import { GroupSettingsComponent } from './group-settings/group-settings.component';
import { GroupComponent } from './group/group.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChannelComponent } from './channel/channel.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    ChannelListComponent,
    MemberListComponent,
    GroupListComponent,
    GroupIndexComponent,
    GroupSettingsComponent,
    GroupComponent,
    ChannelComponent,
    LoginComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
