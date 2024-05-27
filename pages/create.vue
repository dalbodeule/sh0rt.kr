<script setup lang="ts">
import type {Ref} from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ErrorMessage, Field, Form, configure, defineRule } from "vee-validate";
import { alpha_num, min, max, required, url } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'

import ko from '@vee-validate/i18n/dist/locale/ko.json'
import en from '@vee-validate/i18n/dist/locale/en.json'

import { Status } from "~/common/enums"
import dayjs from "dayjs";
import type {IUIDPostRequest} from "~/server/routes/api/forward/index.post";

const router = useRouter()
const { loggedIn, user, session, clear } = useUserSession()
const config = useRuntimeConfig()

const status: Ref<Status> = ref(Status.DEFAULT)

const banlist = [ 'create', 'login', 'logout', 'admin', 'root', 'manage' ]

if(!loggedIn.value) {
  router.push('/')
}

defineRule('alpha_num', alpha_num)
defineRule('min', min)
defineRule('max', max)
defineRule('required', required)
defineRule('url', url)
defineRule('unique', async(value: string) => {
  if (!value) return true
  if(banlist.includes(value)) return false

  try {
    const data = await $fetch(`${config.public.baseUrl}/api/forward/${value}`, {
      method: 'GET',
    })
    return !data
  } catch(e) {
    return true
  }
})
defineRule('after_days', (value: string, days: any[]) => {
  if(!value) return true
  const selectedDate = new Date(value)
  const currentDate = getDate(days[0] ?? '7')

  return selectedDate.getTime() >= currentDate.getTime()
})

configure({
  generateMessage: localize({
    ko,
    en
  }),
});

localize({
  ko: {
    names: {
      uid: '단축주소',
      origin: '원본주소',
      expires_in: '만료일'
    }
  },
  en: {
    names: {
      uid: 'Shorted address',
      origin: 'Origin address',
      expires_in: 'Expire date'
    }
  }
})

const getDate = (day: number = 7): Date => {
  const date = new Date()
  date.setDate(date.getDate() + day)
  date.setHours(0, 0, 0, 0)

  return date
}

// https://velog.io/@awesomelon/%EA%B0%84%EB%8B%A8%ED%95%98%EA%B2%8C-%EB%82%9C%EC%88%98%ED%99%94-%EB%AC%B8%EC%9E%90%EC%97%B4-%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0
const randomAddr = () => {
  return Math.random().toString(36).substring(2,11)
}

// https://futurestud.io/tutorials/vue-js-3-bind-a-value-to-an-html-datetime-input
// datetime picker default value
const addrInfo: Ref<IUIDPostRequest> = ref({ uid: '', forward: '', expires: dayjs().format('YYYY-MM-DD') })

const schema = {
  uid: { alpha_num: true, min: 3, max: 20, required: true, unique: true },
  origin: { url: true, required: true },
  expires_in: { required: true, after_days: 6 }
}

setLocale('ko')

const onSubmit = async() => {
  console.log("submitted")
  status.value = Status.PENDING

  try {
    const result = await $fetch(`${config.public.baseUrl}/api/forward`, {
      method: "POST",
      body: JSON.stringify(addrInfo.value)
    })

    if(result) {
      status.value = Status.SUCCESS
    } else {
      status.value = Status.ERROR
    }
  } catch(e) {
    status.value = Status.ERROR
  }
}

useSeoMeta({
  title: `sh0rt.kr :: create`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})
</script>

<template>
  <div class="box content">
    <Form @submit="onSubmit()" :validation-schema="schema">
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">단축주소</label>
        </div>
        <div class="field-body">
          <div class="field is-expanded">
            <div class="field has-addons">
              <div class="control">
                <button class="button is-primary is-static" type="button">https://sh0rt.kr/</button>
              </div>
              <div class="control is-expanded">
                <Field class="input" name="uid" type="text" maxlength="20" minlength="3" v-model="addrInfo.uid" :delay="500"/>
              </div>
              <div class="control">
                <button class="button is-info" type="button" @click="addrInfo.uid = randomAddr()">
                  랜덤 생성
                </button>
              </div>
            </div>
            <ErrorMessage name="uid" as="p" class="help is-danger"/>
          </div>
        </div>
      </div>
      <div class="field has-addons is-horizontal">
        <div class="field-label is-normal">
          <label class="label">원본주소</label>
        </div>
        <div class="field-body">
          <div class="control">
            <div class="control has-icons-left is-expanded">
              <Field class="input" name="origin" type="text" maxlength="4096" minlength="10" v-model="addrInfo.forward"/>
              <span class="icon is-small is-left">
                <FontAwesomeIcon :icon="['fas', 'paperclip']" />
              </span>
            </div>
            <ErrorMessage name="origin" as="p" class="help is-danger"/>
          </div>
        </div>
      </div>
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">만료일</label>
        </div>
        <div class="field-body is-normal">
          <div class="field">
            <div class="control">
              <Field class="input" name="expires_in" type="date" v-model="addrInfo.expires" />
            </div>
            <ErrorMessage name="expires_in" as="p" class="help is-danger"/>
          </div>
        </div>
      </div>
      <div class="field is-grouped is-grouped-right">
        <div class="control">
          <button type="submit" class="button is-link" :disabled="status == Status.PENDING">만들기</button>
        </div>
        <div class="control">
          <button type="reset" class="button is-link is-light" :disabled="status == Status.PENDING">취소</button>
        </div>
      </div>
    </Form>
    <div style="margin-top: 30px;" />
    <div class="notification is-success" v-if="status == Status.SUCCESS">
      <p><a :href="`https://sh0rt.kr/${addrInfo.uid}`">https://sh0rt.kr/{{addrInfo.uid}}</a> 생성에 성공했습니다.</p>
      <p>만료일: {{ dayjs(addrInfo.expires).format('YYYY-MM-DD')}}</p>
    </div>
    <div class="notification is-warning" v-else-if="status == Status.ERROR">
      <p>생성에 실패했습니다.</p>
    </div>
    <progress class="progress is-primary" v-else-if="status == Status.PENDING" max="100"></progress>
  </div>
</template>

<style scoped>

</style>