#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! command -v php >/dev/null 2>&1; then
    echo "PHP nebylo nalezeno. Nainstalujte PHP 8.2 nebo novější."
    exit 1
fi

echo "IV Production běží na http://127.0.0.1:8000"
php -S 127.0.0.1:8000 router.php
