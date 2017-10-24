var map;
var ws;
var data;
var wsprofile;
var randomMap;
var lastCommand;
var playerData;
$( document ).ready(function() {
	/*
	  var map;	
	  var playerData;
	  var ws;	
	  var lastCommand;
	  var randomMap;
	  */

	  var currentId;
	  var urlParams;
	  
	  (window.onpopstate = function () {
		  var match,
			  pl     = /\+/g,  // Regex for replacing addition symbol with a space
			  search = /([^&=]+)=?([^&]*)/g,
			  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			  query  = window.location.search.substring(1);

		  urlParams = {};
		  while (match = search.exec(query))
			 urlParams[decode(match[1])] = decode(match[2]);
	  })();

	  String.prototype.format = function() {
		  var str = this;
		  for (var i = 0; i < arguments.length; i++) {       
			var reg = new RegExp("\\{" + i + "\\}", "gm");             
			str = str.replace(reg, arguments[i]);
		  }
		  return str;
		}

	  var googleApikey = "AIzaSyBOxTGl7m1u9h07PHa_H_mW4EVRxobgdpA"; // This will only work from iamwyza.github.io
	  var localKey = getParameterByName("apiKey");
	  if (localKey != null)
		  googleApikey = localKey;

	  var profileId = getParameterByName("profile");


		var regexReplaceUrl = new RegExp(/^(file:\/\/.*Index.html)/);

	  
	  

	  var entities = getEntities();
	  var urlConfig = getParameterByName("config");
	  var width = 1920;
	  var height = 1080;

			  
	  var temp = getParameterByName('width');
	  if (temp != undefined && temp !=null) {
		  width = temp;
	  }
	  
	  temp = getParameterByName('height');
	  if (temp != undefined && temp !=null) {
		  height = temp;
	  }

	  var isEditing = getParameterByName('editing') == "true";

	  $("html").css({
		  'height':height + "px",
		  'width':width + "px",
		  'margin': "0px",
		  'padding': "0px",
		  'overflow' : "hidden"
	  });
	  
	  $('body').css({
		  'width':"100%",
		  'height':"100%",
		  'margin': "0px",
		  'padding': "0px"
	  });

	  if (isEditing) {
		  $('body').css('background-color', '#000000');
	  }

	  console.log(profileId);

	  if (profileId != undefined){
		  if (isEditing) {
			init(function() {
				wsprofile.send("load|" + profileId);
				loadDivs();
			});

		  }else{
			connectToProfile(function() {
				wsprofile.send("load|" + profileId);
			});
  
			connect();
		  }
		  
	  } else if (urlConfig == undefined || urlConfig == null )
	  {
		  $('body').css('background-color', '#000000');	
		  $('#initialSettingsDialog').show().dialog({
			  width:500,
			  title: "Initial Setup",
			  buttons: {
				  "Done": function(e) {
					  
					  width = $('#setupPageWidth').val() - 4;
					  height = $('#setupPageHeight').val() - 4;

					  map = getDefault();
					  map.containers.charms.top = height - 180;
					  map.containers.charms.left = 4;
					  map.containers.spells.top = height - 42 - map.containers.skills.height;
					  map.containers.spells.left = width - map.containers.spells.width;
					  map.containers.skills.top = height - 42 ;
					  map.containers.skills.left = width - map.containers.skills.width;
					  map.containers.items.top = 0;
					  map.containers.items.left = width - map.containers.items.width;
					  map.containers.dreamers.top = 55;
					  map.containers.dreamers.left = width - map.containers.dreamers.width;
					  map.containers.misc.top = 55;
					  map.containers.misc.left = width - (map.containers.dreamers.width + map.containers.misc.width);
					  map.containers.disabled.top = 178;
					  map.containers.disabled.left = 508;
					  isEditing = true;
					  $('#pageWidth').val(width);
					  $('#pageHeight').val(height);
					  $('html').css({'width' : width + 'px', 'height' : height + 'px'});
					  urlParams.editing = "true";
					  if (profileId == undefined)
						  profileId = 1;

					  init();
					  updateUrlConfig();
					  $(this).remove();
				  }
			  }
		  });
	  }else{
		  try {
			  $('#importDialog').show().dialog({
				width: 500,
				title: "Import Settings",
				buttons: {
					"Done":function(){
						map = JSON.parse(LZString.decompressFromEncodedURIComponent(urlConfig));
						profileId = $('#importProfileSelect').val();
						delete urlParams["config"];
						init(function() {
							updateUrlConfig();
						});
						$('.disabled').hide();
					}
				});
				
				$('#pageSettingsButton').on("click", function(e) {
					$('#pageSettingsDialog').dialog().show();
				});
				
				$('#toggleSnapButton').on("click", function(e) {
					var isSnap = !$('.container').draggable("option", "snap");
					
					$('.container, .misc-container').each(function(i,e) { 
						$(e).draggable("option", "snap", isSnap); 
						$(e).draggable("option", "grid", isSnap ? [20,20] : null);
					});
					$(e.target).css('color', (isSnap ? '#00FF00' : '#FFFFFF'));
				});

				$('#getTinyUrl').on('click', function(e)  {
					$('#tinyUrlDiv').show().dialog({
						width: 500,
						title: "Export Config"
					});

					toTiny(window.location.href.replace("editing=true",""), googleApikey, function(value){
						$('#tinyUrlText').val(value);
					})
					
				});

				$('#pageButtons').show();

				$('#copyUrl').on('click', function() {
					$('#tinyUrlText').select();
					try {
						var successful = document.execCommand('copy');
						var msg = successful ? 'successful' : 'unsuccessful';
						
					  } catch (err) {
						console.log('Oops, unable to copy');
					  }
				})

				$('#scale').on('change', function() {
					map.containers[currentId].scale = $('#scale').val();
					$('#' + currentId + ' .itemDiv img').each(function(i,e) {
						var scale = $('#scale').val();
						$(e).css('zoom', scale + "%");
						$(e).parent().css("width", (1 + (156 * (scale/100))) + "px");
						$(e).parent().css("height", (1 + (156 * (scale/100))) + "px");
					});
					updateUrlConfig();
				});
				
				$('#hideWhenMissing').on('change', function() {
					map.containers[currentId].hideWhenMissing = $('#hideWhenMissing').prop("checked");
					
					if (map.containers[currentId].hideWhenMissing) 
						$('#' + currentId).addClass('hideIfSet')
					else
						$('#' + currentId).removeClass('hideIfSet')
					
					
					updateUrlConfig();
					updateVisible();
				});
				
				$('#flourish').on('change', function() {
					map.containers[currentId].flourish = $('#flourish').val();
					
					if ($('#flourish').val() == "none")
					{
						if ( $('#' + currentId + ' .flourish').length > 0) 
						$('#' + currentId + ' .flourish').remove();
					}else{
						addFlourish(currentId, map.containers[currentId].flourish);
					}
					updateUrlConfig();
				});
				
				$('#growDirection').on('change', function() {
					map.containers[currentId].growDirection = $('#growDirection').val();
					if ($('#' + currentId).hasClass('itemDivGrowLeft'))
						$('#' + currentId).removeClass('itemDivGrowLeft');
						
						$(this).dialog("close").remove();
						
					}
				}
			  });
		  }catch(e) {
			  alert("failed to load config");
			  console.log(e);
			  map = getDefault();
			  init();
		  }
	  }
	  
	  function init(callback) {

		  if(isEditing) {
			  $('#profiles div').css("color", "#FFFFFF");
			  $('#profile' + profileId).css("color", "#00FF00");
			  $('#containerSettingDialog').show().dialog({
				  width:500,
				  title: "Settings"
			  });

			  $('#miscSettingsDialog').show().dialog({
				  width:500,
				  title: "Settings"
			  }).dialog("close");
			  
			  $('#pageSettingsDialog').show().dialog({
				  width:500,
				  title: "Page Settings"
			  }).dialog("close");

			  $('#pageWidth').val(width);
			  $('#pageHeight').val(height);
			  $(document.body).css({"background-color" : '#000000', "border" :"2px solid #00FF00"});

			  $('#containerSettingDialog').dialog("close");
			  $(document.body).contextMenu({
				  selector: '.container:not([id=disabled])', 
				  callback: function(key, options) {
					  loadSettings(options.$trigger[0].id);
					  $('#miscSettingsDialoge').dialog('close');
					  $('#containerSettingDialog').dialog("open");
				  },
				  items: {
					  "settings": {name: "settings", icon: "settings"}
				  }
			  });

			  $(document.body).contextMenu({
				  selector: '.misc-container', 
				  callback: function(key, options) {
					  loadMiscSettings(options.$trigger[0].id);
					  $('#containerSettingDialog').dialog("close");
					  $('#miscSettingsDialog').dialog("open");
				  },
				  items: {
					  "settings": {name: "settings", icon: "settings"}
				  }
			  });
			  
			  $('#previewModeButton').on("click", function(e) {
				  $('.container, .misc-container').toggleClass('editingDiv');
				  if ($('.editingDiv').length > 0){
					  $('.pageButton').show();
					  $(e.target).html("PREVIEW MODE");
					  $(document.body).css('background-image', 'unset');
					  $('.disabled').show();
				  }else{
					  $('.pageButton').hide();
					  $(e.target).show();
					  $(e.target).html("EDIT MODE");
					  $(document.body).css({
						  'background-image':	'url("sampleempty.png")',
						  'background-repeat':'no-repeat',
						  'background-size': urlParams.width + 'px '+ urlParams.height + 'px'
					  });
					  $('.disabled').hide();
				  }
			  });
			  
			  $('#pageSettingsButton').on("click", function(e) {
				  $('#pageSettingsDialog').dialog().show();
			  });
			  
			  $('#toggleSnapButton').on("click", function(e) {
				  var isSnap = !$('.container').draggable("option", "snap");
				  
				  $('.container, .misc-container').each(function(i,e) { 
					  $(e).draggable("option", "snap", isSnap); 
					  $(e).draggable("option", "grid", isSnap ? [20,20] : null);
				  });
				  $(e.target).css('color', (isSnap ? '#00FF00' : '#FFFFFF'));
			  });

		function addItem(container, item, name, div) {
			var itemDiv = $("<div></div>").addClass('itemDiv');
			var img = $('<img></img>').attr({'id' : name});
			img.css("zoom" , container.scale + "%");
			itemDiv.append(img);
			
			
			switch (item.type) {
				case "charm":
					img.attr('src', "images/" + item.sprite);
					itemDiv.addClass('charmDiv');
					itemDiv.removeClass("hideIfSet");
					itemDiv.css("width", (1 + (156 * (container.scale/100))) + "px");
					itemDiv.css("height", (1 + (156 * (container.scale/100))) + "px");
					break;
					
				case "spell":
					img.attr('src', "images/" + item.levelSprites[0]);
					break;
				
				case "skill":
					img.attr('src', "images/" + item.sprite);
					break;
					
				case "item":
					img.attr('src', "images/" + item.sprite);
					if ("multiple" in item && item.multiple) {
						var countDiv = $('<div></div>').attr({ 'id': name + '_count'});
						countDiv.addClass('counter');
						itemDiv.append(countDiv);
					}
					break;
					
				case "generic":
					img.attr('src', "images/" + item.sprite);
					break;	
				case "charmNotch":
					img.attr('src', "images/" + item.sprite);
					var countDiv = $('<div></div>').attr({ 'id': name + '_Filledcount'});
					countDiv.addClass('charmSlotsFilled').css("display", "block");
					itemDiv.append(countDiv);
					countDiv = $('<div></div>').attr({ 'id': name + '_count'});
					countDiv.addClass('counter').css("display", "block");
					itemDiv.append(countDiv);
					break;
				default:
					break;
			}
			
			div.append(itemDiv);

				  $('#urlText').val(window.location.href.replace(/\?.*/,"") + "?profile=" + profileId + ( overrideUrl != undefined ? "&url=" + overrideUrl : "") );
				  var config = LZString.compressToEncodedURIComponent(JSON.stringify(map));

				  toTiny(window.location.href.replace("editing=true","").replace("profile=" + profileId, "") + "&config=" + config, googleApikey, function(value){
					  $('#tinyUrlText').val(value);
				  })
				  
			  });

			  $('#pageButtons').show();

			  $('#copyUrl').on('click', function() {
				  $('#urlText').select();
				  try {
					  var successful = document.execCommand('copy');
					  var msg = successful ? 'successful' : 'unsuccessful';
					  
					} catch (err) {
					  console.log('Oops, unable to copy');
					}
					
				}
				
			}else{
				if (lastCommand == "random")
				{
					randomMap = minData;
					send("json");
					return;
				}else if(lastCommand == "relics") {
					console.log(minData);
					$.each(minData, function(i, e) {
						data[i] = e;
					});
				}else{
					data = minData;
				}
			}
			
			$.each(map.containers, function(i, container) {
				$.each(container.items, function(i2, name) {
					var item = entities[name];
					if (!item.enabled)
						return;
						
					var id = "#" + name;
					var img = $(id);
					
					if (name in data) {
						switch (item.type) {
							case "charm":
								if (name == "gotCharm_36") // Kingsoul / Void Heart is special
								{
									setSelected(data[name], id);

									if (data.gotKingFragment && !data.gotQueenFragment)
										$(id).attr('src', "images/Charm_KingSoul_Left.png");
									else if (!data.gotKingFragment && data.gotQueenFragment)
										$(id).attr('src', "images/Charm_KingSoul_Right.png");
									else if (data.gotKingFragment && data.gotQueenFragment && !data.gotShadeCharm)
										$(id).attr('src', "images/Kingsoul.png");

									if (!$(id).hasClass('selected'))
										$(id).hide();
									else
										$(id).show();
								}else{
									setSelected(data[name], id);
									if (!$(id).hasClass('selected'))
										$(id).hide();
									else
										$(id).show();
																		
									if (data[name.replace('got', 'equipped')] && !img.hasClass('equipped') )
										img.addClass('equipped');
									else if (!data[name.replace('got', 'equipped')] && img.hasClass('equipped'))
										img.removeClass('equipped');
									var brokenId = name.replace("got","broken");
									if (brokenId in data) {
										if (data[brokenId]) {
											img.attr('src', "images/" + item.brokenSprite);
										}else{
											img.attr('src', "images/" + item.sprite);
										}
									}
								}
								break;
								
							case "spell":
								setSelected(data[name] > 0, id);
								if (data[name] == 2 && img.attr("src") != item.levelSprites[1])
									img.attr("src", "images/" + item.levelSprites[1]);
								else if (data[name] != 2 && img.attr("src") == item.levelSprites[1])
									img.attr("src", "images/" + item.levelSprites[0]);
								break;
							
							case "skill":
								setSelected(data[name], id);
								break;
								
							case "item":
								if (! ("multiple" in item))
									if ("useItemState" in item && item.useItemState in data && data[item.useItemState])
									{
										setSelected(true, id);
										$(id).addClass("gaveItem");
									}else{
										setSelected(data[name], id);
									}
								else
								{
									setMultipleSelected(data[name] > 0, id);
									if (data[name] > 0) {
										$(id + '_count').html(data[name]).show();
									}else{
										$(id + '_count').hide();
									}
								}

								
								break;
							case "charmNotch": 
								if (data[name] > 0) {
									setMultipleSelected(data[name] > 0, id);
									$(id + '_Filledcount').html(data.charmSlotsFilled);
									$(id + '_count').html(data.charmSlots);
									if (data.charmSlots < data.charmSlotsFilled)
										$(id + '_Filledcount').css('color', "#FF0000");
									else
										$(id + '_Filledcount').css('color', "#FFFFFF");

								}
							break;
							case "generic":
								setSelected(data[name], id);
								
								break;	
						}
					}
				});
			});

			  $('#copyTinyUrl').on('click', function() {
				  $('#tinyUrlText').select();
				  try {
					  var successful = document.execCommand('copy');
					  var msg = successful ? 'successful' : 'unsuccessful';
					  
					} catch (err) {
					  console.log('Oops, unable to copy');
					}
			  })

			updateVisible();
			
			if ($('#hasDreamNail').length > 0 && $('#dreamNailUpgraded').length > 0 && !isEditing) {
				if ($('#hasDreamNail').hasClass("selected") && $('#dreamNailUpgraded').hasClass("selected"))
					$('#hasDreamNail').removeClass("selected").parent().hide();
				else if ($('#hasDreamNail').hasClass("selected") && !$('#dreamNailUpgraded').hasClass("selected"))
					$('#dreamNailUpgraded').removeClass("selected").parent().hide();
				else
					$('#dreamNailUpgraded').removeClass("selected").parent().hide();
			}
			
			
			
			//updateUrlConfig();
		}
		
		function updateVisible() {
			$('.hideIfSet > div.itemDiv:not(:has(>.selected)):not(:has(>.multiple))').hide();
			$('.container:not(.hideIfSet) div.itemDiv').css("display", "block");
			$('.container.hideIfSet div.itemDiv:has(>.selected)').css("display", "block");
			$('.container.hideIfSet div.itemDiv:has(>.multiple)').css("display", "block");
		}
		
		function updateUrlConfig() {
			console.log("Updating url string");
		
			config = LZString.compressToEncodedURIComponent(JSON.stringify(map));
			
			urlParams["config"] = config;
			
			window.history.pushState(config, "", "Index.html?" + $.param(urlParams) );
			
			if (config.length > 1900)
				alert("Developer Warning, config length is > 1900.  If you see this message let the developer know.");
		}
		
		function setSelected(has, id) {
			if (has && !$(id).hasClass('selected')) 
				$(id).addClass('selected').parent().removeClass('hideIfSet');
			else if (!has && $(id).hasClass('selected'))
				$(id).removeClass('selected').parent().addClass('hideIfSet');
		}
		
		function setMultipleSelected(has, id) {
			if (has && !$(id).hasClass('multiple')) 
				$(id).addClass('multiple').parent().removeClass('hideIfSet');
			else if (!has && $(id).hasClass('multiple'))
				$(id).removeClass('multiple').parent().addClass('hideIfSet');
		}
		
		function getSubSortKeys(list) {
			return Object.keys(list).sort(function(a,b){
				if (list[a].order < list[b].order)
					return -1;
				if (list[a].order > list[b].order)
					return 1;
				return 0;
			});
		}
		
		function isNumber(n) {
		  return !isNaN(parseFloat(n)) && isFinite(n);
		}
		
		function getParameterByName(name) {
			if (name in urlParams)
				return urlParams[name];
			
			return null;
		}

		function toTiny(url, apiKey, callback) {

			if (regexReplaceUrl.test(url)){ // only works if not local
				callback(url);
			}

			$.ajax({
				url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + apiKey,
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify({ longUrl: url }),
				success: function(response) {
					callback(response.id);
				}
			 });
		}

		function fromTiny(url, callback) {
			$.ajax({
				url: 'https://www.googleapis.com/urlshortener/v1/url',
				type: 'GET',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify({ shortUrl: url }),
				success: function(response) {
					callback(response.longUrl);
				}
			 });
		}
});