# OpenWrt Auto-Installer

Для установки панели VPNUS на роутер с уже установленным VPNUS/Xray используйте ветку `vpnus-panel` и инструкцию в [vpnus-panel/README.md](vpnus-panel/README.md).

Автоматический установщик для OpenWrt с русским языком, темой Argon, блокировщиком рекламы и оптимизированными настройками WiFi.

## Быстрая установка (одна команда)

Подключитесь к роутеру по SSH и выполните:

```bash
wget -O /tmp/wrt.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/main/openwrt_auto_installer.sh && sh /tmp/wrt.sh
```

Скрипт спросит пароль WiFi (минимум 8 символов) с подтверждением, затем автоматически всё установит и настроит.

---

## Что устанавливается

- **Русский язык** для LuCI веб-интерфейса
- **Тема Argon** (современная тёмная тема)
- **adblock-fast** с веб-интерфейсом и оптимизированными инструментами
  - Hagezi Pro
  - AdguardTeam CNAME Trackers
  - Kboghdady YouTube Ads DNS
- **WiFi настройки против обрывов**
  - SSID: `NetisNX31_2.4Ghz` / `NetisNX31_5Ghz`
  - country=RU
  - PMF (Protected Management Frames) mandatory
  - SAE-mixed (WPA3 + WPA2)
  - `disassoc_low_ack=0`, `skip_inactivity_poll=1`
- **Отключён IPv6 RA/DHCPv6/NDP** (устраняет проблему реассоциации iPhone)

---

## Системные требования

- OpenWrt 24.10.7 или 24.10.8
- Доступ к интернету через WAN
- Минимум 50MB свободного места на `/overlay`
- SSH доступ

---

## Установка

### Способ 1: One-liner (рекомендуется)

```bash
ssh root@192.168.1.1
wget -O /tmp/wrt.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/main/openwrt_auto_installer.sh && sh /tmp/wrt.sh
```

Введите пароль WiFi при запросе (дважды для подтверждения).

### Способ 2: Ручная загрузка

```bash
# Скопируйте файл на роутер
scp openwrt_auto_installer.sh root@192.168.1.1:/tmp/wrt.sh

# Подключитесь и запустите
ssh root@192.168.1.1
sh /tmp/wrt.sh
```

---

## После установки

1. Обновите страницу веб-интерфейса (`http://192.168.1.1`)
2. Интерфейс будет на русском с темой Argon
3. WiFi сети: `NetisNX31_2.4Ghz` (2.4 GHz) и `NetisNX31_5Ghz` (5 GHz)
4. Реклама блокируется автоматически (~399,000 доменов)

Для перезагрузки веб-интерфейса:
```bash
/etc/init.d/uhttpd restart
```

---

## Проверка работы

### adblock-fast
```bash
/etc/init.d/adblock-fast status
```
Ожидаемый вывод: `is blocking 398925 domains`

### Тест блокировки рекламы
```bash
nslookup googlesyndication.com 127.0.0.1
```
Ожидаемый вывод: `NXDOMAIN` (домен заблокирован)

### WiFi настройки
```bash
uci show wireless | grep -E "country|ieee80211w|disassoc_low_ack|skip_inactivity"
```

---

## Настройка

### Изменить SSID
Отредактируйте скрипт перед запуском:
```bash
uci set wireless.default_radio0.ssid='Ваше_Имя_2.4G'
uci set wireless.default_radio1.ssid='Ваше_Имя_5G'
```

### Изменить канал 5 GHz
По умолчанию канал 36. Для изменения:
```bash
uci set wireless.radio1.channel='44'  # или 48, 149, 153, 157
uci commit wireless
wifi reload
```

---

## Совместимость

**Протестировано:**
- OpenWrt 24.10.7 / 24.10.8
- Netis NX31 (MediaTek MT7981B)

**Должно работать:** большинство роутеров с OpenWrt 24.10.x

---

## Устранение проблем

### Не хватает места
```bash
df -h /overlay
```
Если меньше 20MB — удалите ненужные пакеты.

### adblock-fast не блокирует
- Проверьте, что устройства используют роутер как DNS (192.168.1.1)
- На iPhone отключите:
  - Настройки → Wi-Fi → (i) → Private Relay
  - Safari → Конфиденциальность → Hide IP Address

### WiFi обрывается
```bash
logread | grep odhcpd | tail
```
Не должно быть: `No default route present, setting ra_lifetime to 0!`

### Ошибка при установке пакетов
```bash
opkg update
opkg install <package_name>
```

---

## Что делает скрипт

1. Обновляет списки пакетов
2. Устанавливает русский язык + тему Argon
3. Устанавливает adblock-fast с утилитами (gawk, grep, sed, coreutils-sort)
4. Включает 3 списка блокировки (Hagezi Pro, AdguardTeam CNAME, YouTube Ads)
5. Настраивает WiFi с anti-drop параметрами
6. Отключает IPv6 RA/DHCPv6/NDP
7. Ставит Argon темой по умолчанию

Весь процесс занимает 3-5 минут.

---

## Автор

Создано для друзей ❤️

## Лицензия

MIT
