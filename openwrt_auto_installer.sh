#!/bin/sh
# OpenWrt Auto Installer
# Russian Language + Argon Theme + adblock-fast + WiFi Anti-Drop
# Compatible: OpenWrt 24.10.7 / 24.10.8
#
# One-liner install (run over SSH on the router):
#   wget -O /tmp/wrt.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/main/openwrt_auto_installer.sh && sh /tmp/wrt.sh

set -e

echo ""
echo "==================================="
echo "   OpenWrt Auto Installer"
echo "==================================="
echo ""

# Interactive WiFi password input with confirmation
while true; do
    printf "Enter WiFi password (min 8 chars): "
    read WIFI_PASSWORD

    if [ ${#WIFI_PASSWORD} -lt 8 ]; then
        echo "ERROR: Password must be at least 8 characters. Try again."
        continue
    fi

    printf "Confirm WiFi password: "
    read WIFI_PASSWORD_CONFIRM

    if [ "$WIFI_PASSWORD" != "$WIFI_PASSWORD_CONFIRM" ]; then
        echo "ERROR: Passwords do not match. Try again."
        continue
    fi

    break
done

echo ""
echo "Password set. Starting installation..."
echo ""

# Update package lists
echo "[1/6] Updating package lists..."
opkg update

# Install Russian language pack
echo "[2/6] Installing Russian language..."
opkg install luci-i18n-base-ru

# Install Argon theme
echo "[3/6] Installing Argon theme..."
opkg install luci-theme-argon luci-compat

# Install adblock-fast + recommended tools
echo "[4/6] Installing adblock-fast..."
opkg install adblock-fast luci-app-adblock-fast
opkg --force-overwrite install gawk grep sed coreutils-sort

# Configure adblock-fast: enable only 3 lists
echo "[5/6] Configuring adblock-fast..."
uci set adblock-fast.config.enabled='1'

for i in $(seq 0 15); do
    uci set adblock-fast.@file_url[$i].enabled='0' 2>/dev/null || true
done

idx=0
while uci -q get adblock-fast.@file_url[$idx] >/dev/null 2>&1; do
    name=$(uci -q get adblock-fast.@file_url[$idx].name)
    if echo "$name" | grep -qi "Hagezi.*Pro"; then
        uci set adblock-fast.@file_url[$idx].enabled='1'
    fi
    idx=$((idx + 1))
done

idx=0
while uci -q get adblock-fast.@file_url[$idx] >/dev/null 2>&1; do
    name=$(uci -q get adblock-fast.@file_url[$idx].name)
    if echo "$name" | grep -qi "AdguardTeam.*CNAME.*Tracker"; then
        uci set adblock-fast.@file_url[$idx].enabled='1'
    fi
    idx=$((idx + 1))
done

idx=0
while uci -q get adblock-fast.@file_url[$idx] >/dev/null 2>&1; do
    name=$(uci -q get adblock-fast.@file_url[$idx].name)
    if echo "$name" | grep -qi "YouTube.*Ads"; then
        uci set adblock-fast.@file_url[$idx].enabled='1'
    fi
    idx=$((idx + 1))
done

uci commit adblock-fast
/etc/init.d/adblock-fast enable
/etc/init.d/adblock-fast start

# Configure WiFi 1:1 clone
echo "[6/6] Configuring WiFi..."

# radio0: 2.4 GHz
uci set wireless.radio0.band='2g'
uci set wireless.radio0.channel='auto'
uci set wireless.radio0.htmode='HE20'
uci set wireless.radio0.legacy_rates='1'
uci set wireless.radio0.cell_density='0'
uci set wireless.radio0.country='RU'
uci set wireless.radio0.disabled='0'

uci set wireless.default_radio0.device='radio0'
uci set wireless.default_radio0.network='lan'
uci set wireless.default_radio0.mode='ap'
uci set wireless.default_radio0.ssid='NetisNX31_2.4Ghz'
uci set wireless.default_radio0.encryption='sae-mixed'
uci set wireless.default_radio0.key="$WIFI_PASSWORD"
uci set wireless.default_radio0.ieee80211w='2'
uci set wireless.default_radio0.ocv='0'
uci set wireless.default_radio0.skip_inactivity_poll='1'
uci set wireless.default_radio0.disassoc_low_ack='0'

# radio1: 5 GHz
uci set wireless.radio1.band='5g'
uci set wireless.radio1.channel='36'
uci set wireless.radio1.htmode='HE80'
uci set wireless.radio1.cell_density='0'
uci set wireless.radio1.country='RU'
uci set wireless.radio1.disabled='0'

uci set wireless.default_radio1.device='radio1'
uci set wireless.default_radio1.network='lan'
uci set wireless.default_radio1.mode='ap'
uci set wireless.default_radio1.ssid='NetisNX31_5Ghz'
uci set wireless.default_radio1.encryption='sae-mixed'
uci set wireless.default_radio1.key="$WIFI_PASSWORD"
uci set wireless.default_radio1.ieee80211w='2'
uci set wireless.default_radio1.ocv='0'
uci set wireless.default_radio1.skip_inactivity_poll='1'
uci set wireless.default_radio1.disassoc_low_ack='0'

uci commit wireless

# Disable IPv6 RA/DHCPv6/NDP
uci set dhcp.lan.ra='disabled'
uci set dhcp.lan.dhcpv6='disabled'
uci set dhcp.lan.ndp='disabled'
uci commit dhcp

/etc/init.d/odhcpd restart
wifi reload

# Set Argon as default theme
uci set luci.main.mediaurlbase='/luci-static/argon'
uci commit luci

echo ""
echo "==================================="
echo "Installation complete!"
echo ""
echo "  Russian language"
echo "  Argon theme (default)"
echo "  adblock-fast: Hagezi Pro + AdguardTeam CNAME + YouTube Ads"
echo "  WiFi: NetisNX31_2.4Ghz / NetisNX31_5Ghz (country=RU, PMF, anti-drop)"
echo "  IPv6 RA/DHCPv6/NDP disabled"
echo ""
echo "Refresh browser: http://192.168.1.1"
echo "==================================="
