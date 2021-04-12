// ==UserScript==
// @name         YouTube Age Restriction Bypass
// @namespace    https://github.com/mozkomor05/YT-Age-Restriction-Bypass 
// @version      0.0.1
// @description  can't stop me from listening to S3RL - Hentai
// @include      https://www.youtube.com/*
// @connect      googlevideo.com
// @grant        GM.xmlHttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  if (!('unsafeWindow' in window))
    return;

  function init() {
    if (location.pathname.startsWith('/embed/'))
      bypassEmbed();
    else {
      addEventListener('yt-navigate-start', resetPage);
      addEventListener('yt-navigate-finish', bypassPage);
    }
  }

  function getVideoId() {
    return (location.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)$/) || [])[1] || new URLSearchParams(location.search).get('v');
  }

  function resetPage() {
    $('#bypassed-player').remove();
    $('#ytd-player').show();
    $('#error-screen').show();
  }

  function waitForErrScreen(errScreen) {
    return new Promise((resolve, reject) => {
      const exists = setInterval(function () {
        if (errScreen.html()) {
          clearInterval(exists);
          resolve(errScreen);
        }
      }, 100);
    })
  }

  function bypassPage() {
    waitForErrScreen($('#error-screen')).then(function ($errorScreen) {
      let restricted = false;
      
      if ($errorScreen.is(":visible"))
        $errorScreen.find("a.yt-simple-endpoint").each(function () {
          if (this.href.includes('watching_arv')) {
            restricted = true;
            return;
          }
        });

      if (!restricted)
        return;

      let startTime = new URLSearchParams(location.search).get('t') || 0;

      if (isNaN(startTime)) {
        const multipliers = { h: 3600, m: 60, s: 1 };
        startTime = startTime.match(/[0-9]+[a-z]/g).map(str => str.slice(0, -1) * multipliers[str.slice(-1)]).reduce((a, b) => a + b);
      }

      const $iframe = $('<iframe>', {
        src: `https://www.youtube.com/embed/${getVideoId()}?start=${startTime}&autoplay=1`,
        id: 'bypassed-player',
        style: 'border:0;width:100%;height:100%',
        allowfullscreen: 1
      });

      $errorScreen.hide();
      $('#ytd-player').hide();
      $iframe.appendTo('#player-container');
    });
  }

  function bypassEmbed() {
    let ytcfg;

    const _XMLHttpRequest = XMLHttpRequest

    Object.defineProperty(unsafeWindow, 'ytcfg', {
      set(value) {
        ytcfg = value;

        const orgSetter = ytcfg.set;

        ytcfg.set = (...args) => {
          try {
            if (JSON.parse(args[0].PLAYER_VARS.embedded_player_response).playabilityStatus.status === 'UNPLAYABLE') {
              const videoId = getVideoId();

              const xhr = new _XMLHttpRequest();
              xhr.open('GET', 'https://www.youtube.com/get_video_info?asv=3&video_id=' + videoId + '&eurl=https://youtube.googleapis.com/v/' + videoId, false);
              xhr.send();

              const response = new URLSearchParams(xhr.response).get('player_response');

              if (JSON.parse(response).playabilityStatus.status === 'OK')
                args[0].PLAYER_VARS.embedded_player_response = response;
            }
          }
          catch (e) {
            console.error(e);
          }

          orgSetter(...args)
        }
      },
      get() {
        return ytcfg;
      }
    });

    unsafeWindow.XMLHttpRequest = class extends _XMLHttpRequest {
      open(...args) {
        this.url = args[1];
        super.open(...args);
      }

      get response() {
        const response = ytcfg.get('PLAYER_VARS').embedded_player_response;

        if (this.url.includes('/youtubei/v1/player?key=') && response)
          return response;
        else
          return super.response;
      }
    }
  }

  init();
})();
