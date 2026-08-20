#!/bin/sh
# Remove VPNUS LuCI panel and restore files changed by install.sh.

set -eu

BACKUP_DIR=/etc/vpnus/panel-backup
CSS_FILE=/www/luci-static/argon/css/cascade.css
HEADER_FILE=/usr/lib/lua/luci/view/themes/argon/header.htm
HEADER_LOGIN_FILE=/usr/lib/lua/luci/view/themes/argon/header_login.htm

log() { printf '%s\n' "[VPNUS] $*"; }
[ "$(id -u)" = 0 ] || { echo '[VPNUS] запустите удаление от root' >&2; exit 1; }

restore() {
    src="$BACKUP_DIR/$1.original"
    dest="$2"
    [ -f "$src" ] && cp -p "$src" "$dest"
}

restore_or_remove() {
    src="$BACKUP_DIR/$1.original"
    dest="$2"
    if [ -f "$src" ]; then
        cp -p "$src" "$dest"
    else
        rm -f "$dest"
    fi
}

if [ -f "$CSS_FILE" ]; then
    sed -i '/^\/\* VPNUS_PANEL_CSS_BEGIN \*\//,/^\/\* VPNUS_PANEL_CSS_END \*\//d' "$CSS_FILE"
fi

restore argon-cascade "$CSS_FILE"
restore argon-header "$HEADER_FILE"
restore argon-header-login "$HEADER_LOGIN_FILE"
restore_or_remove usr-bin-vpnus-transport /usr/bin/vpnus-transport
restore_or_remove usr-bin-vpnus-panel /usr/bin/vpnus-panel
restore_or_remove usr-bin-vpnus-domains /usr/bin/vpnus-domains
restore_or_remove init-vpnus-domains /etc/init.d/vpnus-domains
restore_or_remove rpcd-ucode-luci-vpnus /usr/share/rpcd/ucode/luci.vpnus
restore_or_remove rpcd-acl-luci-app-vpnus /usr/share/rpcd/acl.d/luci-app-vpnus.json
restore_or_remove luci-menu-luci-app-vpnus /usr/share/luci/menu.d/luci-app-vpnus.json
restore_or_remove luci-view-vpnus-main /www/luci-static/resources/view/vpnus/main.js
restore_or_remove luci-icon-vpnus-menu /www/luci-static/resources/icons/vpnus-menu.svg
rm -f /etc/vpnus/panel-install.version
/etc/init.d/vpnus-domains disable >/dev/null 2>&1 || true
/etc/init.d/vpnus-domains stop >/dev/null 2>&1 || true
uci -q delete dhcp.vpnus_panel_excluded || true
uci commit dhcp
/etc/init.d/dnsmasq restart >/dev/null 2>&1 || true
rmdir /www/luci-static/resources/view/vpnus 2>/dev/null || true

rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
log 'панель удалена; настройки VPNUS и /etc/vpnus/panel.conf сохранены'
