<script setup lang="ts">
import type {Ref} from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ErrorMessage, Field, Form, configure, defineRule } from "vee-validate";
import { alpha_num, min, max, min_value, required, url } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'

import ko from '@vee-validate/i18n/dist/locale/ko.json'
import en from '@vee-validate/i18n/dist/locale/en.json'

const router = useRouter()
const { loggedIn, user, session, clear } = useUserSession()

const banlist = ['create', 'login', 'logout', 'admin', 'root']

if(!loggedIn.value) {
  router.push('/')
}

defineRule('alpha_num', alpha_num)
defineRule('min', min)
defineRule('max', max)
defineRule('required', required)
defineRule('url', url)


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

  return date
}

// https://velog.io/@awesomelon/%EA%B0%84%EB%8B%A8%ED%95%98%EA%B2%8C-%EB%82%9C%EC%88%98%ED%99%94-%EB%AC%B8%EC%9E%90%EC%97%B4-%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0
const randomAddr = () => {
  return Math.random().toString(36).substring(2,11)
}

// https://futurestud.io/tutorials/vue-js-3-bind-a-value-to-an-html-datetime-input
// datetime picker default value
const addrInfo: Ref<{
  uid: string,
  origin: string,
  userid: number,
  expires_in: string
}> = ref({ uid: '', origin: '', userid: user.value?.id ?? 0, expires_in: getDate().toISOString().substring(0, 10) })

const schema = {
  uid: { alpha_num: true, min: 3, max: 20, required: true },
  origin: { url: true, required: true },
  expires_in: { required: true }
}

setLocale('ko')
</script>

<template>
  <div class="container box" style="min-height: 80vh">
    <Form @submit.prevent="" :validation-schema="schema">
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
                <Field class="input" name="uid" type="text" maxlength="20" minlength="3" v-model="addrInfo.uid"/>
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
              <Field class="input" name="origin" type="text" maxlength="4096" minlength="10" v-model="addrInfo.origin"/>
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
              <Field class="input" name="expires_in" type="date" v-model="addrInfo.expires_in"/>
            </div>
            <ErrorMessage name="expires_in" as="p" class="help is-danger"/>
          </div>
        </div>
      </div>
      <div class="field is-grouped is-grouped-right">
        <div class="control">
          <button type="submit" class="button is-link">만들기</button>
        </div>
        <div class="control">
          <button type="reset" class="button is-link is-light">취소</button>
        </div>
      </div>
    </Form>
  </div>
</template>

<style scoped>

</style>