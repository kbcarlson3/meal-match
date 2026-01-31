#!/bin/bash

# Quick script to test individual screens
# Usage: ./scripts/test-screen.sh swipe

SCREEN=$1

if [ -z "$SCREEN" ]; then
  echo "Usage: ./scripts/test-screen.sh <screen-name>"
  echo "Options: design-system, swipe, mealplan, matches, shopping, profile, pairing"
  exit 1
fi

echo "Testing screen: $SCREEN"
export EXPO_PUBLIC_DEV_BYPASS_AUTH=true
export EXPO_PUBLIC_DEV_SCREEN=$SCREEN

npx expo start --clear
