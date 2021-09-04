import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.css']
})
export class ChannelListComponent implements OnInit {
  @Input() channels: any | undefined = undefined
  @Output() navigateToChannelEvent = new EventEmitter<string>();
  activeChannelId: string | null = null 

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {

  }

  navigateToChannel(channelId: string) {
    this.navigateToChannelEvent.emit(channelId);
    this.activeChannelId = channelId;
  }

  open(content: any) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      //this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      //this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  createChannel() {

  }
}
