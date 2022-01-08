var map;
var ws;
var data;
var wsprofile;
var lastCommand;
var playerData;
var hasAppliedDS = false;
var hasAppliedUS = false;
var hasAppliedLS = false;
var hasAppliedRS = false;
var OBSProfile = 999;
var urlParams;
$(document).ready(function () {
    /*
      var map;	
      var playerData;
      var ws;	
      var lastCommand;
      */

    var currentId;
    
    var style;
    var usingOBS = false;



    (window.onpopstate = function () {
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
    })();

    String.prototype.format = function () {
        var str = this;
        for (var i = 0; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            str = str.replace(reg, arguments[i]);
        }
        return str;
    }

    var FirebaseApiKey = "AIzaSyBOA8aHWorp3n1Qg7TTYYgAxf5Nk8NxT_A"; // This will only work from kingkiller39.github.io
    var localKey = getParameterByName("apiKey");
    if (localKey != null)
        FirebaseApiKey = localKey;

    var profileId = getParameterByName("profile");

    var makeNew = getParameterByName("makeNew");

    var regexReplaceUrl = new RegExp(/^(file:\/\/.*index.html)/);




    var entities = getEntities();
    var urlConfig = getParameterByName("config");
    var width = 1920;
    var height = 1080;

    try { window.obsstudio.pluginVersion; usingOBS = true; }
    catch (e) { }
    if (usingOBS) {
        console.log("Using OBS: Connecting");
    }

    var temp = getParameterByName('width');
    if (temp != undefined && temp != null) {
        width = temp;
    }

    temp = getParameterByName('height');
    if (temp != undefined && temp != null) {
        height = temp;
    }

    var isEditing = getParameterByName('editing') == "true";

    $("html").css({
        'height': height + "px",
        'width': width + "px",
        'margin': "0px",
        'padding': "0px",
        'overflow': "hidden"
    });

    $('body').css({
        'width': "100%",
        'height': "100%",
        'margin': "0px",
        'padding': "0px"
    });

    if (isEditing) {
        $('body').css('background-color', '#000000');
    }

    console.log(profileId);

    if ((profileId != undefined && makeNew == null) || usingOBS) {
        if (isEditing) {
            init(function () {
                wsprofile.send("load|" + profileId);
                loadDivs();
            });
        } else if (usingOBS && jQuery.isEmptyObject(urlParams)) {
            connectToProfile(function () {
                wsprofile.send("OBSGetPreset")
            });
            connect();
        } else {
            connectToProfile(function () {
                wsprofile.send("load|" + profileId);
            });

            connect();
        }

    } else if (urlConfig == undefined || urlConfig == null || !usingOBS) {
        $('body').css('background-color', '#000000');
        $('#initialSettingsDialog').show().dialog({
            width: 500,
            title: "Initial Setup",
            buttons: {
                "Done": function (e) {

                    width = $('#setupPageWidth').val() - 4;
                    height = $('#setupPageHeight').val() - 4;

                    map = getDefault();
                    map.containers.charms.top = height - 310;
                    map.containers.charms.left = 0;
                    map.containers.spells.top = height - 50 - map.containers.skills.height;
                    map.containers.spells.left = width - map.containers.spells.width;
                    map.containers.skills.top = height - 50;
                    map.containers.skills.left = width - map.containers.skills.width;
                    map.containers.items.top = 0;
                    map.containers.items.left = width - map.containers.items.width;
                    map.containers.dreamers.top = 53;
                    map.containers.dreamers.left = width - map.containers.dreamers.width;
                    map.containers.misc.top = 53;
                    map.containers.misc.left = width - (map.containers.dreamers.width + map.containers.misc.width);
                    map.containers.disabled.top = 178;
                    map.containers.disabled.left = 508;
                    isEditing = true;
                    $('#pageWidth').val(width);
                    $('#pageHeight').val(height);

                    if (map.settings.borderColourEquip == null) {
                        map.settings.borderGlow = true;
                        map.settings.borderColourEquip = "#07ff6e";
                        map.settings.borderColourObtain = "#ffffff";
                        map.settings.borderColourGave = "#FF0000";
                    }
                    $('#borderGlowToggle').prop("checked", !map.settings.borderGlow);
                    $('#borderObtainC').val(map.settings.borderColourObtain);
                    $('#borderEquipC').val(map.settings.borderColourEquip);
                    $('#borderGaveC').val(map.settings.borderColourGave);
                    $('html').css({ 'width': width + 'px', 'height': height + 'px' });
                    urlParams.editing = "true";
                    if (profileId == undefined)
                        profileId = 1;

                    init(function () {
                        if (map.settings.borderColourEquip == null) {
                            map.settings.borderGlow = false;
                            map.settings.borderColourEquip = "#07ff6e";
                            map.settings.borderColourObtain = "#ffffff";
                            map.settings.borderColourGave = "#FF0000";
                        }

                        $('#borderGlowToggle').prop("checked", !map.settings.borderGlow);
                        $('#borderObtainC').val(map.settings.borderColourObtain);
                        $('#borderEquipC').val(map.settings.borderColourEquip);
                        $('#borderGaveC').val(map.settings.borderColourGave);
                        updateUrlConfig();
                    });

                    $(this).remove();
                }
            }
        });
    } else {
        try {
            $('#importDialog').show().dialog({
                width: 500,
                title: "Import Settings",
                buttons: {
                    "Done": function () {
                        map = JSON.parse(LZString.decompressFromEncodedURIComponent(urlConfig));
                        profileId = $('#importProfileSelect').val();
                        delete urlParams["config"];
                        init(function () {
                            updateUrlConfig();
                        });

                        $(this).dialog("close").remove();

                    }
                }
            });
        } catch (e) {
            alert("failed to load config");
            console.log(e);
            map = getDefault();
            init();
        }
    }

    function init(callback) {

        if (isEditing) {

            $('#profiles div').css("color", "#FFFFFF");
            $('#profile' + profileId).css("color", "#00FF00");
            $('#containerSettingDialog').show().dialog({
                width: 500,
                title: "Settings"
            });

            $('#miscSettingsDialog').show().dialog({
                width: 500,
                title: "Settings"
            }).dialog("close");

            $('#pageSettingsDialog').show().dialog({
                width: 500,
                title: "Page Settings"
            }).dialog("close");

            $('#pageWidth').val(width);
            $('#pageHeight').val(height);
            $(document.body).css({ "background-color": '#000000', "border": "2px solid #00FF00" });

            $('#containerSettingDialog').dialog("close");
            $(document.body).contextMenu({
                selector: '.container:not([id=disabled])',
                callback: function (key, options) {
                    loadSettings(options.$trigger[0].id);
                    $('#miscSettingsDialoge').dialog('close');
                    $('#containerSettingDialog').dialog("open");
                },
                items: {
                    "settings": { name: "settings", icon: "settings" }
                }
            });

            $(document.body).contextMenu({
                selector: '.misc-container',
                callback: function (key, options) {
                    loadMiscSettings(options.$trigger[0].id);
                    $('#containerSettingDialog').dialog("close");
                    $('#miscSettingsDialog').dialog("open");
                },
                items: {
                    "settings": { name: "settings", icon: "settings" }
                }
            });

            $('#previewModeButton').on("click", function (e) {
                $('.container, .misc-container').toggleClass('editingDiv');
                if ($('.editingDiv').length > 0) {
                    $('.pageButton').show();
                    $(e.target).html("PREVIEW MODE");
                    $(document.body).css('background-image', 'unset');
                    $('.disabled').show();
                } else {
                    $('.pageButton').hide();
                    $(e.target).show();
                    $(e.target).html("EDIT MODE");
                    $(document.body).css({
                        'background-image': 'url("sampleempty.png")',
                        'background-repeat': 'no-repeat',
                        'background-size': urlParams.width + 'px ' + urlParams.height + 'px'
                    });
                    $('.disabled').hide();
                }
            });

            $('#pageSettingsButton').on("click", function (e) {
                $('#pageSettingsDialog').dialog().show();
            });

            $('#toggleSnapButton').on("click", function (e) {
                var isSnap = !$('.container').draggable("option", "snap");

                $('.container, .misc-container').each(function (i, e) {
                    $(e).draggable("option", "snap", isSnap);
                    $(e).draggable("option", "grid", isSnap ? [20, 20] : null);
                });
                $(e.target).css('color', (isSnap ? '#00FF00' : '#FFFFFF'));
            });

            $('#getTinyUrl').on('click', function (e) {
                $('#tinyUrlDiv').show().dialog({
                    width: 500,
                    title: "Export Config"
                });
                var overrideUrl = getParameterByName("url");

                $('#urlText').val(window.location.href.replace(/\?.*/, "") + "?profile=" + profileId + (overrideUrl != undefined ? "&url=" + overrideUrl : ""));
                var config = LZString.compressToEncodedURIComponent(JSON.stringify(map));

                toTiny("https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/index.html?config=" + config, FirebaseApiKey, function (value) {
                    $('#tinyUrlText').val(value);
                })

            });

            $('#pageButtons').show();

            $('#copyUrl').on('click', function () {
                $('#urlText').select();
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';

                } catch (err) {
                    console.log('Oops, unable to copy');
                }
            });

            $('#copyTinyUrl').on('click', function () {
                $('#tinyUrlText').select();
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';

                } catch (err) {
                    console.log('Oops, unable to copy');
                }
            })

            $('#scale').on('change', function () {
                map.containers[currentId].scale = $('#scale').val();
                $('#' + currentId + ' .itemDiv img').each(function (i, e) {
                    var scale = $('#scale').val();
                    $(e).css("width", (1 + (156 * (scale / 100))) + "px");
                    $(e).css("height", (1 + (156 * (scale / 100))) + "px");
                    $(e).parent().css("width", (1 + (156 * (scale / 100))) + "px");
                    $(e).parent().css("height", (1 + (156 * (scale / 100))) + "px");
                });
                updateUrlConfig();
            });

            $('#hideWhenMissing').on('change', function () {
                map.containers[currentId].hideWhenMissing = $('#hideWhenMissing').prop("checked");

                if (map.containers[currentId].hideWhenMissing)
                    $('#' + currentId).addClass('hideIfSet')
                else
                    $('#' + currentId).removeClass('hideIfSet')


                updateUrlConfig();
                updateVisible();
            });

            $('#flourish').on('change', function () {
                map.containers[currentId].flourish = $('#flourish').val();

                if ($('#flourish').val() == "none") {
                    if ($('#' + currentId + ' .flourish').length > 0)
                        $('#' + currentId + ' .flourish').remove();
                } else {
                    addFlourish(currentId, map.containers[currentId].flourish);
                }
                updateUrlConfig();
            });

            $('#growDirection').on('change', function () {
                map.containers[currentId].growDirection = $('#growDirection').val();
                if ($('#' + currentId).hasClass('itemDivGrowLeft'))
                    $('#' + currentId).removeClass('itemDivGrowLeft');

                if ($('#' + currentId).hasClass('itemDivGrowRight'))
                    $('#' + currentId).removeClass('itemDivGrowRight');

                $('#' + currentId).addClass('itemDivGrow' + map.containers[currentId].growDirection);

                updateUrlConfig();
            });
            $('#borderObtainC').on('change', function () {
                var value = $('#borderObtainC').val();
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    map.settings.borderColourObtain = value;
                    updateUrlConfig();
                }
            });
            $('#borderGaveC').on('change', function () {
                var value = $('#borderGaveC').val();
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    map.settings.borderColourGave = value;
                    updateUrlConfig();
                }
            });
            $('#borderEquipC').on('change', function () {
                var value = $('#borderEquipC').val();
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    map.settings.borderColourEquip = value;
                    updateUrlConfig();
                }
            });
            $('#borderGlowToggle').on('change', function () {
                if (document.getElementById("pagestyle").href == "https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Classic.css") {
                    $(this).prop("checked", true);
                }
                if ($(this).is(':checked')) {
                    map.settings.borderGlow = true;
                } else {
                    map.settings.borderGlow = false;
                }
                updateUrlConfig();
            });


            $('#pageWidth').on('change', function () {
                var value = $('#pageWidth').val();

                if (isNumber(value)) {
                    $('html').css("width", value + "px");
                    urlParams.width = value;
                    updateUrlConfig();
                }
            });
            $('#pageHeight').on('change', function () {
                var value = $('#pageHeight').val();

                if (isNumber(value)) {
                    $('html').css("height", value + "px");
                    urlParams.height = value;
                    updateUrlConfig();
                }
            });

            $('#miscFontSize').on('change', function () {
                var value = $('#miscFontSize').val();
                map.misc_containers[currentId].fontSize = value;

                if (isNumber(value)) {
                    $('#' + currentId).css("font-size", value + "px");
                    updateUrlConfig();
                }
            });

            $('#miscFontColor').on('change', function () {
                var value = $('#miscFontColor').val();
                map.misc_containers[currentId].color = value;

                $('#' + currentId).css("color", value);
                updateUrlConfig();
            });

            $('#miscEnabled').on('change', function () {
                map.misc_containers[currentId].enabled = $('#miscEnabled').prop("checked");

                if (map.misc_containers[currentId].enabled)
                    $('#' + currentId).removeClass('disabled');
                else
                    $('#' + currentId).addClass('disabled');

                updateUrlConfig();
            });

            $('#profiles div').on('click', function (e) {
                var id = $(e.target).attr('id');
                console.log(id);
                if (id != "profile" + profileId) {
                    profileId = id.replace("profile", "");
                    console.log(profileId);
                    $('#profiles div').css("color", "#FFFFFF");
                    $(e.target).css("color", "#00FF00");
                    wsprofile.send("load|" + profileId);
                }
            });

            $('#Style div').on('click', function (e) {
                style = $(e.target).attr('id');
                console.log(style);
                $('#Style div').css("color", "#FFFFFF");
                $(e.target).css("color", "#00FF00");
                map.settings["Style"] = style;
                document.getElementById("pagestyle").setAttribute("href", style + ".css");
                data = [];
                getPlayerData();
                updateUrlConfig();
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
        if (map.settings["Style"] != undefined) {
            document.getElementById("pagestyle").setAttribute("href", map.settings["Style"] + ".css");
            $('#' + map.settings["Style"]).css("color", "#00FF00");
        }
        else {
            document.getElementById("pagestyle").setAttribute("href", "Classic.css");
            $('#Classic').css("color", "#00FF00");
        }
        $.each(map.containers, function (i, container) {
            if (!isEditing && i == "disabled")
                return;

            var div = $('<div></div>').attr({
                'id': i,
                'class': 'container'
            })
                .css({
                    'top': container.top,
                    'left': container.left,
                    'position': 'absolute',
                    'width': container.width,
                    'height': container.height
                });

            if (!("growDirection" in container)) {
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

            $.each(container.items, function (i2, name) {
                var item = entities[name];

                if (item == undefined) {
                    container.items.splice(i2, 1);
                    return;
                }

                if (isEditing) {
                    seenItems[name] = true;
                }

                if (!item.enabled)
                    return;

                addItem(container, item, name, div);

            });

            $('body').append(div);

            if ("flourish" in container && container.flourish != "none") {
                addFlourish(i, container.flourish);
            }

        });

        if (!("misc_containers" in map))
            map.misc_containers = getDefault().misc_containers;



        $.each(map.misc_containers, function (i, e) {
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
            $.each(entities, function (name, entity) {
                if (!(name in seenItems) && entity.enabled) {
                    addItem(map.containers.disabled, entity, name, $('#disabled'));
                }
            });
        }
    }


    function makeDivMovable(div, container) {

        div.resizable({
            handles: "n,e,s,w",
            minWidth: 10,
            minHeight: 10,
            containment: $(document.body),
            stop: function (event, ui) {
                var id = $(ui.helper).attr('id');
                if ($(ui.helper).hasClass('container')) {
                    map.containers[id].width = ui.size.width;
                    map.containers[id].height = ui.size.height;
                } else if ($(ui.helper).hasClass('misc-container')) {
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
                grid: [20, 20],
                snap: "body, .container, .misc-container",
                stop: function (event, ui) {
                    var id = $(ui.helper).attr('id');
                    if ($(ui.helper).hasClass('container')) {
                        map.containers[id].left = ui.position.left;
                        map.containers[id].top = ui.position.top;
                    } else if ($(ui.helper).hasClass('misc-container')) {
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
        var img = $('<img></img>').attr({ 'id': name });
        var itemdivscale = parseFloat(container.scale);
        var itemdivscale = itemdivscale + 10;
        var itemdivscale = itemdivscale + "";
        img.css("width", container.scale + "px");
        img.css("height", container.scale + "px");
        itemDiv.css("width", itemdivscale + "px");
        itemDiv.css("height", itemdivscale + "px");
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
                if (item.name == "dash") {
                    img.attr('src', "images/" + item.levelSprites[0]);
                    break;
                }
                else { img.attr('src', "images/" + item.sprite) };
                break;

            case "item":
                img.attr('src', "images/" + item.sprite);
                if ("multiple" in item && item.multiple) {
                    var countDiv = $('<div></div>').attr({ 'id': name + '_count' });
                    countDiv.addClass('counter');
                    itemDiv.append(countDiv);
                }
                break;

            case "generic":
                if (item.name == "Dream Nail") {
                    img.attr('src', "images/" + item.levelSprites[0]);
                    break;
                }
                img.attr('src', "images/" + item.sprite);
                break;
            case "charmNotch":
                img.attr('src', "images/" + item.sprite);
                var countDiv = $('<div></div>').attr({ 'id': name + '_Filledcount' });
                countDiv.addClass('charmSlotsFilled').css("display", "block");
                itemDiv.append(countDiv);
                countDiv = $('<div></div>').attr({ 'id': name + '_count' });
                countDiv.addClass('counter').css("display", "block");
                itemDiv.append(countDiv);
                break;
            default:
                break;
        }

        div.append(itemDiv);

    }

    function addFlourish(id, flourish) {
        if ($('#' + id + ' .flourish').length > 0)
            $('#' + id + ' .flourish').remove();

        var flourish = $("<div></div>").addClass("flourish").addClass(flourish + "Flourish").append($('<img src="images/profile_fleur0012.png">'));
        flourish.width($('#' + id).width() - 174 + 51);
        if (flourish.hasClass("topRightFlourish")) {
            flourish.find('img').css("left", flourish.width() + "px");
        }

        $('#' + id).on("resize", function (e) {
            var flourishDiv = $(e.target).find(".flourish");
            flourishDiv.css("width", $('#' + id).width() - 174 + 51);
            if (flourishDiv.hasClass("topRightFlourish")) {

                flourishDiv.find('img').css("left", flourishDiv.width() + "px");
            }


        });

        $('#' + id).append(flourish);
    }

    function loadSettings(id) {
        currentId = id;
        var container = map.containers[id];
        $('#conatinerSettingName').text(currentId || "unknown")
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
        $('#miscSettingName').text(currentId || "unknown")
        if ("color" in container)
            $('#miscFontColor').val(container.color);

        if ("enabled" in container)
            $('#miscEnabled').prop("checked", container.enabled);

        if ("fontSize" in container)
            $('#miscFontSize').val(container.fontSize);


    }

    function updateContainerItemOrder(event, ui) {
        $.each(map.containers, function (i, container) {
            container.items = $.map($('#' + i).find('img'), function (e, i) { return $(e).attr('id'); });

            $.each(container.items, function (i2, name) {
                var item = entities[name];

                if (!item.enabled)
                    return;

                $('#' + name).css("zoom", container.scale + "%");

                if (i2 % container.itemsPerRow == 0)
                    $('#' + name).parent().css({ "clear": "both" });
                else
                    $('#' + name).parent().css({ "clear": "none" });
            });
        })
        updateUrlConfig();
    }


    function connect() {
        console.log("Connecting");
        try {
            var url = "localhost";
            var overrideUrl = getParameterByName("url");

            if (overrideUrl != undefined && overrideUrl != null)
                url = overrideUrl;

            ws = new WebSocket("ws://" + url + ":11420/playerData");
            ws.onerror = function (error) {
                console.log(error);
            }
            ws.onopen = function () {
                $('#connectionStatus').html("Connected").css("color", "#00FF00");
                $('.container, .misc-container').show();
                getPlayerData();
            }

            ws.onmessage = function (evt) {
                var received_msg = evt.data;
                if (received_msg == "undefined") {
                    updatePlayerData({});
                    return;
                }

                var json = JSON.parse(received_msg);

                updatePlayerData(json);
            }
            ws.onclose = function () {
                $('#connectionStatus').html("Not Connected").css("color", "#FF0000");
                $('.container, .misc-container').hide();
                // Try to reconnect in 5 seconds
                setTimeout(function () { connect() }, 5000);
            };



        } catch (e) {
            console.log(e);
        }

    }

    function connectToProfile(callback) {
        console.log("Connecting to ProfileStorage");
        try {
            var url = "localhost";
            var overrideUrl = getParameterByName("url");

            if (overrideUrl != undefined && overrideUrl != null)
                url = overrideUrl;

            wsprofile = new WebSocket("ws://" + url + ":11420/ProfileStorage");
            wsprofile.onerror = function (error) {
                console.log(error);
            }

            wsprofile.onmessage = function (evt) {

                var received_msg = evt.data;
                if (received_msg == "undefined") {
                    return;
                }


                var temp = received_msg.split("|");

                console.log("Got Updated Overlay Profile for #" + temp[0])

                if (temp[1] == "undefined")
                    return;

                if (profileId != temp[0] && OBSProfile != temp[0]) {
                    if (temp[0] == "Style") {
                        map.settings["Style"] = temp[1];
                        style = temp[1];
                        $('#Style div').css("color", "#FFFFFF");
                        $('#' + temp[1]).css("color", "#00FF00");
                        document.getElementById("pagestyle").setAttribute("href", style + ".css");
                        data = [];
                        getPlayerData();
                        return;
                    } else if (temp[0] == "BorderGlow") {
                        if (temp[1] == "On") {
                            map.settings.borderGlow = true;
                        } else {
                            map.settings.borderGlow = false;
                        }
                        loadDivs();
                        updatePlayerData();
                        return;
                    } else if (temp[0] == "Preset" && jQuery.isEmptyObject(urlParams)) {
                        if (temp[1].startsWith("PlayerCustom")) {
                            OBSProfile = temp[1].charAt(temp[1].length - 1);
                            wsprofile.send("load|" + OBSProfile);
                            return;
                        } else if (temp[0] == "Preset" && temp[1] == "Everything") {
                            getPreset("./Presets/ProfileEverything.json")
                            loadDivs();
                            updatePlayerData();
                            if (usingOBS && jQuery.isEmptyObject(urlParams)) {
                                wsprofile.send("OBSGetStyle");
                                wsprofile.send("OBSGetGlow");
                            }
                            return;
                        } else if (temp[0] == "Preset" && temp[1] == "Minimal_Left") {
                            getPreset("./Presets/ProfileMinLeft.json")
                            loadDivs();
                            updatePlayerData();
                            if (usingOBS && jQuery.isEmptyObject(urlParams)) {
                                wsprofile.send("OBSGetStyle");
                                wsprofile.send("OBSGetGlow");
                            }
                            return;
                        } else if (temp[0] == "Preset" && temp[1] == "Minimal_Right") {
                            getPreset("./Presets/ProfileMinRight.json")
                            loadDivs();
                            updatePlayerData();
                            if (usingOBS && jQuery.isEmptyObject(urlParams)) {
                                wsprofile.send("OBSGetStyle");
                                wsprofile.send("OBSGetGlow");
                            }
                            return;
                        } else if (temp[0] == "Preset" && temp[1] == "Rando_Racing") {
                            getPreset("./Presets/ProfileRandoRacing.json")
                            loadDivs();
                            updatePlayerData();
                            if (usingOBS && jQuery.isEmptyObject(urlParams)) {
                                wsprofile.send("OBSGetStyle");
                                wsprofile.send("OBSGetGlow");
                            }
                            return;
                        }else return;
                    } else return;
                } else if (profileId == temp[0] || OBSProfile == temp[0]) {
                    console.log("Profile ID matches, updating screen");
                    map = JSON.parse(atob(temp[1]));
                    loadDivs();
                    updatePlayerData();
                    if (usingOBS && jQuery.isEmptyObject(urlParams)) {
                        wsprofile.send("OBSGetStyle");
                        wsprofile.send("OBSGetGlow");
                    }
                }

            }
            wsprofile.onclose = function () {
                // Try to reconnect in 5 seconds
                setTimeout(function () { connectToProfile(callback) }, 5000);
            };

            wsprofile.onopen = callback;
            
        } catch (e) {
            console.log(e);
        }

    }

    function getPreset(filepath) {
        $.ajax({
            type: 'GET',
            url: filepath,
            dataType: 'json',
            success: function (data) { map = data },
            async: false
        });
    }

    function send(command) {
        lastCommand = command;
        if (ws.readyState == 1) {
            ws.send(command);
        }
    }



    function getPlayerData() {
        console.log("Refreshing data");
        $(".selected").removeClass("selected");
        $(".equipped").removeClass("equipped");
        $(".multiple").removeClass("multiple");
        $(".gaveItem").removeClass("gaveItem");
        $(".itemDiv > img").css("filter", "");
        $(".itemDiv > .multiple").css("filter", "");
        $(".selected").css("filter", "");
        $(".selected").css("filter", "");
        $(".gaveItem").css("filter", "");
        $(".LeftItem").removeClass("LeftItem");
        $(".RightItem").removeClass("RightItem");
        $(".charmDiv > .selected").css("filter", "");
        $(".charmDiv > .equipped").css("");
        data["nail"] = false;
        data["FullNail"] = false;
        data["canDownslash"] = false;
        data["canSideslashLeft"] = false;
        data["canSideslashRight"] = false;
        data["canUpslash"] = false;
        data["swim"] = false;
        data["elevatorPass"] = false;
        data["DuplicateDreamer"] = false;
        data["canFocus"] = false;
        data["version"] = "1";
        data["canDashRight"] = false;
        data["canDashLeft"] = false;
        data["hasSuperdashRight"] = false;
        data["hasSuperdashLeft"] = false;
        data["hasWalljumpRight"] = false;
        data["hasWalljumpLeft"] = false;
        hasAppliedDS = false;
        hasAppliedUS = false;
        hasAppliedLS = false;
        hasAppliedRS = false;
        send("json");
    }

    function updatePlayerData(minData) {

        if (minData != undefined && "var" in minData) {
            if (minData.var == "SaveLoaded" || minData.var == "NewSave") {
                console.log("Save Loaded");
                data = [];
                getPlayerData();
                return;
            } else {
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

        } else {
            if (minData != undefined) {
                data = minData;
                if (data["nail"] == undefined) { data["nail"] = false; }
                if (data["FullNail"] == undefined) { data["FullNail"] = false; }
                if (data["canDownslash"] == undefined) { data["canDownslash"] = false; }
                if (data["canSideslashLeft"] == undefined) { data["canSideslashLeft"] = false; }
                if (data["canSideslashRight"] == undefined) { data["canSideslashRight"] = false; }
                if (data["canUpslash"] == undefined) { data["canUpslash"] = false; }
                if (data["swim"] == undefined) { data["swim"] = false; }
                if (data["elevatorPass"] == undefined) { data["elevatorPass"] = false; }
                if (data["DuplicateDreamer"] == undefined) { data["DuplicateDreamer"] = false; }
                if (data["canFocus"] == undefined) { data["canFocus"] = false; }
                if (data["version"] == undefined) { data["version"] = "1"; }
                if (data["canDashRight"] == undefined) { data["canDashRight"] = false; }
                if (data["canDashLeft"] == undefined) { data["canDashLeft"] = false; }
                if (data["hasSuperdashRight"] == undefined) { data["hasSuperdashRight"] = false; }
                if (data["hasSuperdashLeft"] == undefined) { data["hasSuperdashLeft"] = false; }
                if (data["hasWalljumpRight"] == undefined) { data["hasWalljumpRight"] = false; }
                if (data["hasWalljumpLeft"] == undefined) { data["hasWalljumpLeft"] = false; }

            }
        }

        if (map == undefined || data == undefined)
            return;

        $.each(map.containers, function (i, container) {
            $.each(container.items, function (i2, name) {
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

                                if (data.royalCharmState == 1) { $(id).attr('src', "images/Charm_KingSoul_Left.png"); }
                                else if (data.royalCharmState == 2) { $(id).attr('src', "images/Charm_KingSoul_Right.png"); }
                                else if (data.royalCharmState == 3) { $(id).attr('src', "images/Kingsoul.png"); }
                                else if (data.royalCharmState == 4) { $(id).attr('src', "images/charmSprite35.png") }
                                if (!$(id).hasClass('selected'))
                                    $(id).hide();
                                else
                                    $(id).show();
                                if (data[name.replace('got', 'equipped')] && !img.hasClass('equipped')) {
                                    img.addClass('equipped');
                                    img.parent().addClass('jello-horizontal')
                                } else if (!data[name.replace('got', 'equipped')] && img.hasClass('equipped')) {
                                    img.removeClass('equipped');
                                    img.parent().removeClass('jello-horizontal')
                                }
                            } else {
                                setSelected(data[name], id);
                                if (!$(id).hasClass('selected'))
                                    $(id).hide();
                                else
                                    $(id).show();

                                if (data[name.replace('got', 'equipped')] && !img.hasClass('equipped')) {
                                    img.addClass('equipped');
                                    img.parent().addClass('jello-horizontal');
                                } else if (!data[name.replace('got', 'equipped')] && img.hasClass('equipped')) {
                                    img.removeClass('equipped');
                                    img.parent().removeClass('jello-horizontal');
                                }



                                //Dealing with the new Levelup of the grimm charm, though generic enough to handle others if they did it.
                                if ("charmLevelSprites" in item) {
                                    if (item.charmLevel in data && data[item.charmLevel] - 1 <= item.charmLevelSprites.length) {
                                        img.attr('src', "images/" + item.charmLevelSprites[data[item.charmLevel] - 1]);
                                    }
                                }
                                //Deal with broken fragile items
                                if ("brokenCheck" in item && item.brokenCheck in data) {
                                    if (data[item.brokenCheck]) {
                                        img.attr('src', "images/" + item.brokenSprite);
                                    } else {
                                        img.attr('src', "images/" + item.sprite);
                                    }
                                }

                                // Dealing with upgrading the 3 fragile charms to unbreakable charms
                                if ("unbreakableSprite" in item) {
                                    if (item.unbreakableCheck in data) {
                                        if (data[item.unbreakableCheck])
                                            img.attr('src', "images/" + item.unbreakableSprite);
                                    }
                                }


                            }
                            break;

                        case "spell":
                            setSelected(data[name] > 0, id);
                            if ("levelSprites" in item && data[name] - 1 > 0 && data[name] - 1 <= item.levelSprites.length) {
                                img.attr("src", "images/" + item.levelSprites[data[name] - 1]);
                            }
                            else if ("levelSprites" in item && (data[name] == 1 || data[name] == 0)) {
                                img.attr("src", "images/" + item.levelSprites[0]);
                            }
                            break;

                        case "skill":
                            if (data["version"].startsWith("1.4")) {
                                doSkillv14(name, id, item);
                            } else if (data["version"].startsWith("1.5")) {
                                doSkillsv15(name, id, item);
                            }
                            break;

                        case "item":
                            if (name == "nail" && data["version"].startsWith("1.4")) {
                                handleCursedNailv14();
                            } else if (name == "nail" && data["version"].startsWith("1.5")) {
                                handleCursedNailv15(name, id);
                            }
                            if (name == "elevatorPass" && data["hasElevatorPass"]) {
                                data[name] = true;
                                setSelected(data[name], id);
                            }

                            if (name == "nailSmithUpgrades") {
                                if (data["nailSmithUpgrades"] > 0) {
                                    $("#nail" + '_count').html(data["nailSmithUpgrades"]).show();
                                }
                                else {
                                    $("#nail" + '_count').hide();
                                }
                            }
                            else if (!("multiple" in item))
                                if ("useItemState" in item && item.useItemState in data && data[item.useItemState]) {
                                    setSelected(true, id);
                                    $(id).addClass("gaveItem");
                                } else {
                                    setSelected(data[name], id);
                                }
                            else if (name !== "nail"){
                                setMultipleSelected(data[name] > 0, id);
                                if (data[name] > 0) {
                                    $(id + '_count').html(data[name]).show();
                                } else {
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
                            if (name == "DuplicateDreamer") {
                                var n = ((data["maskBrokenHegemol"] == true) ? 1 : 0) + ((data["maskBrokenMonomon"] == true) ? 1 : 0) + ((data["maskBrokenLurien"] == true) ? 1 : 0);
                                if (n < data["guardiansDefeated"]) {
                                    data[name] = true;
                                }
                            }
                            setSelected(data[name], id);
                            if ("levelSprites" in item && data["hasDreamNail"] && !data["dreamNailUpgraded"]) {
                                img.attr("src", "images/" + entities["hasDreamNail"].levelSprites[0]);
                            }
                            else if ("levelSprites" in item && data["hasDreamNail"] && data["dreamNailUpgraded"]) {
                                img.attr("src", "images/" + entities["hasDreamNail"].levelSprites[1]);
                            }

                            break;
                    }
                }
            });
        });

        $.each(map.misc_containers, function (name, item) {
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
                if (dataSource != undefined && item.dataElement in dataSource) {
                    $('#' + name + ' > div.content').remove();
                    var div = $('<div></div>').addClass('content').html(item.text.format(dataSource[item.dataElement]));
                    $('#' + name).append(div);
                }
            }
        });

        updateVisible();
    }
    function handleCursedNailv14() {
        if (document.getElementById("pagestyle").href == "https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Modern.css") {
            document.getElementById("nail").style.filter = "grayscale(0%)";
        }

        if (data["FullNail"]) {
            $("#nail").addClass('multiple').parent().removeClass('hideIfSet');
        } else {
            if (data["Downslash"] && !hasAppliedDS) {
                hasAppliedDS = true;
                if (!hasAppliedUS && !hasAppliedLS && !hasAppliedRS) {
                    document.getElementById("nail").style.boxShadow = "0px 5px 0px -3px #07ff6e";
                }
                else {
                    document.getElementById("nail").style.boxShadow += ", 0px 5px 0px -3px #07ff6e";
                }

                hasAppliedDS = true;
            }
            if (data["Upslash"] && !hasAppliedUS) {
                hasAppliedUS = true;
                if (!hasAppliedDS && !hasAppliedLS && !hasAppliedRS) {
                    document.getElementById("nail").style.boxShadow = "0px -5px 0px -3px #07ff6e";
                }
                else {
                    document.getElementById("nail").style.boxShadow += ", 0px -5px 0px -3px #07ff6e";
                }
                hasAppliedUS = true;
            }
            if (data["Leftslash"] && !hasAppliedLS) {
                hasAppliedLS = true;
                if (!hasAppliedDS && !hasAppliedUS && !hasAppliedRS) {
                    document.getElementById("nail").style.boxShadow = "-5px 0px 0px -3px #07ff6e";
                }
                else {
                    document.getElementById("nail").style.boxShadow += ", -5px 0px 0px -3px #07ff6e";
                }
                hasAppliedLS = true;
            }
            if (data["Rightslash"] && !hasAppliedRS) {
                hasAppliedRS = true;
                if (!hasAppliedDS && !hasAppliedUS && !hasAppliedLS) {
                    document.getElementById("nail").style.boxShadow = "5px 0px 0px -3px #07ff6e";
                }
                else {
                    document.getElementById("nail").style.boxShadow += ", 5px 0px 0px -3px #07ff6e";
                }
                hasAppliedRS = true;
            }
        }
        if (data["nailSmithUpgrades"] > 0) {
            $("#nail" + '_count').html(data["nailSmithUpgrades"]).show();
        }
        else {
            $("#nail" + '_count').hide();
        }
    }

    function handleCursedNailv15(name, id) {
        if (document.getElementById("pagestyle").href == "https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Modern.css") {
            document.getElementById("nail").style.filter = "grayscale(0%)";
        }
        if (data["FullNail"] || (data["canDownslash"] && data["canSideslashLeft"] && data["canSideslashRight"] && data["canUpslash"])) { //All slashes
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass('multiple').parent().removeClass('hideIfSet');
        } else if (data["canDownslash"] && !data["canSideslashLeft"] && !data["canSideslashRight"] && !data["canUpslash"]) { //down slash
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDown");
        } else if (data["canDownslash"] && data["canSideslashLeft"] && !data["canSideslashRight"] && !data["canUpslash"]) { // down left slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDownLeft");
        } else if (data["canDownslash"] && !data["canSideslashLeft"] && data["canSideslashRight"] && !data["canUpslash"]) { //down right slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDownRight");
        } else if (data["canDownslash"] && !data["canSideslashLeft"] && !data["canSideslashRight"] && data["canUpslash"]) { //down up slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDownUp");
        } else if (data["canDownslash"] && data["canSideslashLeft"] && data["canSideslashRight"] && !data["canUpslash"]) { //down left right slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDownLeftRight");
        } else if (data["canDownslash"] && data["canSideslashLeft"] && !data["canSideslashRight"] && data["canUpslash"]) { //down left up slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftRight");
            $(id).removeClass("NailDownUpRight");
            $(id).addClass("NailDownLeftUP");
        } else if (data["canDownslash"] && !data["canSideslashLeft"] && data["canSideslashRight"] && data["canUpslash"]) { //down Right Up slash
            $(id).removeClass("NailDown");
            $(id).removeClass("NailDownLeft");
            $(id).removeClass("NailDownUp");
            $(id).removeClass("NailDownRight");
            $(id).removeClass("NailDownLeftUP");
            $(id).removeClass("NailDownLeftRight");
            $(id).addClass("NailDownUpRight");
        }
    }
    function doSkillv14(name, id, item) {
        if (name == "hasDash" && !data["canDashLeft"] && !data["canDashRight"]) { //no split dash
            setSelected(data[name], id);
            return;
        }
        else if (name == "hasDash" && data["canDashLeft"] && !data["canDashRight"]) { //can dash left
            if (BorderGlowModern()) {
                $(id).css("drop-shadow(-4px 0px 0px black) drop-shadow(rgb(7, 100, 50) -4px 0px 3px)")
            } else {
                $(id).removeClass("container");
                $(id).addClass("LeftItem");
            }
            return;
        }
        else if (name == "hasDash" && !data["canDashLeft"] && data["canDashRight"]) { //can dash right
            if (BorderGlowModern()) {
                $(id).css('filter', "drop-shadow(3px 0px 0px black) drop-shadow(rgb(7, 100, 50) 3px 0px 3px");

            } else {
                $(id).removeClass("container");
                $(id).addClass("RightItem");
            }
            return;
        }
        else if (name == "hasDash" && data["canDashLeft"] && data["canDashRight"]) { //can dash left and right
            if (BorderGlowModern()) {
                $(id).css("filter", "");
            } else {
                $(id).removeClass("LeftItem");
                $(id).removeClass("RightItem");
                $(id).addClass("container");
            }
            setSelected(data[name], id);
            return;
        }

        if (name == "hasWalljump" && !data["hasWalljumpLeft"] && !data["hasWalljumpRight"]) {
            setSelected(data[name], id);
            return;
        }
        else if (name == "hasWalljump" && data["hasWalljumpLeft"] && !data["hasWalljumpRight"]) {
            if (BorderGlowModern()) {
                console.log("applying left claw");
                $(id).css("filter", "drop-shadow(7px 0px 0px black) drop-shadow(rgb(7, 100, 50) -6px 0px 1px)");
            } else {
                $(id).removeClass("container");
                $(id).addClass("LeftItem");
            }
            return;
        }
        else if (name == "hasWalljump" && !data["hasWalljumpLeft"] && data["hasWalljumpRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "drop-shadow(-8px 2px 0px black) drop-shadow(rgb(7, 100, 50) 6px 0px 1px)");
            } else {
                $(id).removeClass("container");
                $(id).addClass("RightItem");
            }
            return;
        }
        else if (name == "hasWalljump" && data["hasWalljumpLeft"] && data["hasWalljumpRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "");
            } else {
                $(id).removeClass("LeftItem");
                $(id).removeClass("RightItem");
                $(id).addClass("container");
            }
            setSelected(data[name], id);
            return;
        }

        setSelected(data[name], id);
        if ("levelSprites" in item && data["hasDash"] && !data["hasShadowDash"]) {
            img.attr("src", "images/" + entities["hasDash"].levelSprites[0]);
        }
        else if ("levelSprites" in item && data["hasDash"] && data["hasShadowDash"]) {
            img.attr("src", "images/" + entities["hasDash"].levelSprites[1]);
        }
        return;

    }
    function doSkillsv15(name, id, item) {
        if (name == "hasDash" && data[name]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "");
            } else {
                $(id).removeClass("LeftItem");
                $(id).removeClass("RightItem");
                $(id).addClass("container");
            }
            setSelected(data[name], id);
            return;
        } else if (name == "hasDash" && data["canDashLeft"] && !data["canDashRight"]) {
            if (BorderGlowModern()) {
                $(id).css("drop-shadow(-4px 0px 0px black) drop-shadow(rgb(7, 100, 50) -4px 0px 3px)")
            } else {
                $(id).removeClass("container");
                $(id).addClass("LeftItem");
            }
            return;
        } else if (name == "hasDash" && !data["canDashLeft"] && data["canDashRight"]) {
            if (BorderGlowModern()) {
                $(id).css('filter', "drop-shadow(3px 0px 0px black) drop-shadow(rgb(7, 100, 50) 3px 0px 3px");

            } else {
                $(id).removeClass("container");
                $(id).addClass("RightItem");
            }
            return;
        }

        if (name == "hasWalljump" && data[name]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "");
            } else {
                $(id).removeClass("LeftItem");
                $(id).removeClass("RightItem");
                $(id).addClass("container");
            }
            setSelected(data[name], id);
            return;
        } else if (name == "hasWalljump" && data["hasWalljumpLeft"] && !data["hasWalljumpRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "drop-shadow(7px 0px 0px black) drop-shadow(rgb(7, 100, 50) -6px 0px 1px)");
            } else {
                $(id).removeClass("container");
                $(id).addClass("LeftItem");
            }
            return;
        } else if (name == "hasWalljump" && !data["hasWalljumpLeft"] && data["hasWalljumpRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "drop-shadow(-8px 2px 0px black) drop-shadow(rgb(7, 100, 50) 6px 0px 1px)");
            } else {
                $(id).removeClass("container");
                $(id).addClass("RightItem");
            }
            return;
        }

        if (name == "hasSuperDash" && data[name]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "");
            } else {
                $(id).removeClass("LeftItem");
                $(id).removeClass("RightItem");
                $(id).addClass("container");
            }
            setSelected(data[name], id);
            return;
        } else if (name == "hasSuperDash" && data["hasSuperdashLeft"] && !data["hasSuperdashRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "drop-shadow(rgb(7, 100, 50) -7px -1px 2px)")
            } else {
                $(id).removeClass("container");
                $(id).addClass("LeftItem");
            }
            return;
        } else if (name == "hasSuperDash" && !data["hasSuperdashLeft"] && data["hasSuperdashRight"]) {
            if (BorderGlowModern()) {
                $(id).css("filter", "drop-shadow(rgb(7, 100, 50) 7px 0px 2px)")
            } else {
                $(id).removeClass("container");
                $(id).addClass("RightItem");
            }
            return;
        }

        if (name == "swim" && data["canSwim"]) {
            data[name] = true;
            setSelected(data[name], id);
        }

        setSelected(data[name], id);
        if ("levelSprites" in item && data["hasDash"] && !data["hasShadowDash"]) {
            img.attr("src", "images/" + entities["hasDash"].levelSprites[0]);
        }
        else if ("levelSprites" in item && data["hasDash"] && data["hasShadowDash"]) {
            img.attr("src", "images/" + entities["hasDash"].levelSprites[1]);
        }
        return;

    }

    function updateVisible() {
        $('.hideIfSet > div.itemDiv:not(:has(>.selected)):not(:has(>.multiple))').hide();
        $('.container:not(.hideIfSet) div.itemDiv').css("display", "block");
        $('.container.hideIfSet div.itemDiv:has(>.selected)').css("display", "block");
        $('.container.hideIfSet div.itemDiv:has(>.multiple)').css("display", "block");
        if (BorderGlowModern()) {
            if (map.settings.borderColourEquip == null) {
                map.settings.borderColourEquip = "#07ff6e";
                map.settings.borderColourObtain = "#ffffff";
                map.settings.borderColourGave = "#FF0000";
            }
            $(".itemDiv > .multiple").css("filter", "");
            $(".selected").css("filter", "drop-shadow(0px 0px 5px #07ff6e)");
            $(".selected").css("filter", "drop-shadow(0px 0px 5px " + map.settings.borderColourEquip + ")");
            $(".gaveItem").css("filter", "grayscale(1) brightness(.8) drop-shadow(0px 0px 5px " + map.settings.borderColourGave + ")");
            $(".charmDiv > .selected").css("filter", "grayscale(1) brightness(.5) drop-shadow(0px 0px 5px " + map.settings.borderColourObtain + ")");
            $(".charmDiv > .equipped").css("filter", "drop-shadow(0px 0px 5px " + map.settings.borderColourEquip + ")");
        }
    }

    function updateUrlConfig() {
        console.log("Updating url string");

        urlParams["profile"] = profileId;
        window.history.pushState(profileId, "", "index.html?" + $.param(urlParams));

        if (map != undefined && wsprofile.readyState === wsprofile.OPEN && !usingOBS)
            wsprofile.send("save|" + profileId + "|" + btoa(JSON.stringify(map, null, 2).replace("==", "%3D%3D")));
    }

    function setSelected(has, id) {
        if (has && !$(id).hasClass('selected')) {
            $(id).parent().addClass('jello-horizontal');
            $(id).addClass('selected').parent().removeClass('hideIfSet');
        } else if (!has && $(id).hasClass('selected')) {
            $(id).parent().removeClass('jello-horizontal');
            $(id).removeClass('selected').parent().addClass('hideIfSet');
        }
    }

    function setMultipleSelected(has, id) {
        if (has && !$(id).hasClass('multiple'))
            $(id).addClass('multiple').parent().removeClass('hideIfSet');
        else if (!has && $(id).hasClass('multiple'))
            $(id).removeClass('multiple').parent().addClass('hideIfSet');
    }

    function BorderGlowModern() {
        return (map.settings.borderGlow && document.getElementById("pagestyle").href == "https://kingkiller39.github.io/HollowKnightRandomizerTracker2.8/Modern.css");
    }

    function getSubSortKeys(list) {
        return Object.keys(list).sort(function (a, b) {
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

        if (regexReplaceUrl.test(url)) { // only works if not local
            callback(url);
        }
        console.log(url);
        var params = {
            "longDynamicLink": "https://tracker.kingkiller39.me/?link=" + url,
        }
        $.ajax({
            url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' + apiKey,
            type: 'POST',
            data: params,
            success: function (response) {
                callback(response.shortLink);
            }
        });
    }
});