import '!script-loader!hls.js';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import screenfull from 'screenfull';
import cx from 'classnames';
import MobileDetect from 'mobile-detect';

import 'rc-slider/assets/index.css';

class HLSPlayer extends Component {

  static defaultProps = {
    autoPlay: false,
    autoMute: false,
    disableControls: false,
    source: '',
    hlsParams: {},
    hlsEvents: {
      onMediaAttached: new Function(),
      onManifestParsed: new Function(),
      onError: new Function(),
      onFragChanged: new Function(),
      onFragParsingMetadata: new Function()
    },
    customControls: {
      panelBg: '#07141e',
      buttonBg: 'none',
      buttonColor: '#fff',
      timePadding: '5px',
      timeSize: '12px',
      playBtnContent: '<span class="icon-player-play"></span>',
      pauseBtnContent: '<span class="icon-player-stop"></span>',
      volumeBtnContent: '<span class="icon-player-volume"></span>',
      muteBtnContent: '<span class="icon-player-mute"></span>',
      fullScreenBtnContent: '<span class="icon-player-fullscreen"></span>',
      playBackRateContent: '<span class="icon-player-rate"></span>',
      preloaderContent: '<span class="icon-player-loader"></span>'
    }
  };

  static propTypes = {
    autoPlay: PropTypes.bool,
    autoMute: PropTypes.bool,
    disableControls: PropTypes.bool,
    source: PropTypes.string.isRequired,
    hlsParams: PropTypes.object,
    hlsEvents: PropTypes.shape({
      onMediaAttached: PropTypes.func,
      onManifestParsed: PropTypes.func,
      onError: PropTypes.func,
      onFragChanged: PropTypes.func,
      onFragParsingMetadata: PropTypes.func,
    }),
    customControls: PropTypes.shape({
      panelBg: PropTypes.string,
      buttonBg: PropTypes.string,
      buttonColor: PropTypes.string,
      timePadding: PropTypes.string,
      timeSize: PropTypes.string,
      playBtnContent: PropTypes.string,
      pauseBtnContent: PropTypes.string,
      volumeBtnContent: PropTypes.string,
      muteBtnContent: PropTypes.string,
      fullScreenBtnContent: PropTypes.string,
      playBackRateContent: PropTypes.string,
      preloaderContent: PropTypes.string
    })
  };

  state = {
    isPlaying: this.props.autoPlay,
    isMuted: this.props.autoMute,
    showPlaybackMenu: false,
    showPreloader: false,
    showPlaceHolder: true,
    isFullscreen: false,
    activeRate: 6,
    currentTime: '00:00',
    duration: '00:00'
  };

  constructor(props, context) {
    super(props, context);

    this.player = null;

    this.isChangeDuration = false;
    this.onPaused = props.autoPlay;
    this.onPlayed = !props.autoPlay;

    this.handlePlayBtn = this.handlePlayBtn.bind(this);
    this.handleFullScreenBtn = this.handleFullScreenBtn.bind(this);
    this.handleVolumeBtn = this.handleVolumeBtn.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleBeforeDurationChange = this.handleBeforeDurationChange.bind(this);
    this.handleDurationChange = this.handleDurationChange.bind(this);
    this.handleAfterDurationChange = this.handleAfterDurationChange.bind(this);
    this.handlePlayBackBtn = this.handlePlayBackBtn.bind(this);
    this.handleVideoListeners = this.handleVideoListeners.bind(this);

    // HLS event callbacks
    this.onMediaAttached = this.onMediaAttached.bind(this);
    this.onManifestParsed = this.onManifestParsed.bind(this);
    this.onHlsError = this.onHlsError.bind(this);
    this.onFragParsingMetadata = this.onFragParsingMetadata.bind(this);
    this.onFragChanged = this.onFragChanged.bind(this);

    // Video events
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onCanPlay = this.onCanPlay.bind(this);
    this.onEnded = this.onEnded.bind(this);
    this.onWaiting = this.onWaiting.bind(this);
    this.onCanPlayThrough = this.onCanPlayThrough.bind(this);
    this.onPlaying = this.onPlaying.bind(this);
    this.onPause = this.onPause.bind(this);
    this.onLoadedData = this.onLoadedData.bind(this);
  }

  componentDidMount() {
    const { hlsParams } = this.props;
    const mobile = this.whatMobile();

    if (mobile === 'iPad' || mobile === 'iPhone')
      this.videoElement.src = this.props.source;

    if (!Hls.isSupported())
      return;

    this.player = new Hls(hlsParams);

    this.player.attachMedia(this.videoElement);

    this.player.on(Hls.Events.MEDIA_ATTACHED, this.onMediaAttached);
    this.player.on(Hls.Events.MANIFEST_PARSED, this.onManifestParsed);
    this.player.on(Hls.Events.ERROR, this.onHlsError);
    this.player.on(Hls.Events.FRAG_PARSING_METADATA, this.onFragParsingMetadata);
    this.player.on(Hls.Events.FRAG_CHANGED, this.onFragChanged);

    window.addEventListener('click', this.hidePlayBackMenu.bind(this));
    window.addEventListener('resize', this.hidePlayBackMenu.bind(this));
    document.addEventListener(screenfull.raw.fullscreenchange, this.handleScreenfullChange.bind(this));
  }

  whatMobile() {
    return new MobileDetect(window.navigator.userAgent).mobile();
  }

  isMobile() {
    return !!new MobileDetect(window.navigator.userAgent).mobile();
  }

  handleScreenfullChange() {
    this.setState({ isFullscreen: screenfull.isFullscreen });
  }

  handleVideoListeners() {
    this.videoElement.addEventListener('timeupdate', this.onTimeUpdate);
    this.videoElement.addEventListener('canplay', this.onCanPlay);
    this.videoElement.addEventListener('ended', this.onEnded);
    this.videoElement.addEventListener('waiting', this.onWaiting);
    this.videoElement.addEventListener('canplaythrough', this.onCanPlayThrough);
    this.videoElement.addEventListener('playing', this.onPlaying);
    this.videoElement.addEventListener('pause', this.onPause);
    this.videoElement.addEventListener('loadeddata', this.onLoadedData);
  }

  removeVideoListeners() {
    this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
    this.videoElement.removeEventListener('canplay', this.onCanPlay);
    this.videoElement.removeEventListener('ended', this.onEnded);
    this.videoElement.removeEventListener('waiting', this.onWaiting);
    this.videoElement.removeEventListener('canplaythrough', this.onCanPlayThrough);
    this.videoElement.removeEventListener('playing', this.onPlaying);
    this.videoElement.removeEventListener('pause', this.onPause);
    this.videoElement.removeEventListener('loadeddata', this.onLoadedData);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.hidePlayBackMenu.bind(this));
    window.removeEventListener('resize', this.hidePlayBackMenu.bind(this));
  }

  onTimeUpdate() {
    const { disableControls } = this.props;

    if (disableControls) return false;

    if (!this.isChangeDuration)
      this.durationBar.setState({
        value: (100 / this.videoElement.duration) * this.videoElement.currentTime
      });
    this.setState({
      currentTime: formatTime(this.videoElement.currentTime, this._hasHours())
    });
  }

  onCanPlay() {
    const { disableControls } = this.props;

    if (disableControls) return false;

    this.setState({
      showPreloader: false,
      duration: formatTime(this.videoElement.duration, this._hasHours()),
      currentTime: formatTime(0, this._hasHours())
    });
  }

  onEnded() { this.videoElement.pause(); }

  onPlaying() {
    this.onPlayed = true;
    this.onPaused = false;
  }

  onPause() {
    this.onPlayed = false;
    this.onPaused = true;
  }

  onWaiting() {
    const { disableControls } = this.props;

    if (disableControls) return false;

    this.setState({ showPreloader: true });
  }

  onCanPlayThrough() {
    const { disableControls } = this.props;

    if (disableControls) return false;

    this.setState({ showPreloader: false });
  }

  onMediaAttached() {
    this.player.loadSource(this.props.source);
    this.props.hlsEvents.onMediaAttached();
  }

  onManifestParsed() {
    const { isPlaying, isMuted } = this.state;

    this.player.startLoad();

    if (isPlaying)
      this.videoElement.play();

    if (isMuted) {
      this.videoElement.muted = true;
      if (!disableControls)
        this.volumeBar.setState({ value: 0 });
    }

    this.handleVideoListeners();

    this.props.hlsEvents.onManifestParsed();
  }

  onHlsError(e, data) {
    console.log('error with HLS...', e, data);
    this.props.hlsEvents.onError(e, data);
  }

  onFragParsingMetadata(e, data) {
    console.log('on fragment parsing metadata...');
    this.props.hlsEvents.onFragParsingMetadata(e, data);
  }

  onFragChanged(e, data) {
    console.log('on fragment changed...');
    this.props.hlsEvents.onFragChanged(e, data);
  }

  onLoadedData() {
    this.setState({ showPlaceHolder: false });
  }

  destroyHLSPlayer() {
    if (!this.player)
      return false;

    this.player.off(Hls.Events.MEDIA_ATTACHED, this.onMediaAttached);
    this.player.off(Hls.Events.FRAG_PARSING_METADATA, this.onFragParsingMetadata);
    this.player.off(Hls.Events.ERROR, this.onHlsError);
    this.player.off(Hls.Events.FRAG_CHANGED, this.onFragChanged);
    this.player.off(Hls.Events.MANIFEST_PARSED, this.onManifestParsed);
    this.player.destroy();
    this.removeVideoListeners();
  }

  _hasHours() {
    return (this.videoElement.duration / 3600) >= 1.0;
  }

  rawHTML(html) {
    return { __html: html };
  }

  hidePlayBackMenu() {
    if (this.state.showPlaybackMenu)
      this.setState({ showPlaybackMenu: false });
  }

  handlePlayBtn(e) {
    const mobile = this.whatMobile();

    if (mobile === 'iPad' || mobile === 'iPhone')
      this.videoElement.play();

    if (this.props.disableControls)
      return;

    e.stopPropagation();

    const { isPlaying } = this.state;

    if (isPlaying)
      this.videoElement.pause();
    else
      this.videoElement.play();

    this.setState({ isPlaying: !isPlaying });
  }

  handleFullScreenBtn() {
    if (screenfull.enabled)
      screenfull.toggle(this.videoContainer);
  }

  handleVolumeBtn() {
    const { isMuted } = this.state;

    this.videoElement.muted = !isMuted;

    if (this.volumeBar)
      this.volumeBar.setState({ value: isMuted ? 1 : 0 });

    this.setState({ isMuted: !isMuted });
  }

  handleVolumeChange() {
    const volume = this.volumeBar.state.value;
    const isMuted = parseFloat(volume) <= 0;

    this.videoElement.volume = volume;
    this.videoElement.muted = isMuted;

    this.setState({ isMuted: isMuted });
  }

  handleBeforeDurationChange() {
    this.isChangeDuration = true;
    if (this.onPlayed)
      this.videoElement.pause();
    this.setState({ isPlaying: false });
  }

  handleDurationChange() {
    this.videoElement.currentTime = this.videoElement.duration * (this.durationBar.state.value / 100);
  }

  handleAfterDurationChange() {
    this.videoElement.currentTime = this.videoElement.duration * (this.durationBar.state.value / 100);
    this.isChangeDuration = false;
    if (this.onPaused)
      this.videoElement.play();
    this.setState({ isPlaying: true });
  }

  handlePlayBackBtn(e) {
    e.stopPropagation();

    const { showPlaybackMenu } = this.state;

    this.setState({ showPlaybackMenu: !showPlaybackMenu });

    this.playbackMenu.style.display = !showPlaybackMenu ? 'flex' : 'none';
    this.playbackMenu.style.top = -this.playbackMenu.clientHeight + 'px';
    this.playbackMenu.style.left = this.playbackBtn.offsetLeft - 10 + 'px';
  }

  handlePlayBackRateChange(e, rate) {
    e.stopPropagation();

    this.setState({
      activeRate: rate.id,
      showPlaybackMenu: false
    });

    this.videoElement.playbackRate = rate.value;
  }

  render() {
    const {
      isPlaying,
      isMuted,
      currentTime,
      duration,
      showPlaybackMenu,
      activeRate,
      showPreloader,
      showPlaceHolder,
      isFullscreen
    } = this.state;
    const { customControls, disableControls } = this.props;

    const controlsPanelStyles = {
      background: customControls.panelBg
    };
    const buttonStyles = {
      background: customControls.buttonBg,
      color: customControls.buttonColor,
    };
    const activeBtnStyles = { ...buttonStyles, ...{ background: '#fff', color: '#000' } };
    const timers = {
      padding: customControls.timePadding,
      fontSize: customControls.timeSize,
      color: customControls.buttonColor
    };
    const playbackMenu = {
      display: showPlaybackMenu ? 'flex' : 'none',
      background: customControls.panelBg
    };
    const preloaderStyles = {
      color: customControls.buttonColor
    };

    let playBtnContent = '';
    let volumeBtnContent = '';

    const playbackRates = [{
      id: 1,
      value: 3
    },{
      id: 2,
      value: 2.5
    },{
      id: 3,
      value: 2
    }, {
      id: 4,
      value: 1.5
    }, {
      id: 5,
      value: 1.25
    }, {
      id: 6,
      value: 1
    }, {
      id: 7,
      value: 0.75
    }, {
      id: 8,
      value: 0.5
    }];
    const playbackRatesList = playbackRates.map(item =>
      <button key={item.id}
              className="hlsPlayer-button"
              style={ activeRate === item.id ? activeBtnStyles : buttonStyles }
              type="button"
              onClick={ (e) => { this.handlePlayBackRateChange(e, item) } }
      >
        {item.value}x
      </button>
    );

    if (isPlaying)
      playBtnContent = <span dangerouslySetInnerHTML={ this.rawHTML(customControls.pauseBtnContent) } />;
    else
      playBtnContent = <span dangerouslySetInnerHTML={ this.rawHTML(customControls.playBtnContent) } />;

    if (isMuted)
      volumeBtnContent = <span dangerouslySetInnerHTML={ this.rawHTML(customControls.muteBtnContent) } />;
    else
      volumeBtnContent = <span dangerouslySetInnerHTML={ this.rawHTML(customControls.volumeBtnContent) } />;

    return (
      <div className="hlsPlayer"
           ref={ (container) => { this.videoContainer = container; } }
      >
        <video className={cx('hlsPlayer-video', !isPlaying && 'paused')}
               ref={ (video) => { this.videoElement = video; } }
               onClick={ this.handlePlayBtn }
        />
        {
          showPlaceHolder &&
          <div className="hlsPlayer-placeholder" />
        }
        { showPreloader &&
          <div className="hlsPlayer-preloader" style={preloaderStyles}>
            <span dangerouslySetInnerHTML={ this.rawHTML(customControls.preloaderContent) } />
          </div>
        }
        {
          !disableControls &&
            <div className={cx('hlsPlayer-controls', isFullscreen && 'fullscreen')} style={controlsPanelStyles}>
              <button className="hlsPlayer-button"
                      style={buttonStyles}
                      type="button"
                      onClick={ this.handlePlayBtn }>
                {playBtnContent}
              </button>
              <span className="hlsPlayer-timers" style={timers}>{currentTime} / {duration}</span>
              <Slider
                className="hlsPlayer-duration"
                ref={ (bar) => { this.durationBar = bar; } }
                onBeforeChange={ this.handleBeforeDurationChange }
                onChange={ this.handleDurationChange }
                onAfterChange={ this.handleAfterDurationChange }
              />
              <button className="hlsPlayer-button"
                      style={buttonStyles}
                      type="button"
                      onClick={ this.handleVolumeBtn }>
                {volumeBtnContent}
              </button>
              { !this.isMobile() &&
                <Slider
                  className="hlsPlayer-volume"
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={1}
                  ref={ (bar) => {
                    this.volumeBar = bar;
                  } }
                  onChange={ this.handleVolumeChange }
                  onAfterChange={ this.handleVolumeChange }
                />
              }
              <button className="hlsPlayer-button"
                      style={buttonStyles}
                      type="button"
                      ref={ (playback) => { this.playbackBtn = playback; } }
                      onClick={ this.handlePlayBackBtn }
              >
                { <span dangerouslySetInnerHTML={ this.rawHTML(customControls.playBackRateContent) } /> }
              </button>
              <div className="hlsPlayer-playbackMenu"
                   style={playbackMenu}
                   ref={ (menu) => { this.playbackMenu = menu; } }
              >
                { playbackRatesList }
              </div>
              <button className="hlsPlayer-button"
                      style={buttonStyles}
                      type="button"
                      onClick={ this.handleFullScreenBtn }>
                { <span dangerouslySetInnerHTML={ this.rawHTML(customControls.fullScreenBtnContent) } /> }
              </button>
            </div>
        }
      </div>
    );
  }
}

export default HLSPlayer;

module.exports = HLSPlayer;

function formatTime(time, isHours) {
  if (isHours) {
    const h = Math.floor(time / 3600);

    time = time - h * 3600;

    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);

    return `${lead0(h,2)}:${lead0(m,2)}:${lead0(s,2)}`;
  } else {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);

    return `${lead0(m,2)}:${lead0(s,2)}`;
  }
}

function lead0(val, n) {
  let nz = "" + val;
  while (nz.length < n) {
    nz = "0" + nz;
  }
  return nz;
}