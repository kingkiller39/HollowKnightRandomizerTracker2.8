# HollowKnightRandomizerTracker

This is the UI side of a tracker for items in Hollow Knight as an overlay in OBS.

![Demo](https://github.com/kingkiller39/HollowKnightRandomizerTracker/blob/master/demo.png "Demo")
# Edit Layout

https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Index.html?editing=true&profile=1

# Minimum Setup 

Requires Game Version 1.5 and OBS

*Install the mod.
* Open OBS
  * Sources->Add->Browser Source
    * URL: https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/
    * Width: 1920
    * Height: 1080
    * FPS: 5 
    * CSS: leave default values 
    * Shutdown Source when not visible: Checked
    * Refresh browser when scene becomes active: Checked
    * Hit Ok
  * Right Click on the new source and go to Transform->Fit To Screen (or Ctrl+F)
  * In the game, go to Options, Mods, HKTracker Settings, and choose your preferred Style and Preset layout.


# Setup & Configuration (Customize Layout)

* Start out by going to https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Index.html
  * Follow the directions on screen to specify the height and width of your OBS capture.
  * Adjust your layout as desired (Hitting F11 to go to full screen can be helpful if your resolution is the same as your capture resolution.  That is, if you capture at 1080p and your monitor is 1080p, for example)
    * Containers of Icons can be moved around the screen using the move handles (shown when hovering).
    * Icons can be moved from one container to another or re-ordered within a container by simple drag/drop.  Icons placed in the red "DISABLED" container will not show ever.
    * Right Clicking on any container gives settings such as icon scale, flourish, hide/show icons when you don't have the item yet, and icon growth direction.
    * Containers can be resized by using the borders
    * The text containers (for seed/difficult also have settings for font size, color, and enabled/disabled)
    * The "Preview Mode" button will give you an idea of what the layout will look like in OBS.
    * Once done click the "Get Config URL" button which will give you a short version of the configuration. Copy that.


* Open OBS
  * Sources->Add->Browser Source
    * URL: https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/
    * Width: 1920 or <Width Of Your Stream>
    * Height: 1080 or <Height Of Your Stream
    * FPS: 5 
    * CSS: leave default values 
    * Shutdown Source when not visible: Checked
    * Refresh browser when scene becomes active: Checked
    * Hit Ok
  * Right Click on the new source and go to Transform->Fit To Screen (or Ctrl+F)



## Split Broadcasting Setups

If you are running a setup wherein you have 1 machine that you game on, and another computer that does capture and broadcast via OBS, then there is more effort required.  Because Github serves up pages with https only, and because we are using websockets to connect to HollowKnight, OBS Browser Source (using chromium) disallows HTTP access to web sockets.

Thankfully Windows provides an excellent and easy workaround.  

* Open a Windows Commmand Prompt - Run as administrator
* Where "gamingpc" is the name of the machine you play Hollow Knight on:
  * `netsh interface portproxy add v4tov4 listenaddress=localhost listenport=11420 connectaddress=gamingpc connectport=11420`
* This command sets a redirect in windows that says requests to localhost:11420 are to be directed to gamingpc:11420.

## Changelog

### 2.7.4.0
* You can now share your overlay layout. Short URLs now provided by Firebase.
* Randomizer difficulty will now correctly show.
* You will need to re-setup your tracker if you want to take advantage of the following new features:
	* The overlay will now show the randomizer preset.
	* The overlay will now show your last bench.
	* The overlay will now show your essence count.
* Added new sprite for mothwing cloak. The tracker will now acurrately show mothwing cloack to shade cloak.
* Code optimization and general bug fixes.

## Credits
* @iamwyza - Forked repo from.
* @KayDeeTee - PlayerDataTracker Coding and general help with HK data structures.
* @Seanpr - Modding API used by PlayerDataTracker and general help with HK data structures.
* Mickley_3, ciplax, and RiskyCB for early testing and feedback.
* Team Cherry - Without which, we would not have Hollow Knight

## Libraries
### UI
* JQuery - https://jquery.com/
* LZ-String - http://pieroxy.net/blog/pages/lz-string/index.html
* JQuery Context Menu - https://swisnl.github.io/jQuery-contextMenu/

### PlayerDataTracker
* WebSocket-Sharp - https://github.com/sta/websocket-sharp
