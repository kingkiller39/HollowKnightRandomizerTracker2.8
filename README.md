# HollowKnightRandomizerTracker

This is the UI side of a tracker for items in Hollow Knight as an overlay in OBS.  You'll need to install this for it to work: https://drive.google.com/open?id=0B1-JBoX3q-gVal9SQUh5dEJVTFU. (also requires Modding API: https://drive.google.com/open?id=0B_b9PFqx_PR9X1ZrWGFxUGdydTg) Big Thanks to @KDT for getting the Game Side working to get this data out.  This wouldn't work at all without it.  (and of course to Team Cherry for an amazing game)

![Demo](https://github.com/iamwyza/HollowKnightRandomizerTracker/blob/master/demo.png "Demo")

# Setup

* Open OBS
* Sources->Add->Browser Source
  * URL: https://iamwyza.github.io/HollowKnightRandomizerTracker/Index.html
  * Width: 1920 or <Width Of Your Stream>
  * Height: 1080 or <Height Of Your Stream
  * FPS: 5 
  * CSS: leave default values 
  * Shutdown Source when not visible: Checked
  * Refresh browser when scene becomes active: Checked
  * Hit Ok
 * Right Click on the new source and go to Transform->Fit To Screen (or Ctrl+F)

# `Configure`





## Split Broadcasting Setups

If you are running a setup wherein you have 1 machine that you game on, and another computer that does capture and broadcast via OBS, then there is more effort required.  Because Github serves up pages with https only, and because we are using websockets to connect to HollowKnight, OBS Browser Source (using chromium) disallows HTTP access to web sockets.

To get around this, you have to run the UI stuff locally.  Don't worry, it's not too difficult.

* Download The current source from https://github.com/iamwyza/HollowKnightRandomizerTracker/archive/master.zip
* Pick a folder to unzip the contents into and do so.
* In OBS set the URL to `file:

What this will do is instruct the page to go query that machine on the WebSocket port instead of localhost.  Note that this does not mean that a server on the internet is querying your machine, all queries are still done purely over the local network.  This simply tells it that the game is running on another machine on your network.


## Credits
* @KayDeeTee - PlayerDataTracker Coding and general help with HK data structures.
* @MyEyes (Seanpr) - Modding API used by PlayerDataTracker and general help with HK data structures.
* Mickley_3, ciplax, and RiskyCB for early testing and feedback.
* Team Cherry - Without which, we would not have Hollow Knight

## Libraries
### UI
* JQuery - https://jquery.com/
* LZ-String - http://pieroxy.net/blog/pages/lz-string/index.html
* JQuery Context Menu - https://swisnl.github.io/jQuery-contextMenu/

### PlayerDataTracker
* WebSocket-Sharp - https://github.com/sta/websocket-sharp