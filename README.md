# HollowKnightRandomizerTracker

This is the UI side of a tracker for items in Hollow Knight as an overlay in OBS.  You'll need to install this for it to work: https://drive.google.com/open?id=0B1-JBoX3q-gVal9SQUh5dEJVTFU. (also requires Modding API: https://drive.google.com/open?id=0B_b9PFqx_PR9X1ZrWGFxUGdydTg) Big Thanks to @KDT for getting the Game Side working to get this data out.  This wouldn't work at all without it.  (and of course to Team Cherry for an amazing game)

![Demo](https://github.com/iamwyza/HollowKnightRandomizerTracker/blob/master/demo.png "Demo")

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
	#spells img.selected, #skills img.selected, #items img.selected, #misc img.selected {
		-webkit-filter: grayscale(0%); /* Safari 6.0 - 9.0 */
		filter: grayscale(0%);
		border-radius: 50%;
		box-shadow: 0px 0px 40px 10px #07ff6e;
		display:block;
	}
```

## Changing the "Charm Equipped" Glow:
Like the green glow, replace `#07ff6e` with your color choice.

```css
	#charms img.equipped, #spells img.equipped, #skills img.equipped {
		box-shadow: 0px 0px 40px 10px #07ff6e;
	}
```

## Hiding/Showing ungotten items

By default the UI overlay will hide "items" like keys/grubs/eggs/lantern/etc that you haven't picked up.
Spells/Skills/Misc will show regardless, but will get the green glow when you get that item.  

If you want to show the Items in grey when you don't have them, add the following css:

```css
#items .hideIfSet { display:unset;}
#items .hideIfSet img { display:unset;}
```

Likewise if you want to hide Spells/Skills/Misc that you don't have:

```css
#spells .hideIfSet { display:none;}
#spells .hideIfSet img { display:none;}

#skills .hideIfSet { display:none;}
#skills .hideIfSet img { display:none;}

#misc .hideIfSet { display:none;}
#misc .hideIfSet img { display:none;}
```


## Changing the location of the UI elements

There are 5 "Groups" of UI elements. Charms, Spells, Skills, Items, and Misc.  Each one can be placed wherever you like.  

To change their location paste in the following.  You can set the position of the group as desired below.

For Example, the following setup says:

* Charms is 10px from the bottom edge of the screen and 10px from the left edge of the screen. IE - Bottom Left
* Skills is 10px from the bottom edge of the screen and 10px from the right edge of the screen. IE - Bottom Right
* Spells is 75px from the bottom edge of the screen and 10px from the right edge of the screen. IE - Bottom Right, but a little higher than skills.
* Items is 10px from the top edge of the screen and 10px from the right edge of the screen. IE - Top Right
* Misc is 75px from the top edge of the screen and 10px from the right edge of the screen. IE - Top Right, but a littler lower than Items.

_Note: If the original position was using `top: 10px` and you switch to `bottom: 10px`, then you need to add `top:unset;` in addition to `bottom:unset;`_

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
	
	#misc {
		position:absolute;
		top: 75px;
		right: 10px;
	}
```

## Split Broadcasting Setups

If you are running a setup wherein you have 1 machine that you game on, and another computer that does capture and broadcast via OBS, then there is more effort required.  Because Github serves up pages with https only, and because we are using websockets to connect to HollowKnight, OBS Browser Source (using chromium) disallows HTTP access to web sockets.

To get around this, you have to run the UI stuff locally.  Don't worry, it's not too difficult.

* Download The current source from https://github.com/iamwyza/HollowKnightRandomizerTracker/archive/master.zip
* Pick a folder to unzip the contents into and do so.
* Run "makeLocal.bat" by double clicking on it. (this generates a non-hosted version of the configuration)
* In OBS set the URL to `file:

What this will do is instruct the page to go query that machine on the WebSocket port instead of localhost.  Note that this does not mean that a server on the internet is querying your machine, all queries are still done purely over the local network.  This simply tells it that the game is running on another machine on your network.
