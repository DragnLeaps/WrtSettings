"use strict";
"require view";
"require rpc";
"require ui";

var callStatus = rpc.declare({
	object: "luci.vpnus",
	method: "status",
	params: []
});
var callApply = rpc.declare({
	object: "luci.vpnus",
	method: "apply",
	params: ["mode", "selected"]
});
var callCountry = rpc.declare({
	object: "luci.vpnus",
	method: "country",
	params: ["index"]
});
var callExceptions = rpc.declare({
	object: "luci.vpnus",
	method: "exceptions",
	params: ["domains"]
});

function notify(message, level) {
	ui.addNotification(null, E("p", {}, message), level || "info");
}

function fmtTime(ts) {
	if (!ts) return "нет данных";
	return new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

/* Curated quick presets. Each entry is [id, label, domains]. */
var DOMAIN_PRESET_GROUPS = [
	{
		label: "Приложения (50)",
		items: [
			["youtube", "YouTube", "youtube.com,youtu.be,youtube-nocookie.com,youtubei.googleapis.com,googlevideo.com,ytimg.com"],
			["telegram", "Telegram", "telegram.org,telegram.me,telegram.dog,t.me,telesco.pe"],
			["whatsapp", "WhatsApp", "whatsapp.com,whatsapp.net,wa.me"],
			["discord", "Discord", "discord.com,discordapp.com,discord.gg,discord.media,discordcdn.com,discordstatus.com"],
			["instagram", "Instagram", "instagram.com,cdninstagram.com"],
			["facebook", "Facebook / Messenger", "facebook.com,fbcdn.net,fbsbx.com,messenger.com,m.me"],
			["twitter", "X / Twitter", "x.com,twitter.com,t.co,twimg.com"],
			["tiktok", "TikTok", "tiktok.com,tiktokcdn.com,tiktokv.com,byteoversea.com,ibytedtos.com,muscdn.com,musical.ly"],
			["twitch", "Twitch", "twitch.tv,twitchcdn.net,jtvnw.net,ttvnw.net"],
			["netflix", "Netflix", "netflix.com,netflix.net,nflxext.com,nflximg.com,nflximg.net,nflxso.net,nflxvideo.net"],
			["spotify", "Spotify", "spotify.com,spotifycdn.com,spotifycdn.net,scdn.co"],
			["reddit", "Reddit", "reddit.com,redd.it,redditmedia.com,redditstatic.com,redditspace.com"],
			["snapchat", "Snapchat", "snapchat.com,snap.com,sc-cdn.net"],
			["linkedin", "LinkedIn", "linkedin.com,licdn.com"],
			["pinterest", "Pinterest", "pinterest.com,pinimg.com"],
			["threads", "Threads", "threads.net,threads.com,cdninstagram.com,fbcdn.net"],
			["signal", "Signal", "signal.org,signal.art,signal.group,signalusers.org,whispersystems.org"],
			["viber", "Viber", "viber.com,viber.me,vibercdn.com"],
			["zoom", "Zoom", "zoom.us,zoom.com,zoomgov.com,zoomcdn.net"],
			["teams", "Microsoft Teams", "teams.microsoft.com,teams.live.com,skype.com,skype.net,office.com,microsoftonline.com,msftauth.net,msauth.net"],
			["skype", "Skype", "skype.com,skype.net,skypeassets.com"],
			["slack", "Slack", "slack.com,slack-edge.com,slack-files.com,slack-imgs.com,slackb.com"],
			["meet", "Google Meet", "meet.google.com,googleusercontent.com,gstatic.com,googleapis.com"],
			["gmail", "Gmail", "gmail.com,mail.google.com,googlemail.com,googleusercontent.com,gstatic.com"],
			["outlook", "Outlook", "outlook.com,outlook.office.com,office.com,office365.com,microsoftonline.com,live.com"],
			["onedrive", "OneDrive", "onedrive.com,onedrive.live.com,sharepoint.com,1drv.ms,microsoftonline.com,office.com"],
			["drive", "Google Drive", "drive.google.com,docs.google.com,googleusercontent.com,gstatic.com,googleapis.com"],
			["dropbox", "Dropbox", "dropbox.com,dropboxapi.com,dropboxstatic.com,dropboxusercontent.com"],
			["icloud", "iCloud", "icloud.com,icloud-content.com,apple.com,mzstatic.com"],
			["github", "GitHub", "github.com,githubusercontent.com,githubassets.com,github.io,githubstatus.com"],
			["gitlab", "GitLab", "gitlab.com,gitlab.io,gitlab-static.net"],
			["steam", "Steam", "steampowered.com,steamcommunity.com,steamcontent.com,steamstatic.com,steamusercontent.com,steamserver.net"],
			["epic", "Epic Games Store", "epicgames.com,epicgames.dev,epicgamescdn.com,unrealengine.com"],
			["battlenet", "Battle.net", "battle.net,blizzard.com,blizzardgames.com"],
			["ea", "EA app", "ea.com,origin.com,eapro.net,eaassets-a.akamaihd.net"],
			["ubisoft", "Ubisoft Connect", "ubisoft.com,ubi.com,ubisoftconnect.com,ubisoft.org"],
			["riot", "Riot Client", "riotgames.com,riotcdn.net,pvp.net,leagueoflegends.com,playvalorant.com"],
			["playstation", "PlayStation Network", "playstation.com,playstation.net,sonyentertainmentnetwork.com"],
			["xbox", "Xbox Live", "xbox.com,xboxlive.com,xboxservices.com"],
			["nintendo", "Nintendo Switch Online", "nintendo.com,nintendo.net,nintendo-europe.com,nintendo.co.jp"],
			["primevideo", "Amazon Prime Video", "primevideo.com,amazonvideo.com,aiv-cdn.net,media-amazon.com"],
			["disneyplus", "Disney+", "disneyplus.com,disney-plus.net,bamgrid.com,dssott.com"],
			["max", "Max / HBO Max", "max.com,hbomax.com,hbo.com,warnermediacdn.com"],
			["hulu", "Hulu", "hulu.com,huluim.com,huluad.com"],
			["appletv", "Apple TV+", "tv.apple.com,apple.com,mzstatic.com,apple-dns.net"],
			["soundcloud", "SoundCloud", "soundcloud.com,sndcdn.com"],
			["deezer", "Deezer", "deezer.com,dzcdn.net"],
			["vk", "VK", "vk.com,vk.ru,userapi.com,vkuseraudio.net,vk-cdn.net,vkuser.net"],
			["ok", "Одноклассники", "ok.ru,odnoklassniki.ru,mycdn.me"],
			["yandexmusic", "Яндекс Музыка", "music.yandex.ru,yandex.ru,yandex.net,yastatic.net,yandexcloud.net"]
		]
	},
	{
		label: "Игры (50)",
		items: [
			["minecraft", "Minecraft", "minecraft.net,mojang.com,minecraftservices.com,xboxlive.com"],
			["roblox", "Roblox", "roblox.com,rbxcdn.com,robloxapi.com"],
			["fortnite", "Fortnite", "fortnite.com,epicgames.com,epicgames.dev,epicgamescdn.com"],
			["cs2", "Counter-Strike 2", "counter-strike.net,steampowered.com,steamcommunity.com,steamcontent.com,steamserver.net"],
			["dota2", "Dota 2", "dota2.com,steampowered.com,steamcommunity.com,steamcontent.com,steamserver.net"],
			["lol", "League of Legends", "leagueoflegends.com,riotgames.com,riotcdn.net,pvp.net"],
			["valorant", "Valorant", "playvalorant.com,riotgames.com,riotcdn.net,pvp.net"],
			["pubg", "PUBG: Battlegrounds", "pubg.com,pubg.net,pubgstatic.com,krafton.com"],
			["pubgmobile", "PUBG Mobile", "pubgmobile.com,pubgmobile.net,tencentgames.com,levelinfinite.com,igamecj.com"],
			["cod", "Call of Duty", "callofduty.com,activision.com,demonware.net"],
			["warzone", "Call of Duty: Warzone", "callofduty.com,activision.com,demonware.net"],
			["mobilelegends", "Mobile Legends", "mobilelegends.com,moontongames.com,youngjoygame.com"],
			["freefire", "Free Fire", "freefiremobile.com,garena.com,garena.sg"],
			["genshin", "Genshin Impact", "genshinimpact.com,hoyoverse.com,hoyolab.com,mihoyo.com"],
			["hsr", "Honkai: Star Rail", "honkai-star-rail.com,hoyoverse.com,hoyolab.com,mihoyo.com"],
			["zzz", "Zenless Zone Zero", "zenlesszonezero.com,hoyoverse.com,hoyolab.com,mihoyo.com"],
			["wow", "World of Warcraft", "worldofwarcraft.com,battle.net,blizzard.com"],
			["overwatch2", "Overwatch 2", "playoverwatch.com,battle.net,blizzard.com"],
			["diablo4", "Diablo IV", "diablo.com,battle.net,blizzard.com"],
			["hearthstone", "Hearthstone", "hearthstone.com,battle.net,blizzard.com"],
			["apex", "Apex Legends", "apexlegends.com,respawn.com,ea.com,eapro.net"],
			["battlefield", "Battlefield", "battlefield.com,ea.com,eapro.net"],
			["eafc", "EA Sports FC", "easports.com,eafc.com,ea.com,eapro.net"],
			["rocketleague", "Rocket League", "rocketleague.com,psyonix.com,epicgames.com"],
			["rainbowsix", "Rainbow Six Siege", "rainbow6.com,ubisoft.com,ubi.com,ubisoftconnect.com"],
			["gta", "GTA Online", "rockstargames.com,rockstarcdn.com"],
			["rdo", "Red Dead Online", "rockstargames.com,rockstarcdn.com"],
			["destiny2", "Destiny 2", "bungie.net,bungie.com,destinythegame.com"],
			["warframe", "Warframe", "warframe.com,warframecdn.com,digitalextremes.com"],
			["poe", "Path of Exile", "pathofexile.com,pathofexile2.com,grindinggear.com"],
			["ffxiv", "Final Fantasy XIV", "finalfantasyxiv.com,square-enix.com,square-enix-games.com"],
			["blackdesert", "Black Desert", "playblackdesert.com,blackdesertonline.com,pearlabyss.com"],
			["lostark", "Lost Ark", "playlostark.com,amazongames.com,smilegate.com"],
			["newworld", "New World", "newworld.com,amazongames.com"],
			["wot", "World of Tanks", "worldoftanks.com,wargaming.net,wgcdn.co"],
			["wowships", "World of Warships", "worldofwarships.com,wargaming.net,wgcdn.co"],
			["warthunder", "War Thunder", "warthunder.com,gaijin.net,gaijinent.com"],
			["tarkov", "Escape from Tarkov", "escapefromtarkov.com,tarkov.com,battlestategames.com"],
			["rust", "Rust", "playrust.com,facepunch.com"],
			["ark", "ARK: Survival Evolved", "survivetheark.com,playark.com,studiowildcard.com"],
			["palworld", "Palworld", "palworldgame.com,pocketpair.jp"],
			["helldivers2", "Helldivers 2", "helldivers.com,arrowheadgamestudios.com,playstation.com,playstation.net"],
			["dbd", "Dead by Daylight", "deadbydaylight.com,bhvr.com,behaviourinteractive.com"],
			["thefinals", "THE FINALS", "reachthefinals.com,embark.games"],
			["fallguys", "Fall Guys", "fallguys.com,mediatonicgames.com,epicgames.com"],
			["brawlstars", "Brawl Stars", "brawlstars.com,supercell.com,supercell.net"],
			["clashofclans", "Clash of Clans", "clashofclans.com,supercell.com,supercell.net"],
			["clashroyale", "Clash Royale", "clashroyale.com,supercell.com,supercell.net"],
			["pokemongo", "Pokémon GO", "pokemongolive.com,nianticlabs.com"],
			["marvelrivals", "Marvel Rivals", "marvelrivals.com,neteasegames.com,netease.com"]
		]
	}
];

function presetCount() {
	return DOMAIN_PRESET_GROUPS.reduce(function(total, group) { return total + group.items.length; }, 0);
}

function normalizeDomainList(value) {
	var seen = {};
	return String(value || "").split(/[\s,;]+/).map(function(domain) {
		return domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^\*\./, "").split("/")[0];
	}).filter(function(domain) {
		if (!domain || seen[domain]) return false;
		seen[domain] = true;
		return true;
	});
}

return view.extend({
	load: function() {
		return callStatus();
	},

	addStyle: function() {
		if (document.getElementById("vpnus-style")) return;
		var style = document.createElement("style");
		style.id = "vpnus-style";
		style.textContent =
			'.main-left a[href$="/admin/vpnus"]::before{content:""!important;display:block;width:16px;height:16px;left:12.8px;top:50%;padding:0!important;background-color:currentColor!important;background-image:none!important;-webkit-mask:url("' + L.resource("icons/vpnus-menu.svg") + '") center/16px 16px no-repeat;mask:url("' + L.resource("icons/vpnus-menu.svg") + '") center/16px 16px no-repeat;transform:translateY(-50%)}' +
			".vpnus-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}" +
			".vpnus-head h2{margin:0}.vpnus-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}" +
			".vpnus-stat{padding:12px 14px;background:var(--background-color-high,rgba(127,127,127,.08));border:1px solid var(--border-color-medium,#ddd);border-radius:6px}" +
			".vpnus-stat b{display:block;font-size:16px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
			".vpnus-ok{color:#198754}.vpnus-bad{color:#b42318}.vpnus-modes{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}" +
			".vpnus-mode{margin:0!important}.vpnus-mode.selected{box-shadow:inset 0 0 0 2px var(--primary-color,#0069d9)}" +
			".vpnus-devices{width:100%;border-collapse:collapse;margin:8px 0 14px}.vpnus-devices td,.vpnus-devices th{padding:7px 8px;border-bottom:1px solid var(--border-color-medium,#ddd);text-align:left}" +
			".vpnus-devices th{font-size:12px;color:var(--text-color-medium,#666)}.vpnus-device-name{font-weight:600}" +
			".vpnus-device-meta{font-size:12px;color:var(--text-color-medium,#666)}.vpnus-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
			".vpnus-country{display:flex;gap:8px;align-items:center;max-width:520px}.vpnus-country select{flex:1}" +
			".vpnus-exceptions{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,2fr);gap:8px;align-items:start;max-width:860px}.vpnus-exceptions select,.vpnus-exceptions textarea{width:100%;box-sizing:border-box}.vpnus-exceptions textarea{min-height:96px;resize:vertical}.vpnus-preset-actions,.vpnus-exceptions-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}.vpnus-exceptions-help{margin:8px 0 0}" +
			".vpnus-muted{color:var(--text-color-medium,#666);font-size:12px}.vpnus-spin{opacity:.55;pointer-events:none}" +
			"@media(max-width:720px){.vpnus-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.vpnus-devices td:nth-child(3),.vpnus-devices th:nth-child(3){display:none}.vpnus-exceptions{grid-template-columns:1fr}}";
		document.head.appendChild(style);
	},

	apply: function(mode, selected, button) {
		var self = this;
		if (button) button.classList.add("vpnus-spin");
		return callApply(mode, selected.join(",")).then(function(result) {
			if (!result || !result.ok) throw new Error(result && result.error || "Не удалось применить режим");
			self.pendingMode = null;
			self.pendingSelected = null;
			notify("Настройки VPNUS применены", "success");
			return self.refresh();
		}).catch(function(error) {
			notify(error.message || "Ошибка применения настроек", "error");
		}).finally(function() {
			if (button) button.classList.remove("vpnus-spin");
		});
	},

	changeCountry: function(index, button) {
		var self = this;
		button.classList.add("vpnus-spin");
		return callCountry(index).then(function(result) {
			if (!result || !result.ok) throw new Error(result && result.error || "Не удалось сменить профиль");
			notify("Профиль VPNUS обновлён, туннель переподключается", "success");
			return self.refresh().then(function(state) {
				// The backend invalidates the old geo cache. Retry once after xray
				// has had time to reconnect, without restoring periodic polling.
				setTimeout(function() { self.refresh(); }, 5500);
				return state;
			});
		}).catch(function(error) {
			notify(error.message || "Ошибка обновления профиля", "error");
		}).finally(function() { button.classList.remove("vpnus-spin"); });
	},

	refresh: function() {
		var self = this;
		return callStatus().then(function(state) {
			if (self.pendingMode != null) return state;
			var node = self.renderState(state || {ok:false, error:"нет ответа"});
			if (self.root && self.root.parentNode) self.root.parentNode.replaceChild(node, self.root);
			self.root = node;
			return state;
		}).catch(function(error) { notify(error.message || "Не удалось получить состояние", "error"); });
	},

	renderState: function(state) {
		var self = this;
		this.addStyle();
		var mode = this.pendingMode || state.mode || "all-vpn";
		var selected = (this.pendingSelected != null ? this.pendingSelected : (state.selected || [])).slice();
		var vpnOn = state.state === "on";
		var root = E("div", {class: "cbi-map"});
		var refreshButton = E("button", {class: "cbi-button"}, "Обновить");
		refreshButton.addEventListener("click", function() {
			self.pendingMode = null;
			self.pendingSelected = null;
			refreshButton.classList.add("vpnus-spin");
			self.refresh().finally(function() { refreshButton.classList.remove("vpnus-spin"); });
		});
		var headButton = E("button", {class: "cbi-button " + (vpnOn ? "cbi-button-reset" : "cbi-button-apply")}, vpnOn ? "Выключить VPN" : "Включить VPN");
		headButton.addEventListener("click", function() {
			var nextMode = vpnOn ? "all-direct" : (mode === "all-direct" ? "all-vpn" : mode);
			self.apply(nextMode, selected, headButton);
		});
		root.appendChild(E("div", {class: "vpnus-head"}, [E("h2", {}, "VPNUS"), E("div", {class: "vpnus-actions"}, [refreshButton, headButton])]));

		var geo = state.geo || {};
		var country = geo.country || state.country || "не определена";
		var latency = geo.latency_ms != null ? geo.latency_ms + " мс" : "нет данных";
		var xrayText = state.xray === "up" ? "работает" : "не запущен";
		var stats = [
			["Состояние", vpnOn ? "через VPN" : "напрямую", vpnOn ? "vpnus-ok" : "vpnus-bad"],
			["Страна", country, ""],
			["Задержка", latency, ""],
			["Xray", xrayText, state.xray === "up" ? "vpnus-ok" : "vpnus-bad"]
		];
		root.appendChild(E("div", {class: "vpnus-summary"}, stats.map(function(item) {
			return E("div", {class: "vpnus-stat"}, [E("span", {class: "vpnus-muted"}, item[0]), E("b", {class: item[2]}, item[1])]);
		})));

		var section = E("section", {class: "cbi-section"});
		section.appendChild(E("h3", {}, "Маршрутизация"));
		var modes = [
			["all-vpn", "VPN для всех"],
			["all-direct", "Напрямую для всех"],
			["selected-vpn", "VPN только выбранным"],
			["selected-direct", "Напрямую выбранным"]
		];
		var modeButtons = modes.map(function(item) {
			var b = E("button", {class: "cbi-button vpnus-mode" + (mode === item[0] ? " selected" : "")}, item[1]);
			b.addEventListener("click", function() {
				if (item[0].indexOf("selected-") === 0) {
					self.pendingMode = item[0];
					self.pendingSelected = selected.slice();
					var pending = self.renderState(state);
					if (self.root && self.root.parentNode) self.root.parentNode.replaceChild(pending, self.root);
					self.root = pending;
					return;
				}
				self.pendingMode = item[0];
				self.pendingSelected = [];
				self.apply(item[0], [], b);
			});
			return b;
		});
		section.appendChild(E("div", {class: "vpnus-modes"}, modeButtons));

		var table = E("table", {class: "vpnus-devices"}, [E("thead", {}, E("tr", {}, [E("th", {}, ""), E("th", {}, "Устройство"), E("th", {}, "IP / MAC")]))]);
		var body = E("tbody");
		var applyButton;
		var updateApplyButton = function() {
			if (applyButton) applyButton.disabled = mode.indexOf("selected-") === 0 && selected.length === 0;
		};
		(state.devices || []).forEach(function(device) {
			var checked = selected.indexOf(device.mac) >= 0;
			var checkbox = E("input", {type: "checkbox"});
			checkbox.checked = checked;
			checkbox.disabled = mode.indexOf("selected-") !== 0;
			checkbox.addEventListener("change", function() {
				if (checkbox.checked) selected.push(device.mac);
				else selected = selected.filter(function(mac) { return mac !== device.mac; });
				self.pendingMode = mode;
				self.pendingSelected = selected.slice();
				updateApplyButton();
			});
			var name = device.name || "Без имени";
			body.appendChild(E("tr", {}, [E("td", {}, checkbox), E("td", {}, E("span", {class: "vpnus-device-name"}, name)), E("td", {}, [E("span", {}, device.ip), E("br"), E("span", {class: "vpnus-device-meta"}, device.mac)])]));
		});
		if (!state.devices || !state.devices.length) body.appendChild(E("tr", {}, E("td", {colspan: "3"}, "DHCP-устройства не найдены")));
		table.appendChild(body);
		section.appendChild(table);
		applyButton = E("button", {class: "cbi-button cbi-button-apply"}, "Применить выбранные устройства");
		applyButton.disabled = mode.indexOf("selected-") === 0 && selected.length === 0;
		applyButton.addEventListener("click", function() { self.apply(mode, selected, applyButton); });
		section.appendChild(E("div", {class: "vpnus-actions"}, [applyButton, E("span", {class: "vpnus-muted"}, "Правило привязано к MAC-адресам") ]));
		root.appendChild(section);

		var countrySection = E("section", {class: "cbi-section"});
		countrySection.appendChild(E("h3", {}, "Профиль VPNUS"));
		var select = E("select");
		(state.countries || []).forEach(function(item) {
			var option = E("option", {value: item.index}, item.label);
			if (Number(item.index) === Number(state.country_index)) option.selected = true;
			select.appendChild(option);
		});
		var countryButton = E("button", {class: "cbi-button cbi-button-apply"}, "Сменить профиль");
		countryButton.addEventListener("click", function() { self.changeCountry(select.value, countryButton); });
		countrySection.appendChild(E("div", {class: "vpnus-country"}, [select, countryButton]));
		countrySection.appendChild(E("p", {class: "vpnus-muted"}, "Задержка и страна обновляются не чаще одного раза в 5 минут. Последняя проверка: " + fmtTime(geo.ts)));
		root.appendChild(countrySection);

		var exceptionSection = E("section", {class: "cbi-section"});
		exceptionSection.appendChild(E("h3", {}, "Исключения из VPN"));
		exceptionSection.appendChild(E("p", {class: "vpnus-muted vpnus-exceptions-help"}, "Эти домены будут идти напрямую для всех устройств, даже когда они работают через VPN. Быстрый список содержит " + presetCount() + " приложений и игр."));
		var preset = E("select");
		preset.appendChild(E("option", {value: ""}, "Выберите приложение или игру"));
		DOMAIN_PRESET_GROUPS.forEach(function(group) {
			var options = E("optgroup", {label: group.label});
			group.items.forEach(function(item) { options.appendChild(E("option", {value: item[0]}, item[1])); });
			preset.appendChild(options);
		});
		var domainInput = E("textarea", {placeholder: "например: example.com, api.example.com"});
		var exceptionDomains = state.exceptions && state.exceptions.domains || [];
		domainInput.value = exceptionDomains.join(", ");
		var addPreset = E("button", {class: "cbi-button"}, "Добавить пресет");
		addPreset.disabled = true;
		preset.addEventListener("change", function() { addPreset.disabled = !preset.value; });
		addPreset.addEventListener("click", function() {
			var selectedPreset = DOMAIN_PRESET_GROUPS.reduce(function(found, group) {
				return found || group.items.filter(function(item) { return item[0] === preset.value; })[0];
			}, null);
			if (!selectedPreset) return;
			domainInput.value = normalizeDomainList(domainInput.value + "," + selectedPreset[2]).join(", ");
			preset.value = "";
			addPreset.disabled = true;
		});
		var clearDomains = E("button", {class: "cbi-button cbi-button-reset"}, "Очистить список");
		clearDomains.addEventListener("click", function() { domainInput.value = ""; });
		var saveExceptions = E("button", {class: "cbi-button cbi-button-apply"}, "Сохранить исключение");
		saveExceptions.addEventListener("click", function() {
			saveExceptions.classList.add("vpnus-spin");
			callExceptions(domainInput.value).then(function(result) {
				if (!result || !result.ok) throw new Error(result && result.error || "Не удалось сохранить исключение");
				notify("Исключение из VPN сохранено", "success");
				return self.refresh();
			}).catch(function(error) { notify(error.message || "Ошибка сохранения исключения", "error"); }).finally(function() { saveExceptions.classList.remove("vpnus-spin"); });
		});
		exceptionSection.appendChild(E("div", {class: "vpnus-exceptions"}, [E("div", {}, [preset, E("div", {class: "vpnus-preset-actions"}, [addPreset, clearDomains])]), E("div", {}, [domainInput])]));
		exceptionSection.appendChild(E("div", {class: "vpnus-exceptions-actions"}, [saveExceptions, E("span", {class: "vpnus-muted"}, "Пустой список удаляет все доменные исключения") ]));
		root.appendChild(exceptionSection);
		return root;
	},

	render: function(data) {
		this.root = this.renderState(data || {});
		return this.root;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
