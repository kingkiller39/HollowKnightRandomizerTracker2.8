# HollowKnightRandomizerTracker

This is the UI side of a tracker for items in Hollow Knight as an overlay in OBS.  You'll need to install this for it to work: https://drive.google.com/open?id=0B1-JBoX3q-gVal9SQUh5dEJVTFU


# Setup

* Open OBS
* Sources->Add->Browser Source
  * URL: https://iamwyza.github.io/HollowKnightRandomizerTracker/Index.html
  * Width: 1920 or <Width Of Your Stream>
  * Height: 1080 or <Height Of Your Stream
  * FPS: 30 (or lower, there isn't any animations on this right now, so really it could be 5 and it'd still be fine)
  * CSS: leave default values (See below in [Configure](#configure) to adjust your layout/colors)
  * Shutdown Source when not visible: Checked
  * Refresh browser when scene becomes active: Checked
  * Hit Ok
 * Right Click on the new source and go to Transform->Fit To Screen (or Ctrl+F)
# `Configure`

In the event that you want to adjust how certain things look, you can do so using the CSS section of the BrowserSource Properties.  

## Changing the "Item Gotten" green glow. 
Paste the following in, then change `#07ff6e` with whatever color you want.  (Use a color picker, like the one that pops up here: https://www.google.com/search?q=color+picker)
```css
	#charms img.selected, #spells img.selected, #skills img.selected, #items img.selected {
		-webkit-filter: grayscale(0%); /* Safari 6.0 - 9.0 */
		filter: grayscale(0%);
		border-radius: 50%;
		box-shadow: 0px 0px 40px 10px #07ff6e;
	}
```
## Changing the "Charm Equipped" Purple Glow:
Like the green glow, replace `#8912ff` with your color choice.

```css
	#charms img.equipped, #spells img.equipped, #skills img.equipped {
		box-shadow: 0px 0px 40px 10px #8912ff;
	}
```

## Changing the location of the UI elements

There are 4 "Groups" of UI elements. Charms, Spells, Skills, and Items.  Each one can be placed wherever you like.  

To change their location paste in the following.  You can set the position of the group as desired below.

For Example, the following setup says:

* Charms is 10px from the bottom edge of the screen and 10px from the left edge of the screen. IE - Bottom Left
* Skills is 10px from the bottom edge of the screen and 10px from the right edge of the screen. IE - Bottom Right
* Spells is 75px from the bottom edge of the screen and 10px from the right edge of the screen. IE - Bottom Right, but a little higher than skills.
* Items is 10px from the top edge of the screen and 10px from the right edge of the screen. IE - Top Right

```css
	#charms {
		position:absolute;
		bottom:10px;
		left:10px;
	}
  
	#spells {
		position:absolute;
		bottom:75px;
		right:10px;
	}
  
	#skills {
		position:absolute;
		bottom:10px;
		right:10px;
	}
  
	#items {
		position:absolute;
		top:10px;
		right:10px;
	}
	
```

## Split Broadcasting Setups

If you are running a setup wherein you have 1 machine that you game on, and another computer that does capture and broadcast via OBS, then there is 1 small change that you need to make.
Instead of using the url "https://iamwyza.github.io/HollowKnightRandomizerTracker/Index.html", you need to add ?url=gamingmachinesname to the end, such as: "https://iamwyza.github.io/HollowKnightRandomizerTracker/Index.html?url=myrig".

What this will do is instruct the page to go query that machine on the WebSocket port instead of localhost.  Note that this does not mean that a server on the internet is querying your machine, all queries are still done purely over the local network.  This simply tells it that the game is running on another machine on your network.
