/*
 * Copyright 2018 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  var ACTION_FAVORITE = 'favorite'
  var C_ = Nuvola.Translate.pgettext
  var PlaybackState = Nuvola.PlaybackState
  var PlayerAction = Nuvola.PlayerAction
  var player = Nuvola.$object(Nuvola.MediaPlayer)
  var WebApp = Nuvola.$WebApp()

  WebApp._onInitAppRunner = function (emitter) {
    Nuvola.WebApp._onInitAppRunner.call(this, emitter)
    Nuvola.actions.addAction('playback', 'win', ACTION_FAVORITE, C_('Action', 'Favorite'), null, null, null, false)
  }

  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    var state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  WebApp._onPageReady = function () {
    Nuvola.actions.connect('ActionActivated', this)
    player.addExtraActions([ACTION_FAVORITE])
    this.update()
  }

  WebApp.update = function () {
    var elms = this._getElements()
    var track = {
      title: null,
      artist: null,
      album: null,
      artLocation: Nuvola.queryAttribute('#playerArtwork', 'src'),
      length: this._getDuration()
    }
    var title = Nuvola.queryText('#playerTitle')
    var separator = title ? title.indexOf('-') : null
    if (separator > 0) {
      track.artist = title.substring(0, separator - 1).trim()
      title = title.substring(separator + 1).trim()
    }
    track.title = title
    player.setTrack(track)

    var state
    if (elms.pause) {
      state = PlaybackState.PLAYING
    } else if (elms.play) {
      state = PlaybackState.PAUSED
    } else {
      state = PlaybackState.UNKNOWN
    }
    player.setPlaybackState(state)
    player.setTrackPosition(Nuvola.queryText('#scrubberElapsed'))
    player.updateVolume(Nuvola.queryAttribute([elms.volumebar, 'input'], 'value', (volume, elm) => volume / 100))
    Nuvola.actions.updateState(ACTION_FAVORITE, elms.like && elms.like.getAttribute('data-testId') === 'playerFavoriteIconDidFavorite')
    player.setCanGoPrev(false)
    player.setCanGoNext(false)
    player.setCanPlay(!!elms.play)
    player.setCanPause(!!elms.pause)
    player.setCanSeek(state !== PlaybackState.UNKNOWN && elms.progressbar)
    player.setCanChangeVolume(!!elms.volumebar)
    Nuvola.actions.updateEnabledFlag(ACTION_FAVORITE, !!elms.like)

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp._getDuration = function () {
    return Nuvola.queryText('#scrubberDuration')
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    var elms = this._getElements()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        if (elms.play) {
          Nuvola.clickOnElement(elms.play)
        } else {
          Nuvola.clickOnElement(elms.pause)
        }
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(elms.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(elms.pause)
        break
      case PlayerAction.SEEK:
        var total = Nuvola.parseTimeUsec(this._getDuration())
        if (param > 0 && param <= total) {
          Nuvola.clickOnElement(elms.progressbar.firstChild, param / total, 0.5)
        }
        break
      case PlayerAction.CHANGE_VOLUME:
        Nuvola.clickOnElement(elms.volumebar.firstChild, 0.5, 1.0 - param)
        break
      case ACTION_FAVORITE:
        Nuvola.clickOnElement(elms.like)
        break
    }
  }

  WebApp._getElements = function () {
    var elms = {
      play: (
        document.querySelector('svg[data-testId="player-status-paused"]')
        || document.querySelector('svg[data-testId="player-status-stopped"]')),
      pause: document.querySelector('svg[data-testId="player-status-playing"]'),
      like: document.querySelector('#playerFavorite svg'),
      progressbar: document.querySelector('#scrubber'),
      volumebar: document.querySelector('#playerVolumeSlider')
    }
    // Ignore disabled buttons
    for (var key in elms) {
      if (elms[key] && elms[key].disabled) {
        elms[key] = null
      }
    }
    return elms
  }

  WebApp.start()
})(this)  // function(Nuvola)
