# 🚀 공돌이 앱 배포 (Release) 가이드

이 문서는 완성된 공돌이 앱을 구글 플레이스토어(Android)와 애플 앱스토어(iOS)에 배포하기 위한 전체 프로세스를 담고 있습니다.

---

## 1. 배포 전 공통 준비 사항

### 1-1. 앱 아이콘 및 스플래시 스크린(시작 화면) 생성
모바일 앱 배포 시에는 수십 가지 해상도의 아이콘이 필요합니다. 이를 한 번에 만들어주는 플러그인을 활용합니다.
터미널에서 아래 명령어를 실행하세요:
```bash
npm install -D @capacitor/assets
npx @capacitor/assets generate
```
*(프로젝트 폴더 내에 `assets/icon.png` 및 `assets/splash.png` 원본 이미지를 준비해두면 iOS/Android용 모든 크기의 아이콘을 자동 생성합니다.)*

### 1-2. 최종 웹 빌드 및 동기화
항상 배포 전에는 최신 소스코드를 빌드하고 모바일 프로젝트로 넘겨주어야 합니다.
```bash
npm run build
npx cap sync
```

---

## 2. 🤖 안드로이드 (Google Play Store) 배포

### 2-1. 앱 버전 업데이트
1. 안드로이드 스튜디오에서 프로젝트를 엽니다. (`npx cap open android`)
2. 좌측 메뉴에서 `Gradle Scripts` -> `build.gradle (Module: app)` 파일을 엽니다.
3. `defaultConfig` 블록 안의 버전을 수정합니다:
   - `versionCode` : 숫자를 올립니다 (예: `1` -> `2`)
   - `versionName` : 버전을 명시합니다 (예: `"1.0.0"`)
4. 우측 상단의 **[Sync Now]**를 누릅니다.

### 2-2. 서명키(Keystore) 생성 및 릴리즈 빌드
구글 플레이스토어에 올리려면 `.aab` (App Bundle) 파일이 필요합니다.

1. 안드로이드 스튜디오 상단 메뉴에서 **[Build] -> [Generate Signed Bundle / APK...]** 클릭
2. **Android App Bundle** 선택 후 [Next]
3. **Key store path**: `Create new...` 클릭하여 새로운 키스토어를 만듭니다. (비밀번호는 절대 잊어버리면 안 됩니다!)
4. **Key alias**: `key0` 등 기본값 사용 (비밀번호 입력)
5. [Next] 누른 후 Build Variants에서 **[release]** 선택 후 [Finish]
6. 빌드가 완료되면 `android/app/release/` 폴더에 `app-release.aab` 파일이 생성됩니다.

### 2-3. 플레이스토어 등록
1. [Google Play Console](https://play.google.com/console/)에 개발자 계정으로 로그인 (최초 1회 25달러 결제 필요)
2. **[앱 만들기]** 클릭
3. 앱 정보, 개인정보처리방침 등을 모두 입력
4. **[출시] -> [프로덕션]** 메뉴에서 **새 버전 만들기** 클릭
5. 아까 만든 `app-release.aab` 파일을 업로드하고 심사를 제출(출시)합니다!

---

## 3. 🍎 iOS (Apple App Store) 배포

### 3-1. 앱 버전 업데이트 및 서명
1. Xcode에서 프로젝트를 엽니다. (`npx cap open ios`)
2. 좌측 네비게이터에서 **App** 프로젝트 아이콘을 클릭합니다.
3. **[General]** 탭으로 이동하여 다음을 확인합니다:
   - `Display Name`: 공돌이
   - `Bundle Identifier`: 고유한 역도메인 (예: `com.yourdomain.carpenterapp`)
   - `Version`: 1.0.0
   - `Build`: 1 (업데이트 시 이 숫자를 올립니다)
4. **[Signing & Capabilities]** 탭으로 이동합니다.
   - `Automatically manage signing` 체크
   - `Team`에서 본인의 Apple 개발자 계정(팀)을 선택합니다. *(Apple Developer Program 가입 필수, 연 99달러)*

### 3-2. 권한(Info.plist) 확인
카메라, 사진첩 등을 사용한다면 권한 요청 문구가 필요합니다. 현재 우리는 브라우저와 인터넷 외에 특별한 네이티브 권한은 없지만, 심사를 위해 앱스토어에서 요구하는 권한이 없는지 확인해야 합니다.

### 3-3. 아카이브(Archive) 및 업로드
1. Xcode 상단 기기 선택 창에서 시뮬레이터가 아닌 **[Any iOS Device (arm64)]**를 선택합니다.
2. 상단 메뉴에서 **[Product] -> [Archive]**를 클릭합니다.
3. 빌드가 완료되면 'Organizer' 창이 뜹니다.
4. 해당 아카이브를 선택하고 우측의 **[Distribute App]** 버튼을 클릭합니다.
5. `App Store Connect`를 선택하고 [Next]를 계속 눌러 업로드(Upload)를 완료합니다.

### 3-4. 앱스토어 심사 등록
1. [App Store Connect](https://appstoreconnect.apple.com/) 사이트에 접속합니다.
2. **[나의 앱] -> [+] -> [신규 앱]** 클릭
3. 앱 이름, 스크린샷, 설명, 개인정보처리방침 URL 등을 입력합니다.
4. 빌드 항목에서 방금 Xcode로 업로드한 빌드를 선택합니다.
5. **[심사 제출]**을 클릭하면 끝입니다! (보통 1~3일 정도 소요됩니다.)

---

## ⚠️ 배포 전 마지막 체크리스트
- [ ] 카카오, 구글 등 소셜 로그인 디벨로퍼 콘솔의 플랫폼 설정에 **실제 앱 패키지명(Bundle ID)**이 잘 등록되어 있는지 확인
- [ ] 안드로이드용 카카오 해시 키(Hash Key)를 카카오 디벨로퍼스에 등록했는지 확인 (릴리즈 키 해시 포함)
- [ ] Supabase 프로젝트 설정이 안전한지 확인 (RLS 정책이 모두 켜져 있는지)
- [ ] 안드로이드 뒤로가기 종료, 딥링크(Oauth) 등 모바일 특화 기능이 실제 기기에서 완벽한지 테스트 완료
