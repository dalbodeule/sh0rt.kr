<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()

useSeoMeta({
  title: `sh0rt.kr`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: true },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})
</script>

<template>
  <div>
    <section class="hero is-primary">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title is-white">
            sh0rt.kr에 오신 것을 환영합니다
          </h1>
          <h2 class="subtitle">
            신뢰할 수 있는 URL 단축기와 서브도메인 기능 제공
          </h2>

          <div class="buttons is-centered">
            <nuxt-link v-if="!loggedIn" to="/login" class="button is-light">로그인</nuxt-link>
            <nuxt-link v-if="loggedIn" to="/create" class="button is-info">URL 단축</nuxt-link>
            <nuxt-link v-if="loggedIn" to="/domain" class="button is-success">서브도메인</nuxt-link>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title has-text-centered">sh0rt.kr를 사용해야 하는 이유</h2>
        <div class="columns is-vcentered">
          <div class="column is-half">
            <h3 class="title is-4">URL 단축기를 사용해야 하는 이유</h3>
            <ul>
              <li><FontAwesomeIcon icon="fas fa-link" />&nbsp;<strong>쉽게 공유</strong>: 복잡한 URL을 단순화하여 쉽게 공유하고 기억할 수 있습니다.</li>
              <li><FontAwesomeIcon icon="fas fa-chart-bar" />&nbsp;<strong>분석 기능</strong>: 링크 클릭 수와 사용자 참여도를 분석할 수 있는 상세한 분석 정보를 제공합니다.</li>
              <li><FontAwesomeIcon icon="fas fa-bullhorn" />&nbsp;<strong>브랜딩</strong>: 사용자 맞춤형 짧은 URL로 브랜드 아이덴티티를 강화할 수 있습니다.</li>
            </ul>
          </div>
          <div class="column is-half">
            <h3 class="title is-4">서브도메인을 사용해야 하는 이유</h3>
            <ul>
              <li><FontAwesomeIcon icon="fas fa-tags" />&nbsp;<strong>브랜드 인지도</strong>: 비즈니스나 개인 프로젝트를 위한 고유한 서브도메인으로 전문 이미지를 구축할 수 있습니다.</li>
              <li><FontAwesomeIcon icon="fas fa-lock" />&nbsp;<strong>보안</strong>: 안전하고 전용 서브도메인을 통해 온라인 존재를 유지할 수 있습니다.</li>
              <li><FontAwesomeIcon icon="fas fa-shield-alt" />&nbsp;<strong>Let's Encrypt 지원</strong>: 무료 SSL 인증서를 통해 보안을 강화할 수 있습니다. (별도 작업 필요)</li>
              <li><FontAwesomeIcon icon="fas fa-globe" />&nbsp;<strong>DDNS 지원</strong>: 동적 DNS 기능을 통해 IP 주소가 변경되어도 항상 같은 도메인 이름을 사용할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.section {
  padding: 2rem 1.5rem;
}

.columns {
  margin-top: 2rem;
}

ul {
  list-style-type: none;
  padding-left: 0;
}

li {
  margin-bottom: 1rem;
}

li i {
  color: #3273dc; /* Bulma primary color */
  margin-right: 0.5em;
}
</style>