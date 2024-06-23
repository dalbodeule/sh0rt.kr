<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ErrorMessage, Field, Form, configure, defineRule } from "vee-validate";
import { alpha_num, min, max, required, url } from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

import ko from '@vee-validate/i18n/dist/locale/ko.json'
import en from '@vee-validate/i18n/dist/locale/en.json'
import type { IUIDPostRequest } from "~/server/routes/api/forward/index.post";
import getDate from "~/common/getDate";
import type { Ref } from "vue";
import { Status } from "~/common/enums";
import dayjs from "dayjs";
import randomAddr from "~/common/randomAddr";

const banlist = [ 'create', 'login', 'logout', 'admin', 'root', 'manage', 'privacy', 'domain' ]

const config = useRuntimeConfig()

const emit = defineEmits<{submit: []}>()
const props = defineProps<{submitText: string, isNew: boolean, lock: boolean}>();

// datetime picker default value
// https://futurestud.io/tutorials/vue-js-3-bind-a-value-to-an-html-datetime-input
const addrInfo: Ref<IUIDPostRequest> = inject('addrInfo') ??
    ref({ uid: '', forward: '', expires: dayjs().format("YYYY-MM-DD"), token: '' })
const status: Ref<Status> = inject('status') ?? ref(Status.DEFAULT)

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
defineRule('after_days', (value: string, days: never[]) => {
  if(!value) return true
  const selectedDate = new Date(value)
  const currentDate = getDate(days[0] ?? '7')

  return selectedDate.getTime() >= currentDate.getTime()
})
defineRule('before_days', (value: string, days: never[]) => {
  if(!value) return true
  const selectedDate = new Date(value)
  const currentDate = getDate(days[0] ?? '365')

  return selectedDate.getTime() <= currentDate.getTime()
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

const schema = {
  uid: { alpha_num: true, min: 3, max: 20, required: true, unique: props.isNew },
  origin: { url: true, required: true },
  expires_in: { required: true, after_days: 6, before_days: 366 }
}
</script>

<template>
  <Form :validation-schema="schema" @submit="emit('submit')">
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
              <Field v-model="addrInfo.uid" class="input" name="uid" type="text" maxlength="20" minlength="3" :delay="500" :disabled="!isNew || props.lock"/>
            </div>
            <div class="control">
              <button class="button is-info" type="button" :disabled="!isNew || props.lock" @click="addrInfo!!.uid = randomAddr()">
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
            <Field v-model="addrInfo.forward" class="input" name="origin" type="text" maxlength="4096" minlength="10" :disabled="props.lock"/>
            <span class="icon is-left">
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
            <Field v-model="addrInfo.expires" class="input" name="expires_in" type="date" :disabled="props.lock"/>
          </div>
          <ErrorMessage name="expires_in" as="p" class="help is-danger"/>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <NuxtTurnstile v-model="addrInfo.token" :options="{theme: 'light'}"/>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button type="submit" class="button is-link" :disabled="status == Status.PENDING || props.lock || !addrInfo.token">{{ props.submitText }}</button>
      </div>
      <div class="control">
        <button type="reset" class="button is-link is-light" :disabled="status == Status.PENDING || props.lock">취소</button>
      </div>
    </div>
  </Form>
</template>

<style scoped>

</style>