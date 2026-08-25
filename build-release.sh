#!/bin/bash
set -e

# ── 버전을 1씩(Patch) 자동 증가시키고 정보를 읽어옴 ──
echo "📈 버전을 1씩 증가시킵니다 (Patch Bump)..."
npm version patch --no-git-tag-version > /dev/null
VERSION_NAME=$(node -p "require('./package.json').version")
# versionCode = Major*10000 + Minor*100 + Patch (예: 1.4.2 → 10402)
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION_NAME"
VERSION_CODE=$(( MAJOR * 10000 + MINOR * 100 + PATCH ))

GRADLE_FILE="android/app/build.gradle"

echo "══════════════════════════════════════════════"
echo "  🏗️  공돌이 릴리즈 빌드"
echo "  📌 versionName: $VERSION_NAME"
echo "  📌 versionCode: $VERSION_CODE"
echo "══════════════════════════════════════════════"
echo ""

# build.gradle에 버전 반영
sed -i '' "s/versionCode [0-9]*/versionCode $VERSION_CODE/" "$GRADLE_FILE"
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION_NAME\"/" "$GRADLE_FILE"
echo "✅ Android build.gradle 버전 동기화 완료 (versionCode=$VERSION_CODE, versionName=$VERSION_NAME)"

# iOS 프로젝트 버전에 반영
IOS_PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$IOS_PBXPROJ" ]; then
  sed -i '' "s/MARKETING_VERSION = [^\;]*;/MARKETING_VERSION = $VERSION_NAME;/" "$IOS_PBXPROJ"
  sed -i '' "s/CURRENT_PROJECT_VERSION = [^\;]*;/CURRENT_PROJECT_VERSION = $VERSION_CODE;/" "$IOS_PBXPROJ"
  echo "✅ iOS project.pbxproj 버전 동기화 완료"
fi
echo ""

echo "🚀 [1/4] React(Vite) 웹 애플리케이션 빌드 중..."
npm run build
echo ""

echo "📱 [2/4] Android Capacitor 프로젝트 동기화 중..."
npx cap sync android
echo ""

echo "🍏 [3/4] iOS Capacitor 프로젝트 동기화 중..."
npx cap sync ios
echo ""

echo "📦 [4/4] Android 릴리즈 번들(aab) 생성 중..."
cd android
./gradlew bundleRelease
cd ..
echo ""

echo "══════════════════════════════════════════════"
echo "  ✅ 빌드 완료!"
echo "  📌 버전: v$VERSION_NAME (code: $VERSION_CODE)"
echo "  📂 번들: android/app/build/outputs/bundle/release/app-release.aab"
echo "══════════════════════════════════════════════"
