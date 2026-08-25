#!/bin/bash

echo "🚀 [1/4] React(Vite) 웹 애플리케이션 빌드 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 웹 빌드에 실패했습니다."
    exit 1
fi

echo "📱 [2/4] Android Capacitor 프로젝트 동기화 중..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Android 동기화에 실패했습니다."
    exit 1
fi

echo "🍏 [3/4] iOS Capacitor 프로젝트 동기화 중..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ iOS 동기화에 실패했습니다."
    exit 1
fi

echo "📦 [4/4] Android 릴리즈 번들(aab) 생성 중..."
cd android
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "❌ Android 릴리즈 번들 생성에 실패했습니다."
    exit 1
fi
cd ..

echo "✅ 모든 과정이 성공적으로 완료되었습니다!"
echo "📂 번들 위치: android/app/build/outputs/bundle/release/app-release.aab"
