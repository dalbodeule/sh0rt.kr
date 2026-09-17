# sh0rt.kr

`sh0rt.kr`은 링크 생성, QR 코드, 방문 통계와 신고·관리 기능을 제공하는 URL 단축 서비스입니다.
한국어, 영어, 일본어 UI와 언어별 이용약관 및 개인정보처리방침을 지원합니다.

## 주요 기능

- 사용자 지정 경로를 사용하는 단축주소 생성
- 최대 3년의 만료일 설정 및 기본 만료일 자동 선택
- 단축주소별 QR 코드 생성과 이미지 다운로드
- 국가, 브라우저, 운영체제, 기기, 언어 및 유입 경로별 방문 통계
- Google 및 GitHub OAuth 로그인
- 사용자별 링크 목록과 링크 수정 페이지
- 웹 및 이메일 기반 악성 링크 신고 접수
- 사용자, 링크, 신고를 관리하는 운영자 페이지
- 한국어, 영어, 일본어 UI 및 법률 문서
- 계정 제한과 역할 기반 접근 제어

## 기술 스택

- Nuxt 4, Vue 3, TypeScript
- Tailwind CSS 4
- Nuxt i18n
- Drizzle ORM
- Cloudflare Workers, D1, Analytics Engine
- Cloudflare Turnstile
- VeeValidate

## 로컬 개발

### 요구 사항

- Node.js 26 이상
- npm
- Cloudflare 계정과 Wrangler CLI가 필요한 Cloudflare 리소스 접근 권한

### 설치

```bash
npm install
```

### 환경변수

로컬 Nuxt 개발 서버는 프로젝트 루트의 `.env.nuxt`를 사용합니다.

```dotenv
BASE_URL=http://localhost:3000
SESSION_PASSWORD=충분히-긴-임의의-비밀값

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

ANALYTICS_ACCOUNT_ID=
ANALYTICS_API_TOKEN=

# 쉼표로 여러 도메인을 지정할 수 있습니다.
NUXT_REPORT_DOMAINS=example.com,example.org
```

Cloudflare 로컬 실행에 필요한 비밀값은 `.dev.vars`에 설정합니다. 이 파일과 `.env.nuxt`는
저장소에 커밋하지 마세요.

```dotenv
NUXT_SESSION_PASSWORD=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=
NUXT_TURNSTILE_SECRET_KEY=
NUXT_ANALYTICS_ACCOUNT_ID=
NUXT_ANALYTICS_API_TOKEN=
```

공개 설정과 Cloudflare 바인딩은 [`wrangler.toml`](./wrangler.toml)에서 관리합니다. 실제 배포 전에
도메인, OAuth 클라이언트 ID, D1 데이터베이스 및 Analytics Engine 설정을 자신의 환경에 맞게
변경하세요.

### 데이터베이스 마이그레이션

로컬 D1 데이터베이스에 마이그레이션을 적용합니다.

```bash
npx wrangler d1 migrations apply prod-sh0rt-kr --local
```

운영 D1 데이터베이스에 적용하려면 다음 명령을 사용합니다.

```bash
npx wrangler d1 migrations apply prod-sh0rt-kr --remote
```

스키마를 변경한 뒤 새 마이그레이션을 생성할 수 있습니다.

```bash
npm run create_meta
```

### 개발 서버

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## 검사 및 포맷팅

```bash
npm run lint
npm run typecheck
npm run format
```

## 빌드 및 Cloudflare 배포

Cloudflare Workers용 프로덕션 빌드를 생성합니다.

```bash
npm run build
```

빌드 결과를 Cloudflare 로컬 환경에서 확인합니다.

```bash
npx wrangler dev .output/server/index.mjs --assets .output/public
```

운영 환경에 배포합니다.

```bash
npx wrangler deploy .output/server/index.mjs --assets .output/public
```

배포 전에는 D1 마이그레이션, Worker 비밀값, OAuth 콜백 URL, Turnstile 허용 도메인을 반드시
확인하세요.

## 다국어 및 법률 문서

UI 번역 파일은 다음 경로에서 관리합니다.

```text
i18n/locales/ko.json
i18n/locales/en.json
i18n/locales/ja.json
```

이용약관과 개인정보처리방침은 `public/legal` 아래의 Markdown 파일로 관리합니다.

```text
public/legal/policy_ko.md
public/legal/policy_en.md
public/legal/policy_ja.md
public/legal/privacy_ko.md
public/legal/privacy_en.md
public/legal/privacy_ja.md
```

한국어 문서가 원문이며 대한민국 법률의 적용을 받습니다. 영어와 일본어 문서는 편의를 위한
번역본입니다.

## 라이선스

이 프로젝트는 [GNU Affero General Public License v3.0](./LICENSE.md)에 따라 배포됩니다.
