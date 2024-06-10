<script setup lang="ts">
useSeoMeta({
  title: `sh0rt.kr :: DDNS 설정 방법`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})
</script>

<template>
  <div class="container box">
    <section class="section content">
      <h1 class="title">DDClient 설정 안내</h1>
      <h2 class="subtitle">Linux 및 Windows에서 ddclient 구성</h2>

      <p>공통 사항: <NuxtLink to="/manage">관리 페이지</NuxtLink>에서 DDNS Key를 설정해야 합니다.</p>

      <div class="box">
        <h3 class="title is-4">Linux (Ubuntu/Debian)</h3>
        <ol>
          <li>ddclient 설치:
            <pre><code>sudo apt-get install ddclient</code></pre>
          </li>
          <li>설정 파일 편집:
            <pre><code>sudo nano /etc/ddclient.conf</code></pre>
          </li>
          <li>다음 설정 추가:
            <pre><code>
daemon=300
syslog=yes
mail-failure=root
pid=/var/run/ddclient.pid
use=web, web=checkip.dyndns.com/, web-skip='Current IP Address:'
server=sh0rt.kr
protocol=dyndns2
login= // 이메일 주소
password= // DDNS Key
your.domain.com // 서브도메인
            </code></pre>
          </li>
          <li>ddclient 재시작:
            <pre><code>sudo systemctl restart ddclient</code></pre>
          </li>
        </ol>
      </div>

      <div class="box">
        <h3 class="title is-4">Windows</h3>
        <ol>
          <li><a href="https://www.randomnoun.com/wp/2013/08/19/a-dynamic-dns-client-for-windows/">Windows DDClient</a>에서 ddclient 다운로드 및 설치.</li>
          <li>설치 파일 실행:
            <ol>
              <li>Client hostname: 서브도메인 (ex: your.domain.com)</li>
              <li>Dynamic DNS server: sh0rt.kr</li>
              <li>Dynamic DNS username: 이메일 주소</li>
              <li>Dynamic DNS password: DDNS Key</li>
              <li>Connection: HTTPS</li>
            </ol>
          </li>
          <li>ddclient 실행:
            <pre><code>ddclient -daemon=300 -syslog</code></pre>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>

</style>