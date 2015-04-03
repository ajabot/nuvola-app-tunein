/*
 * Copyright 2015 Aurélien JABOT <aurelien.jabot+nuvola@gmail.com>
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

"use strict";

(function(Nuvola)
{
var ART_DOMAIN = "http://cdn-albums.tunein.com/";
var ART_EXTENSION = "t.jpg";

// Create media player component
var player = Nuvola.$object(Nuvola.MediaPlayer);
var isConnected = false;

// Handy aliases
var PlaybackState = Nuvola.PlaybackState;
var PlayerAction = Nuvola.PlayerAction;

// Create new WebApp prototype
var WebApp = Nuvola.$WebApp();

WebApp.getArtURL = function(key)
{
    return ART_DOMAIN + key + ART_EXTENSION;
}

WebApp.getPreviousElement = function()
{
    var favorites = document.getElementById("favoritePane");

    for (var i = 0; i < favorites.childNodes.length; i++)
    {
        if (favorites.childNodes[i].getAttribute("data-stationid") == TuneIn.app.nowPlaying.broadcast.StationId)
        {
            if (i == 0)
            {
                return favorites.lastChild;
            }
            else
            {
                var pos = i - 1;
                return favorites.childNodes[pos];
            }
        }
    }
}

WebApp.getNextElement = function()
{
    var favorites = document.getElementById("favoritePane");

    for (var i = 0; i < favorites.childNodes.length; i++)
    {
        if (favorites.childNodes[i].getAttribute("data-stationid") == TuneIn.app.nowPlaying.broadcast.StationId)
        {
            if (i == favorites.childNodes.length - 1)
            {
                return favorites.firstChild;
            }
            else
            {
                var pos = i + 1;
                return favorites.childNodes[pos];
            }
        }
    }
}

// Initialization routines
WebApp._onInitWebWorker = function(emitter)
{
    Nuvola.WebApp._onInitWebWorker.call(this, emitter);

    var state = document.readyState;
    if (state === "interactive" || state === "complete")
        this._onPageReady();
    else
        document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
}

// Page is ready for magic
WebApp._onPageReady = function()
{
    // Connect handler for signal ActionActivated
    Nuvola.actions.connect("ActionActivated", this);

    // Start update routine
    this.update();
}

// Extract data from the web page
WebApp.update = function()
{
    var track = {
        title: null,
        artist: null,
        album: null,
        artLocation: null
    }

    var app;
    var broadcast;
    var favorites;

    try
    {
        //getting the javascript app
        app = TuneIn.app;

        //state management
        switch(app.attributes.playState)
        {
            case "playing":
                var state = PlaybackState.PLAYING;
                break;
            case "stopped":
                var state = PlaybackState.PAUSED;
                break;
            default:
                var state = PlaybackState.UNKNOWN;
                break;
        }
    }
    catch(e)
    {
        //Status unknown on errors
        var state = PlaybackState.UNKNOWN;
    }

    try
    {
        broadcast = TuneIn.app.nowPlaying;

        //getting track/radio information
        track.title = broadcast.attributes.Title;
        track.artist = broadcast.attributes.Artist;
        track.album = broadcast.broadcast.Title;

        if (broadcast.attributes.AlbumArt)
        {
            track.artLocation =  this.getArtURL(broadcast.attributes.AlbumArt);
        }
        else if(broadcast.attributes.ArtistArt)
        {
            track.artLocation = this.getArtURL(broadcast.attributes.ArtistArt);
        }
        else
        {
            track.artLocation = broadcast.broadcast.Logo;            
        }
    }
    catch(e)
    {
        console.log(e.message)
    }
    
    
    favorites = document.getElementById("favoritePane");
    
    //updating nuvola's state
    player.setPlaybackState(state);
    player.setTrack(track);
    player.setCanPlay(state === PlaybackState.PAUSED);
    player.setCanPause(state === PlaybackState.PLAYING);
    player.setCanGoPrev(!!favorites);
    player.setCanGoNext(!!favorites);

    // Schedule the next update
    setTimeout(this.update.bind(this), 500);
}

// Handler of playback actions
WebApp._onActionActivated = function(emitter, name, param)
{
    //getting the player element
    var tuner = document.getElementById("tuner");

    //managing nuvola's player's action
    switch (name)
    {
        case PlayerAction.TOGGLE_PLAY:
        case PlayerAction.PLAY:
            Nuvola.clickOnElement(tuner.querySelector("div.playbutton-cont div.icon"));
            break;
        case PlayerAction.PAUSE:
        case PlayerAction.STOP:
            Nuvola.clickOnElement(tuner.querySelector("div.playbutton-cont div.icon"));
            break;
        case PlayerAction.PREV_SONG:
            Nuvola.clickOnElement(this.getPreviousElement().querySelector("span._playTarget span.icon"));
            Nuvola.clickOnElement(document.getElementById("userNav").querySelector("div.drawer a.my-profile"));
            break;
        case PlayerAction.NEXT_SONG:
            Nuvola.clickOnElement(this.getNextElement().querySelector("span._playTarget span.icon"));
            Nuvola.clickOnElement(document.getElementById("userNav").querySelector("div.drawer a.my-profile"));
            break;
    }
}

WebApp.start();

})(this);  // function(Nuvola)
