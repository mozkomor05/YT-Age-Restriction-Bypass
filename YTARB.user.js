// ==UserScript==
// @name             YouTube Age Restriction Bypass
// @namespace       https://github.com/mozkomor05/YT-Age-Restriction-Bypass 
// @version         0.0.5
// @description     can't stop me from listening to S3RL - Hentai
// @author          mozkomor05 (https://github.com/mozkomor05)
// @namespace       https://github.com/mozkomor05/YT-Age-Restriction-Bypass/
// @updateURL       https://github.com/mozkomor05/YT-Age-Restriction-Bypass/raw/main/YTARB.user.js
// @downloadURL     https://github.com/mozkomor05/YT-Age-Restriction-Bypass/raw/main/YTARB.user.js
// @supportURL      https://github.com/mozkomor05/YT-Age-Restriction-Bypass/issues
// @include         https://www.youtube.com/*
// @connect         googlevideo.com
// @require         https://code.jquery.com/jquery-3.6.0.min.js
// @run-at          document-start
// ==/UserScript==

(function () {
    'use strict'

    if (!('unsafeWindow' in window))
        return;

    const _JSONParse = JSON.parse;

    /**
     * Since we need to change player information more than once, caching is effective.
     */
    const responsesCache = {};

    /**
     * @param {string} status 
     * @returns {boolean}
     */
    function isBypassable(status) {
        return ['unplayable', 'age_verification_required', 'login_required'].includes(status.toLowerCase());
    }

    /**
     * Get palyer response of restricted video
     * 
     * @param {string} videoId 
     * @returns {boolean}
     */
    function bypassResponse(videoId) {
        if (responsesCache[videoId] && responsesCache[videoId].time - Date.now() < 20 * 1000)
            return responsesCache[videoId].data;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.youtube.com/get_video_info?asv=3&video_id=' + videoId + '&eurl=https://youtube.googleapis.com/v/' + videoId, false);
        xhr.send();

        const response = JSON.parse(new URLSearchParams(xhr.response).get('player_response'));

        if (response.playabilityStatus.status === 'OK') {
            responsesCache[videoId] = {
                time: Date.now(),
                data: response
            };
            return response;
        }
        else
            return false;
    }

    /**
     * @param {object} obj 
     * @returns {object}
     */
    function bypassObject(obj) {
        const playabilityStatus = obj.playabilityStatus.status;

        if (isBypassable(playabilityStatus)) {
            const videoId = obj.videoDetails.videoId;
            const bypassedResponse = bypassResponse(videoId);

            if (bypassedResponse !== false)
                return bypassedResponse;
        }

        throw ("Couldn't bypass");
    }

    function init() {
        let bypassedInitialResponse = null;

        const _defineProperty = Object.defineProperty;
        let externallyDefinedDescriptor = window.Object.getOwnPropertyDescriptor(window, "ytInitialPlayerResponse");

        /**
         * When YouTube video is accesed directly, YT adds `ytInitialPlayerResponse` object to the page, which contains the video 
         * information and restrictions. It is already JavaScript object, so intersecting `JSON.prepare` won't do anything. In order to bypass
         * the information, it is necessary to define object property setter manually.
         */
        _defineProperty(unsafeWindow, "ytInitialPlayerResponse", {
            configurable: true,
            set: function (value) {
                try {
                    bypassedInitialResponse = bypassObject(value);
                }
                catch {
                    bypassedInitialResponse = value;
                }

                if (externallyDefinedDescriptor && externallyDefinedDescriptor.set)
                    externallyDefinedDescriptor.set(bypassedInitialResponse);
            },
            get: function () {
                if (externallyDefinedDescriptor && externallyDefinedDescriptor.get)
                    return externallyDefinedDescriptor.get();

                return bypassedInitialResponse;
            }
        });

        /**
         * AdBlock and other extensions tends to change `ytInitialPlayerResponse` setter aswell, thus overwriting our changes.
         */
        unsafeWindow.Object.defineProperty = function (obj, prop, descriptor) {
            if (obj === unsafeWindow && prop === "ytInitialPlayerResponse") {
                externallyDefinedDescriptor = descriptor;
            } else {
                _defineProperty(obj, prop, descriptor);
            }
        }

        /**
         * It is necessary to intersect `JSON.parse` method, since it is the only method which receives final data before they are
         * processed. Intersecting `XMLHttpRequest` might seem like a good idea, hovewer YouTube combines many responses into the final
         * JSON so we might not receive final data.
         */
        unsafeWindow.JSON.parse = function (text, reviver) {
            let dataObj = _JSONParse(text, reviver);

            try {
                if ('playerResponse' in dataObj)
                    dataObj.playerResponse = bypassObject(dataObj.playerResponse);
                else if ('playabilityStatus' in dataObj)
                    dataObj = bypassObject(dataObj);
                else if (Array.isArray(dataObj)) {
                    const responseElement = dataObj.find(o => 'playerResponse' in o);

                    if (responseElement)
                        responseElement.playerResponse = bypassObject(responseElement.playerResponse);
                }
            } catch { }

            return dataObj;
        }
    }

    init();
})();