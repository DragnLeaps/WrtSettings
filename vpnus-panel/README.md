# VPNUS LuCI Panel

Компактная панель управления для уже установленного стека VPNUS/Xray на OpenWrt 24.10.x.

## Установка одной командой

Подключитесь к роутеру друга по SSH и выполните:

```sh
wget -O /tmp/vpnus-panel-install.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/vpnus-panel/vpnus-panel/install.sh && sh /tmp/vpnus-panel-install.sh
```

Установщик не меняет пароль, Wi-Fi, SSID или профиль VPNUS. Он устанавливает только панель и зависимости, необходимые для её работы.

После установки откройте:

`http://192.168.1.1/cgi-bin/luci/admin/vpnus`

## Что устанавливается

- режимы VPN для всех устройств и прямой доступ для всех устройств;
- VPN или прямой доступ только для выбранных MAC-адресов;
- выбор профиля/страны VPNUS;
- текущая страна, внешний IP, состояние Xray и задержка;
- кэш геоданных на 5 минут, чтобы не нагружать роутер;
- постоянная SVG-иконка VPNUS в меню LuCI, включая переходы на другие разделы;
- резервные копии изменяемых файлов в `/etc/vpnus/panel-backup/`.

## Требования

- OpenWrt 24.10.x, включая 24.10.8;
- уже установленный и рабочий VPNUS/Xray stack;
- LuCI и доступ root по SSH;
- интернет на роутере для загрузки файлов и зависимостей.

Установщик предупредит, если не найдёт `/usr/bin/vpnus-agent` или `/usr/bin/vpnus-xray-update`, но продолжит установку панели.

## Удаление

```sh
wget -O /tmp/vpnus-panel-uninstall.sh https://raw.githubusercontent.com/DragnLeaps/WrtSettings/vpnus-panel/vpnus-panel/uninstall.sh && sh /tmp/vpnus-panel-uninstall.sh
```

Удаление восстанавливает оригинальный `vpnus-transport`, если он существовал до установки, снимает глобальный CSS-блок панели и сохраняет `/etc/vpnus/panel.conf`.
