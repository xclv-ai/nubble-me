#!/bin/zsh
# Build → install → open → capture the Dr HAOS screens from the owner's iPhone (debug build).
# Usage: ios/scripts/phone.sh build|install|open [args]|shot <name>|dump|all
# Debug launch args: -flow (open the rounds) · -flow -why (first signal's Why? sheet) · -flow -page 3 (discharge)
#                    -dump (write today's rounds' words to Documents/rounds.json) · -selftest <url> · -punch [-rewrite -haos]
D=${NUBBLE_DEVICE:-00008130-000603680CDB803A}
DD=/tmp/claude-501/nubble-dd
APP=$DD/Build/Products/Debug-iphoneos/Nubble.app
O=${NUBBLE_CAPS:-/tmp/claude-501/caps}; mkdir -p $O
cd "$(dirname "$0")/.."
case "$1" in
  build)   xcodebuild -project Nubble.xcodeproj -scheme Nubble -destination 'generic/platform=iOS' -derivedDataPath $DD -allowProvisioningUpdates build 2>&1 | grep -E "error:|BUILD (SUCCEEDED|FAILED)" | sort -u ;;
  install) xcrun devicectl device install app --device $D $APP 2>&1 | grep -E "App installed|ERROR|locked" ;;
  open)    shift; xcrun devicectl device process launch --terminate-existing --device $D me.nubble.app -- "$@" 2>&1 | grep -E "Launched|Locked" | head -1 ;;
  shot)    xcrun devicectl device capture screenshot --device $D --destination $O/$2.png >/dev/null 2>&1 && sips -Z 1400 $O/$2.png >/dev/null 2>&1 && echo "$O/$2.png" ;;
  dump)    xcrun devicectl device process launch --terminate-existing --device $D me.nubble.app -- -dump >/dev/null 2>&1; sleep 6
           rm -f $O/rounds.json; xcrun devicectl device copy from --device $D --domain-type appDataContainer --domain-identifier me.nubble.app --source Documents/rounds.json --destination $O/rounds.json >/dev/null 2>&1 && echo "$O/rounds.json" ;;
  all)     $0 build && $0 install && $0 open && sleep 8 && $0 shot rounds && $0 open -flow && sleep 14 && $0 shot signal && $0 open -flow -why && sleep 16 && $0 shot why && $0 open -flow -page 3 && sleep 10 && $0 shot discharge ;;
  *)       sed -n 2,6p "$0" ;;
esac
