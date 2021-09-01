import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';

@Component({
  selector: 'channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.css']
})
export class ChannelListComponent implements OnInit {
  @Input() channels: any | undefined = undefined
  @Output() navigateToChannelEvent = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  navigateToChannel(channelId: string) {
    this.navigateToChannelEvent.emit(channelId)
  }
}
