  var map;
  var ws;
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
		
		var isEditing = getParameterByName('editing') == "true";
		var entities = getEntities();
		var currentId;
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
		
		var urlConfig = getParameterByName("config");
		
		if (urlConfig !=undefined && urlConfig.length > 0) {
			try {
				map = JSON.parse(LZString.decompressFromEncodedURIComponent(urlConfig));
			}catch(e) {
				alert("failed to load config");
				console.log(e);
				map = getDefault();
			}
		}else{
			map = getDefault();
		}
		
		init();
		
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
		$('#pageWidth').val(width);
		$('#pageHeight').val(height);
		
		
		function init() {
		
			if(isEditing) {
				
				$('#containerSettingDialog').show().dialog({
					width:500,
					title: "Settings"
				});
				
				$('#pageSettingsDialog').show().dialog({
					width:500,
					title: "Page Settings"
				}).dialog("close");
				
				$('#containerSettingDialog').dialog("close");
					$(document.body).contextMenu({
								selector: '.container:not([id=disabled])', 
								callback: function(key, options) {
									loadSettings(options.$trigger[0].id);
									$('#containerSettingDialog').dialog("open");
								},
								items: {
									"settings": {name: "settings", icon: "settings"}
								}
								
							});
							
					var div = $('<div></div>').html("PREVIEW MODE").css({'top' :'2px'}).addClass('pageButton');
					div.on("click", function(e) {
						
						$('.container').toggleClass('editingDiv');
						if ($('.editingDiv').length > 0){
							$('.pageButton').show();
							$(e.target).html("PREVIEW MODE");
							$(document.body).css('background-image', 'unset');
							$('#disabled').show();
						}else{
							$('.pageButton').hide();
							$(e.target).show();
							$(e.target).html("EDIT MODE");
							$(document.body).css({
							'background-image':	'url("sampleempty.png")',
							'background-repeat':'no-repeat',
							'background-size':urlParams.width + 'px '+ urlParams.height + 'px'
							});
							$('#disabled').hide();
						}
					});
					$(document.body).append(div);
					
					
					var div = $('<div></div>').html("Page Settings").css({'top' :'33px'}).addClass('pageButton');
					div.on("click", function(e) {
						
						$('#pageSettingsDialog').dialog().show();
					});
					
					$(document.body).append(div);
					
					var div = $('<div></div>').html("Toggle Snap").css({'top' :'66px', 'color' : '#00FF00'}).addClass('pageButton');
					div.on("click", function(e) {
						var isSnap = !$('.container').draggable("option", "snap");
						
						$('.container').each(function(i,e) { 
							$(e).draggable("option", "snap", isSnap); 
							$(e).draggable("option", "grid", isSnap ? [20,20] : null);
						});
						console.log(e);
						$(e.target).css('color', (isSnap ? '#00FF00' : '#FFFFFF'));
						
					});
					
					$(document.body).append(div);
					
				$('#scale').on('change', function() {
					map.containers[currentId].scale = $('#scale').val();
					$('#' + currentId + ' .itemDiv img').each(function(i,e) {
						$(e).css('zoom', $('#scale').val() + "%");
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
						
					if ($('#' + currentId).hasClass('itemDivGrowRight'))
						$('#' + currentId).removeClass('itemDivGrowRight');
						
					$('#' + currentId).addClass('itemDivGrow' + map.containers[currentId].growDirection);
					
					updateUrlConfig();
				});
				
				$('#pageWidth').on('change', function() {
					var value = $('#pageWidth').val();
					
					if (isNumber(value)) {
						$('html').css("width", value + "px");
						urlParams.width = value;
						updateUrlConfig();
					}
				});
				$('#pageHeight').on('change', function() {
					var value = $('#pageHeight').val();
					
					if (isNumber(value)) {
						$('html').css("height", value + "px");
						urlParams.height = value;
						updateUrlConfig();
					}
				});
			}
		
			$.each(map.containers, function(i, container) {

				if (!isEditing && i == "disabled")
					return;
				
				var div = $('<div></div>').attr({
					'id': i,
					'class' :'container'
				})
				.css({
					'top' :container.top,
					'left' :container.left,
					'position' : 'absolute',
					'width': container.width,
					'height': container.height
				});
				
				if (! ("growDirection" in container)) {
					container.growDirection = "Right";
				}
				
				div.addClass('itemDivGrow' + container.growDirection);
				
				if (i == "disabled") {
					div.css({ border : "#FF0000 1px solid", color: "#FF0000"});
					div.append($("<span></span>").html("HIDDEN/DISABLED"));
				}
				
				if (container.hideWhenMissing)
					div.addClass("hideIfSet");
				
				if (isEditing) {
					div.resizable({
							handles: "se",
							containment: $(document.body), 
							stop: function(event, ui) {
								var id = $(ui.element).attr('id');
								map.containers[id].width = ui.size.width;
								map.containers[id].height = ui.size.height;
								updateUrlConfig();
							}
						})
						.sortable({ 
							revert: true,
							connectWith: '.container',
							update: updateContainerItemOrder,
							items: '.itemDiv'
						})
						.draggable({ 
							containment: $(document.body), 
							handle: ".divMoveHandleBottom, .divMoveHandleTop",
							scroll: false,
							grid: [ 20, 20 ],
							snap: true,
							stop: function(event, ui) {
								var id = $(ui.helper).attr('id');
								map.containers[id].left = ui.position.left;
								map.containers[id].top = ui.position.top;
								updateUrlConfig();
								}						
							})
						
						.addClass('editingDiv');
						
					div.append($('<div></div>').addClass('divMoveHandleTop').append($('<span></span>').addClass('ui-icon ui-icon-arrow-4-diag')));
					div.append($('<div></div>').addClass('divMoveHandleBottom').append($('<span></span>').addClass('ui-icon ui-icon-arrow-4-diag')));
						
					$(document.body).css({"background-color" : '#000000', "border" :"2px solid #00FF00"});
				}
				
				$.each(container.items, function(i2, name) {
					var item = entities[name];
					
					if (!item.enabled)
						return;
					
					var itemDiv = $("<div></div>").addClass('itemDiv');
					var img = $('<img></img>').attr({'id' : name});
					img.css("zoom" , container.scale + "%");
					itemDiv.append(img);
					
					
					switch (item.type) {
						case "charm":
							img.attr('src', "images/" + item.sprite);
							itemDiv.addClass('charmDiv');
							itemDiv.removeClass("hideIfSet");
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
						default:
							break;
					}
					/*
					if (i2 % container.itemsPerRow == 0)
						itemDiv.css({"clear":"both"});*/
					
					div.append(itemDiv);
				});
			
				$('body').append(div);
				
				if ("flourish" in container && container.flourish != "none")
				{
					addFlourish(i, container.flourish);
				}
			
			});
			connect();
		}
		
		function addFlourish(id, flourish) {
			if ( $('#' + id + ' .flourish').length > 0) 
				$('#' + id + ' .flourish').remove();
				
			var flourish = $("<div></div>").addClass("flourish").addClass(flourish + "Flourish").append($('<img src="images/profile_fleur0012.png">'));
			flourish.width($('#' + id).width() - 174 + 51);
			if (flourish.hasClass("topRightFlourish")) {
				flourish.find('img').css("left",flourish.width() + "px");
			}
			
			$('#' + id).on("resize", function(e) {
				var flourishDiv = $(e.target).find(".flourish");
				flourishDiv.css("width",$('#' + id).width() - 174 + 51);
				if (flourishDiv.hasClass("topRightFlourish")) {
					
					flourishDiv.find('img').css("left",flourishDiv.width() + "px");
				}
				
				
			});
			
			$('#' + id).append(flourish);
		}
		
		function loadSettings(id) {
			currentId = id;
			var container = map.containers[id];
			if ("scale" in container) 
				$('#scale').val(container.scale);
			
			if ("hideWhenMissing" in container)
				$('#hideWhenMissing').prop("checked", container.hideWhenMissing);
				
			if ("flourish" in container) 
				$('#flourish').val(container.flourish);
				
			if ("growDirection" in container) 
				$('#growDirection').val(container.growDirection);
		}
		
		function updateContainerItemOrder(event, ui) {
			$.each(map.containers, function(i, container) {
				container.items = $.map($('#' + i).find('img'), function(e, i) { return $(e).attr('id'); });
				
				$.each(container.items, function(i2, name) {
					var item = entities[name];
					
					if (!item.enabled)
						return;
						
					$('#' + name).css("zoom" , container.scale + "%");
					
					if (i2 % container.itemsPerRow == 0)
						$('#' + name).parent().css({"clear":"both"});
					else
						$('#' + name).parent().css({"clear":"none"});
				});
			})
			
		}
		
		
		function connect() {
			console.log("Connecting");
			try {
				var url = "localhost";
				var overrideUrl = getParameterByName("url");

				if (overrideUrl != undefined  && overrideUrl != null)
					url = overrideUrl;
					
				ws = new WebSocket("ws://" + url + ":11420/playerData");
				ws.onerror = function (error) {
					console.log(error);
				}
				ws.onopen = getPlayerData;
				
				ws.onmessage = function (evt) 
				{ 
					var received_msg = evt.data;
					
					var json = JSON.parse(received_msg);
					
					updatePlayerData(json);
				}
				ws.onclose = function(){
					// Try to reconnect in 5 seconds
					setTimeout(function(){connect()}, 5000);
				};
			}catch(e) {
				console.log(e);
			}
			
		}
		
		function send(command) {
			lastCommand = command;
			ws.send(command);
		}
				
		function getPlayerData() {
			console.log("Refreshing data");
			send("random");
		}
		
		function updatePlayerData(minData) {

			if ("var" in minData) {
				if (minData.var == "SaveLoaded" || minData.var == "NewSave") {
					send("random");
					return;
				}else{
					var name = minData.var;
					
					
					var value;
					
					switch (minData.value) {
						case "True":
						case true:
						case "true":
							value = true;
							break;
						case "False":
						case false:
						case "false":
							value = false;
							break;
						default: 
							value = minData.value;
							break;
					}
					if ((name == "fireballLevel" || name == "quakeLevel" || name == "screamLevel") && randomMap != undefined && (name + value) in randomMap)
						name = randomMap[name + value];
					else if (randomMap != undefined && name in randomMap) 
						name = randomMap[name];
					
					
					
					switch (name) {
						case "fireballLevel1":
						case "fireballLevel2":
							data["fireballLevel"]++;
							break;
						case "quakeLevel1":
						case "quakeLevel2":
							data["quakeLevel"]++;
							break;
						case "screamLevel1":
						case "screamLevel2":
							data["screamLevel"]++;
							break;
						default:
							data[name] = value;
							break;
					}
					
				}
				//Currently the individual events don't map properly for randomizer, asking for full dump instead until we have a auto-mapping.
			}else{
				if (lastCommand == "random")
				{
					randomMap = minData;
					send("json");
					return;
				}
					
				data = minData;
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
								setSelcted(data[name], id);
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
								break;
								
							case "spell":
								setSelcted(data[name] > 0, id);
								if (data[name] == 2 && img.attr("src") != item.levelSprites[1])
									img.attr("src", "images/" + item.levelSprites[1]);
								else if (data[name] != 2 && img.attr("src") == item.levelSprites[1])
									img.attr("src", "images/" + item.levelSprites[0]);
								
								break;
							
							case "skill":
								setSelcted(data[name], id);
								
								break;
								
							case "item":
								if (! ("multiple" in item))
									setSelcted(data[name], id);
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
								
							case "generic":
								setSelcted(data[name], id);
								
								break;	
						}
					}
				});
			});

			updateVisible();
			
			if ($('#hasDreamNail').length > 0 && $('#dreamNailUpgraded').length > 0 && !isEditing) {
				if ($('#hasDreamNail').hasClass("selected") && $('#dreamNailUpgraded').hasClass("selected"))
					$('#hasDreamNail').removeClass("selected").parent().hide();
				else if ($('#hasDreamNail').hasClass("selected") && !$('#dreamNailUpgraded').hasClass("selected"))
					$('#dreamNailUpgraded').removeClass("selected").parent().hide();
				else
					$('#dreamNailUpgraded').removeClass("selected").parent().hide();
			}
			
			
				
			
			updateUrlConfig();
		}
		
		function updateVisible() {
			$('.hideIfSet > div.itemDiv:not(:has(>.selected)):not(:has(>.multiple))').hide();
			$('.container:not(.hideIfSet) div.itemDiv').css("display", "block");
		}
		
		function updateUrlConfig() {
			console.log("Updating url string");
		
			config = LZString.compressToEncodedURIComponent(JSON.stringify(map));
			
			urlParams["config"] = config;
			
			window.history.pushState(config, "", "Index.html?" + $.param(urlParams) );
			
			if (config.length > 1900)
				alert("Developer Warning, config length is > 1900.  If you see this message let the developer know.");
		}
		
		function setSelcted(has, id) {
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
});