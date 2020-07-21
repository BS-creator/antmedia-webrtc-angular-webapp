import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoStreamerComponent } from './video-streamer.component';

describe('VideoStreamerComponent', () => {
  let component: VideoStreamerComponent;
  let fixture: ComponentFixture<VideoStreamerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoStreamerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoStreamerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
