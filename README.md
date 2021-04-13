# YTARB -   YouTube Age Restriction Bypass
Changing your date birth isn't enough anymore. In order to watch age-restricted videos you have to verify yourself using personal documents. Not with this script though.

# Description

Bypass video age restrictions by abusing the fact that calling `https://www.youtube.com/get_video_info` does not require any verification. The script intersects default `JSON.parse` method which YouTube uses to decode AJAX responses. The bypass might be only temponary, since YT can enforce authentization for every single AJAX call. 

In that case [youtube-dl](https://github.com/ytdl-org/youtube-dl) will be the only available option.  

## Features
- Watch age-restricted videos without having to verify your age.
- Watch age-restricted videos without even being logged in (unstable?).
- Watch restriced videos in embeds (without having to open YouTube).

# Installation
Install this script with [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey etc.) extension avalaible for all modern browsers.

## Install link
Tampermonkey (and similar extensions) should automatically recognize install links: 

https://raw.githubusercontent.com/mozkomor05/YT-Age-Restriction-Bypass/main/YTARB.user.js

Otherwise install the script manually.
