#!/usr/bin/env bash
# Generates an RS256 keypair for JWT signing (§5.1) and prints them as single-line env values.
set -euo pipefail
DIR="$(mktemp -d)"
openssl genrsa -out "$DIR/private.pem" 2048 2>/dev/null
openssl rsa -in "$DIR/private.pem" -pubout -out "$DIR/public.pem" 2>/dev/null
KID="key-$(date +%Y%m%d)"
echo "JWT_KID=$KID"
echo "JWT_PRIVATE_KEY=\"$(awk 'BEGIN{ORS="\\n"}{print}' "$DIR/private.pem")\""
echo "JWT_PUBLIC_KEY=\"$(awk 'BEGIN{ORS="\\n"}{print}' "$DIR/public.pem")\""
rm -rf "$DIR"
