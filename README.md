# OpenWrt Auto-Installer

Автоматический установщик для OpenWrt с русским языком, темой Argon, блокировщиком рекламы и оптимизированными настройками WiFi.

## Что устанавливается

- **Русский язык** для LuCI веб-интерфейса
- **Тема Argon** (современная тёмная тема)
- **adblock-fast** с веб-интерфейсом и оптимизированными инструментами
  - Hagezi Pro (основной список)
  - AdguardTeam CNAME Trackers (трекеры через CNAME)
  - Kboghdady YouTube Ads DNS (блокировка рекламы YouTube)
- **WiFi настройки против обрывов соединения**
  - country=RU для правильной работы в РФ
  - PMF (Protected Management Frames) - защита от атак деаутентификации
  - Отключён `disassoc_low_ack` (не отключать клиентов со слабым сигналом)
  - Отключён `skip_inactivity_poll` (не проверять неактивность агрессивно)
  - Шифрование SAE-mixed (WPA3 + WPA2) для основных сетей
- **Отключён IPv6 RA/DHCPv6/NDP** (устраняет проблему с реассоциацией iPhone)

## Системные требования

- OpenWrt 24.10.7 или 24.10.8
- Доступ к интернету через WAN
- Минимум 50MB свободного места на `/overlay`
- SSH доступ к роутеру

## Установка

### Способ 1: Загрузка на роутер

```bash
# Скопируйте скрипт на роутер
scp openwrt_auto_installer.sh root@192.168.1.1:/tmp/

# Подключитесь по SSH
ssh root@192.168.1.1

# Запустите установку
sh /tmp/openwrt_auto_installer.sh
```

### Способ 2: Через wget

```bash
ssh root@192.168.1.1
cd /tmp
wget https://raw.githubusercontent.com/YOUR_USERNAME/openwrt-auto-installer/main/openwrt_auto_installer.sh
sh openwrt_auto_installer.sh
```

## Настройка пароля WiFi

**ВАЖНО:** Перед запуском отредактируйте скрипт и измените пароль WiFi!

```bash
# Откройте скрипт в редакторе
vi /tmp/openwrt_auto_installer.sh

# Найдите строку:
WIFI_PASSWORD="CHANGE_ME"

# Замените на свой пароль:
WIFI_PASSWORD="ваш_надёжный_пароль"
```

Без изменения пароля скрипт завершится с ошибкой.

## После установки

1. Обновите страницу веб-интерфейса (`http://192.168.1.1`)
2. Интерфейс будет на русском с темой Argon
3. WiFi сети появятся с SSID `NetisNX31_2.4Ghz` и `NetisNX31_5Ghz`
4. Реклама начнёт блокироваться автоматически (398,925 доменов)

Для перезагрузки интерфейса вручную:
```bash
/etc/init.d/uhttpd restart
```

## Проверка работы

### adblock-fast
```bash
/etc/init.d/adblock-fast status
```
Должно показать: `is blocking 398925 domains`

### Тест блокировки
```bash
nslookup googlesyndication.com 127.0.0.1
```
Должно вернуть `NXDOMAIN` (домен заблокирован)

### WiFi настройки
```bash
uci show wireless | grep -E "country|ieee80211w|disassoc_low_ack|skip_inactivity"
```

## Настройка SSID и паролей

Если хотите изменить SSID или использовать разные пароли для сетей, отредактируйте секцию WiFi в скрипте:

```bash
uci set wireless.default_radio0.ssid='Ваше_Имя_2.4G'
uci set wireless.default_radio1.ssid='Ваше_Имя_5G'
```

## Совместимость

Протестировано на:
- OpenWrt 24.10.7
- OpenWrt 24.10.8
- Роутеры: Netis NX31 (MediaTek MT7981B)

Должно работать на большинстве роутеров с OpenWrt 24.10.x.

## Устранение проблем

### Не хватает места
```bash
df -h /overlay
```
Если меньше 20MB свободно, удалите неиспользуемые пакеты или старые кеши.

### adblock-fast не блокирует
Проверьте, что устройства используют роутер как DNS (192.168.1.1), а не внешние DNS вроде 8.8.8.8.

На iPhone отключите:
- Настройки → Wi-Fi → (i) рядом с сетью → Private Relay (если есть)
- Safari → Настройки → Конфиденциальность → Hide IP Address

### WiFi обрывается
Убедитесь, что `odhcpd` перезапустился:
```bash
logread | grep odhcpd | tail
```
Не должно быть строк `No default route present, setting ra_lifetime to 0!`

## Автор

Создано для друзей с любовью ❤️

## Лицензия

MIT
