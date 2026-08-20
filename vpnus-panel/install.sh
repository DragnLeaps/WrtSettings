#!/bin/sh
# VPNUS LuCI panel installer for OpenWrt 24.10.x.
#
# One-liner from an SSH shell:
#   wget -O /tmp/vpnus-panel-install.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/vpnus-panel/vpnus-panel/install.sh && sh /tmp/vpnus-panel-install.sh

set -eu

RAW_BASE="${VPNUS_PANEL_RAW_BASE:-https://raw.githubusercontent.com/DragnLeaps/WrtSettings/vpnus-panel/vpnus-panel/files}"
BACKUP_DIR=/etc/vpnus/panel-backup
MARKER=/etc/vpnus/panel-install.version
CSS_FILE=/www/luci-static/argon/css/cascade.css
HEADER_FILE=/usr/lib/lua/luci/view/themes/argon/header.htm
HEADER_LOGIN_FILE=/usr/lib/lua/luci/view/themes/argon/header_login.htm
CSS_BEGIN='/* VPNUS_PANEL_CSS_BEGIN */'
CSS_END='/* VPNUS_PANEL_CSS_END */'

log() { printf '%s\n' "[VPNUS] $*"; }
warn() { printf '%s\n' "[VPNUS] WARNING: $*" >&2; }
die() { printf '%s\n' "[VPNUS] ERROR: $*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die 'запустите установщик от root'
[ -r /etc/openwrt_release ] || die 'это не похоже на OpenWrt'
. /etc/openwrt_release
case "${DISTRIB_RELEASE:-}" in
    24.10.*) ;;
    *) die "нужен OpenWrt 24.10.x, обнаружен ${DISTRIB_RELEASE:-unknown}" ;;
esac

command -v opkg >/dev/null 2>&1 || die 'не найден opkg'

has_cmd() { command -v "$1" >/dev/null 2>&1; }

install_dependencies() {
    packages=''
    has_cmd jq || packages="$packages jq"
    has_cmd curl || packages="$packages curl"
    has_cmd nft || packages="$packages nftables-json"
    has_cmd ip || packages="$packages ip-full"
    opkg list-installed 2>/dev/null | grep -q '^rpcd-mod-ucode ' || packages="$packages rpcd-mod-ucode"
    [ -n "$packages" ] || return 0
    log "устанавливаю зависимости:$packages"
    opkg update >/dev/null
    # shellcheck disable=SC2086
    opkg install $packages >/dev/null
}

install_dnsmasq_full() {
    dnsmasq --version 2>/dev/null | grep -q ' nftset ' && return 0
    log 'устанавливаю dnsmasq-full для динамических доменных исключений'
    opkg update >/dev/null
    opkg remove dnsmasq >/dev/null 2>&1 || true
    opkg install dnsmasq-full >/dev/null || die 'не удалось установить dnsmasq-full'
}

fetch() {
    path="$1"
    dest="$2"
    url="$RAW_BASE/$path"
    mkdir -p "$(dirname "$dest")"
    tmp="$dest.vpnus.$$"
    if has_cmd wget; then
        wget -qO "$tmp" "$url" || { rm -f "$tmp"; die "не удалось скачать $path"; }
    elif has_cmd curl; then
        curl -fsSL "$url" -o "$tmp" || { rm -f "$tmp"; die "не удалось скачать $path"; }
    else
        die 'нужен wget или curl для загрузки файлов панели'
    fi
    [ -s "$tmp" ] || { rm -f "$tmp"; die "пустой файл $path"; }
    mv "$tmp" "$dest"
}

backup_once() {
    src="$1"
    name="$2"
    [ -e "$BACKUP_DIR/$name.original" ] && return 0
    [ -e "$BACKUP_DIR/$name.absent" ] && return 0
    if [ -e "$src" ]; then
        cp -p "$src" "$BACKUP_DIR/$name.original"
    else
        : > "$BACKUP_DIR/$name.absent"
    fi
}

install_file() {
    path="$1"
    dest="$2"
    mode="$3"
    name="$4"
    backup_once "$dest" "$name"
    fetch "$path" "$dest"
    chmod "$mode" "$dest"
}

patch_argon() {
    [ -f "$CSS_FILE" ] || { warn 'Argon CSS не найден, глобальная иконка будет включена после установки темы Argon'; return 0; }

    backup_once "$CSS_FILE" argon-cascade
    if ! grep -Fq "$CSS_BEGIN" "$CSS_FILE"; then
        cat >> "$CSS_FILE" <<'CSS'
/* VPNUS_PANEL_CSS_BEGIN */
body .main .main-left .nav > li > a[href$="/admin/vpnus"]::before{content:"" !important;display:block !important;position:absolute !important;left:.8rem !important;top:50% !important;width:16px !important;height:16px !important;padding:0 !important;margin:0 !important;background-color:currentColor !important;background-image:none !important;-webkit-mask-image:url("/luci-static/resources/icons/vpnus-menu.svg") !important;mask-image:url("/luci-static/resources/icons/vpnus-menu.svg") !important;-webkit-mask-repeat:no-repeat !important;mask-repeat:no-repeat !important;-webkit-mask-position:center !important;mask-position:center !important;-webkit-mask-size:16px 16px !important;mask-size:16px 16px !important;transform:translateY(-50%) !important}
/* VPNUS_PANEL_CSS_END */
CSS
    fi
}

patch_header() {
    file="$1"
    [ -f "$file" ] || return 0
    case "$file" in
        "$HEADER_FILE") name=argon-header ;;
        *) name=argon-header-login ;;
    esac
    backup_once "$file" "$name"
    # Bump the asset URL so browsers do not keep the pre-install Argon CSS.
    grep -q 'cascade\.css?v=[^"]*-vpnus1' "$file" || \
        sed -i 's#\(cascade\.css?v=[^"]*\)#\1-vpnus1#g' "$file"
}

log "установка панели на ${DISTRIB_DESCRIPTION:-OpenWrt $DISTRIB_RELEASE}"
install_dependencies
install_dnsmasq_full

[ -x /usr/bin/vpnus-xray-update ] || warn 'не найден /usr/bin/vpnus-xray-update; смена профиля может быть недоступна'
[ -x /usr/bin/vpnus-agent ] || warn 'не найден /usr/bin/vpnus-agent; проверьте, что VPNUS уже установлен'

mkdir -p /etc/vpnus "$BACKUP_DIR"
install_file usr/bin/vpnus-panel /usr/bin/vpnus-panel 0755 usr-bin-vpnus-panel
install_file usr/bin/vpnus-transport /usr/bin/vpnus-transport 0755 usr-bin-vpnus-transport
install_file usr/bin/vpnus-domains /usr/bin/vpnus-domains 0755 usr-bin-vpnus-domains
install_file etc/init.d/vpnus-domains /etc/init.d/vpnus-domains 0755 init-vpnus-domains
install_file usr/share/rpcd/ucode/luci.vpnus /usr/share/rpcd/ucode/luci.vpnus 0644 rpcd-ucode-luci-vpnus
install_file usr/share/rpcd/acl.d/luci-app-vpnus.json /usr/share/rpcd/acl.d/luci-app-vpnus.json 0644 rpcd-acl-luci-app-vpnus
install_file usr/share/luci/menu.d/luci-app-vpnus.json /usr/share/luci/menu.d/luci-app-vpnus.json 0644 luci-menu-luci-app-vpnus
install_file www/luci-static/resources/view/vpnus/main.js /www/luci-static/resources/view/vpnus/main.js 0644 luci-view-vpnus-main
install_file www/luci-static/resources/icons/vpnus-menu.svg /www/luci-static/resources/icons/vpnus-menu.svg 0644 luci-icon-vpnus-menu

patch_argon
patch_header "$HEADER_FILE"
patch_header "$HEADER_LOGIN_FILE"
printf '1\n' > "$MARKER"
chmod 600 "$MARKER"

/etc/init.d/vpnus-domains enable >/dev/null 2>&1 || true
/etc/init.d/vpnus-domains start >/dev/null 2>&1 || true
/usr/bin/vpnus-domains configure >/dev/null 2>&1 || true

log 'перезапускаю rpcd и uhttpd'
rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true

cat <<'DONE'

[VPNUS] Установка завершена.
[VPNUS] Откройте: http://192.168.1.1/cgi-bin/luci/admin/vpnus
[VPNUS] Если LuCI уже открыт, обновите страницу с очисткой кэша.
DONE
