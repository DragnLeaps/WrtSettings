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

function notify(message, level) {
	ui.addNotification(null, E("p", {}, message), level || "info");
}

function fmtTime(ts) {
	if (!ts) return "нет данных";
	return new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
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
			".vpnus-muted{color:var(--text-color-medium,#666);font-size:12px}.vpnus-spin{opacity:.55;pointer-events:none}" +
			"@media(max-width:720px){.vpnus-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.vpnus-devices td:nth-child(3),.vpnus-devices th:nth-child(3){display:none}}";
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
			notify("Профиль VPNUS обновлён, туннель переподключён", "success");
			return self.refresh();
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
