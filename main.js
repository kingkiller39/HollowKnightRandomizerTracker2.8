var map;
var ws;
var data;
var wsprofile;
var lastCommand;
var playerData;
$( document ).ready(function() {
	/*
	  var map;	
	  var playerData;
	  var ws;	
	  var lastCommand;
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
	
	  var makeNew = getParameterByName("makeNew");
		
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

	  if (profileId != undefined && makeNew == null){
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
					  map.containers.charms.top = height - 161;
					  map.containers.charms.left = 4;
					  map.containers.spells.top = height - 42 - map.containers.skills.height;
					  map.containers.spells.left = width - map.containers.spells.width;
					  map.containers.skills.top = height - 42 ;
					  map.containers.skills.left = width - map.containers.skills.width;
					  map.containers.items.top = 0;
					  map.containers.items.left = width - map.containers.items.width;
					  map.containers.dreamers.top = 48;
					  map.containers.dreamers.left = width - map.containers.dreamers.width;
					  map.containers.misc.top = 48;
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

					  init(function() {
							
							updateUrlConfig();
					  });
					  
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

			  $('#getTinyUrl').on('click', function(e)  {
				  $('#tinyUrlDiv').show().dialog({
					  width: 500,
					  title: "Export Config"
				  });
				  var overrideUrl = getParameterByName("url");

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
			  
			  $('#miscFontSize').on('change', function() {
				  var value = $('#miscFontSize').val();
				  map.misc_containers[currentId].fontSize = value;

				  if (isNumber(value)) {
					  $('#' + currentId).css("font-size", value + "px");
					  updateUrlConfig();
				  }
			  });

			  $('#miscFontColor').on('change', function() {
				  var value = $('#miscFontColor').val();
				  map.misc_containers[currentId].color = value;
				  
				  $('#' + currentId).css("color", value);
				  updateUrlConfig();
			  });

			  $('#miscEnabled').on('change', function() {
				  map.misc_containers[currentId].enabled = $('#miscEnabled').prop("checked");
				  
				  if (map.misc_containers[currentId].enabled) 
					  $('#' + currentId).removeClass('disabled');
				  else
					  $('#' + currentId).addClass('disabled');
				  
				  updateUrlConfig();
			  });

			  $('#profiles div').on('click', function(e) {
				  var id = $(e.target).attr('id');
				  console.log(id);
				  if (id != "profile" + profileId){
					  profileId = id.replace("profile", "");
					  console.log(profileId);
					  $('#profiles div').css("color", "#FFFFFF");
					  $(e.target).css("color", "#00FF00");
					  wsprofile.send("load|" + profileId);
				  }
			  });

		  }
	  
		  loadDivs();
		  $('.container, .misc-container').hide();
		  connect();
		  connectToProfile(callback);
	  }


	  function loadDivs() {

		  var seenItems = {};  //If I add new icons, they aren't going to be in any of the containers, so we need to go ahead and add them somewhere, for now they'll get added to the disabled box.

		  $('.container,.misc-container').remove();

		  if (map == undefined)
		  return;
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
				  div.addClass('disabled');
				  div.append($("<span></span>").html("HIDDEN/DISABLED"));
			  }
			  
			  if (container.hideWhenMissing)
				  div.addClass("hideIfSet");
			  
			  if (isEditing) {
				  makeDivMovable(div, container);
			  }
			  
			  $.each(container.items, function(i2, name) {
				  var item = entities[name];

				  if (item == undefined){
					  container.items.splice(i2, 1);
					  return;
				  }

				  if (isEditing){
					  seenItems[name] = true;
				  }
				  
				  if (!item.enabled)
					  return;
				  
				  addItem(container, item, name, div);
				  
			  });
		  
			  $('body').append(div);
			  
			  if ("flourish" in container && container.flourish != "none")
			  {
				  addFlourish(i, container.flourish);
			  }
		  
		  });

		  if (!("misc_containers" in map) )
			  map.misc_containers = getDefault().misc_containers;

		  

		  $.each(map.misc_containers, function(i, e) {
			  if (e.enabled || isEditing) {
				  var div = $('<div></div>').attr('id', i).addClass('misc-container').css({
					  width: e.width + 'px',
					  height: e.height + 'px',
					  top: e.top + 'px',
					  left: e.left + 'px',
					  position: 'absolute',
					  'font-size': e.fontSize + "px",
					  color: e.color
				  });
				  if (isEditing)
					  makeDivMovable(div, e);

				  if (!e.enabled)
					  div.addClass('disabled');
				  $('body').append(div);
			  }
		  });
					  
		  if (isEditing) {
			  $.each(entities, function(name,entity) {
				  if (!(name in seenItems) && entity.enabled) {
					  addItem(map.containers.disabled, entity, name, $('#disabled'));
				  }
			  }); 
		  }
	  }


	  function makeDivMovable(div, container) {
		  
		  div.resizable({
			  handles: "n,e,s,w",
			  minWidth: (div.hasClass('container') ? 164 * (container.scale/100) : 20),
			  minHeight:(div.hasClass('container') ? 164 * (container.scale/100) : 20),
			  containment: $(document.body), 
			  stop: function(event, ui) {
				  var id = $(ui.helper).attr('id');
				  if ($(ui.helper).hasClass('container')) {
					  map.containers[id].width = ui.size.width;
					  map.containers[id].height = ui.size.height;
				  }else if  ($(ui.helper).hasClass('misc-container')) {
					  map.misc_containers[id].width = ui.size.width;
					  map.misc_containers[id].height = ui.size.height;
				  }
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
			  snap: "body, .container, .misc-container",
			  stop: function(event, ui) {
				  var id = $(ui.helper).attr('id');
				  if ($(ui.helper).hasClass('container')) {
					  map.containers[id].left = ui.position.left;
					  map.containers[id].top = ui.position.top;
				  }else if  ($(ui.helper).hasClass('misc-container')) {
					  map.misc_containers[id].left = ui.position.left;
					  map.misc_containers[id].top = ui.position.top;
				  }
				  updateUrlConfig();
				  }						
			  })
		  
		  .addClass('editingDiv');
		  
		  div.append($('<div></div>').addClass('divMoveHandleTop').append($('<span></span>').addClass('ui-icon ui-icon-arrow-4-diag')));
		  div.append($('<div></div>').addClass('divMoveHandleBottom').append($('<span></span>').addClass('ui-icon ui-icon-arrow-4-diag')));
	  }

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

	  function loadMiscSettings(id) {
		  currentId = id;
		  var container = map.misc_containers[id];
		  if ("color" in container) 
			  $('#miscFontColor').val(container.color);
		  
		  if ("enabled" in container)
			  $('#miscEnabled').prop("checked", container.enabled);
			  
		  if ("fontSize" in container) 
			  $('#miscFontSize').val(container.fontSize);
			  

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
		  updateUrlConfig();
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
			  ws.onopen = function() {
				  $('#connectionStatus').html("Connected").css("color", "#00FF00");
				  $('.container, .misc-container').show();
				  getPlayerData();
			  }
			  
			  ws.onmessage = function (evt) 
			  { 
				  var received_msg = evt.data;
				  if (received_msg == "undefined"){
					  updatePlayerData({});
					  return;
				  }

				  var json = JSON.parse(received_msg);
				  
				  updatePlayerData(json);
			  }
			  ws.onclose = function(){
				$('#connectionStatus').html("Not Connected").css("color", "#FF0000");
				$('.container, .misc-container').hide();
				  // Try to reconnect in 5 seconds
				  setTimeout(function(){connect()}, 5000);
			  };

			  

		  }catch(e) {
			  console.log(e);
		  }
		  
	  }

	  function connectToProfile(callback) {
		  console.log("Connecting to ProfileStorage");
		  try {
			  var url = "localhost";
			  var overrideUrl = getParameterByName("url");

			  if (overrideUrl != undefined  && overrideUrl != null)
				  url = overrideUrl;

			  wsprofile = new WebSocket("ws://" + url + ":11420/ProfileStorage");
			  wsprofile.onerror = function (error) {
				  console.log(error);
			  }
		  
			  wsprofile.onmessage = function (evt) 
			  { 
				  
				  var received_msg = evt.data;
				  if (received_msg == "undefined"){
					  return;
				  }


				  var temp = received_msg.split("|");

				  console.log("Got Updated Overlay Profile for #" + temp[0])

				  if (temp[1] == "undefined")
				  	return;

				  if (profileId != temp[0])
					  return;

				  console.log("Profile ID matches, updating screen");

				  map = JSON.parse(atob(temp[1]));
				  loadDivs();
				  updatePlayerData();
			  }
			  wsprofile.onclose = function(){
				  // Try to reconnect in 5 seconds
				  setTimeout(function(){connectToProfile(callback)}, 5000);
			  };

			  wsprofile.onopen = callback;

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
		  send("json");
	  }
	  
	  function updatePlayerData(minData) {

		  if (minData != undefined && "var" in minData) {
			  if (minData.var == "SaveLoaded" || minData.var == "NewSave") {
				  send("json");
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
				  data[name] = value;
			  }
			  
		  }else{
			  if (minData != undefined){
				  data = minData;
			  }
		  }
		  
		  if (map == undefined || data == undefined)
			  return;

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
								
								  

								//Dealing with the new Levelup of the grimm charm, though generic enough to handle others if they did it.
								if ("charmLevelSprites" in item) {
									if (item.charmLevel in data && data[item.charmLevel]-1 <= item.charmLevelSprites.length){
										img.attr('src', "images/" + item.charmLevelSprites[data[item.charmLevel]-1]);
									}
								}
								//Deal with broken fragile items
								if ("brokenCheck" in item && item.brokenCheck in data) {
									if (data[item.brokenCheck]) {
										img.attr('src', "images/" + item.brokenSprite);
									}else{
										img.attr('src', "images/" + item.sprite);
									}
								}

								  // Dealing with upgrading the 3 fragile charms to unbreakable charms
								  if ("unbreakableSprite" in item){
										if (item.unbreakableCheck in data){
											if (data[item.unbreakableCheck])
												img.attr('src', "images/" + item.unbreakableSprite);
										}
								  }


							  }
							  break;
							  
						  case "spell":
							  setSelected(data[name] > 0, id);
							  if ("levelSprites" in item && data[name]-1 > 0 && data[name]-1 <= item.levelSprites.length){
								  img.attr("src", "images/" + item.levelSprites[data[name]-1]);
							  }
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

		  $.each(map.misc_containers, function(name, item) {
			  if (item.enabled || isEditing) {
				  var dataSource;
				  switch (item.dataSource) {
					  case "playerData":
						  dataSource = map;
						  break;
					  case "data":
							 dataSource = data;
							 break;
				  }
				  if (dataSource != undefined && item.dataElement in dataSource){
					  $('#' + name + ' > div.content').remove();
					  var div = $('<div></div>').addClass('content').html(item.text.format(dataSource[item.dataElement]));
					  $('#' + name).append(div);
				  }
			  }
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
	  }
	  
	  function updateVisible() {
		  $('.hideIfSet > div.itemDiv:not(:has(>.selected)):not(:has(>.multiple))').hide();
		  $('.container:not(.hideIfSet) div.itemDiv').css("display", "block");
		  $('.container.hideIfSet div.itemDiv:has(>.selected)').css("display", "block");
		  $('.container.hideIfSet div.itemDiv:has(>.multiple)').css("display", "block");
	  }
	  
	  function updateUrlConfig() {
		  console.log("Updating url string");
	  
		  urlParams["profile"] = profileId;
		  window.history.pushState(profileId, "", "Index.html?" + $.param(urlParams) );

		  if (map != undefined && wsprofile.readyState === wsprofile.OPEN)
		  	wsprofile.send("save|" + profileId + "|" + btoa(JSON.stringify(map, null, 2).replace("==", "%3D%3D")));
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