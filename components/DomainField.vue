<script setup lang="ts">
import { ErrorMessage, Field, Form, configure, defineRule } from "vee-validate"
import { alpha_num, min, max, required, url } from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

import ko from '@vee-validate/i18n/dist/locale/ko.json'
import en from '@vee-validate/i18n/dist/locale/en.json'

import type { Ref } from "vue";
import { Status } from "~/common/enums";
import getDate from "~/common/getDate";
import dayjs from "dayjs";
import randomAddr from "~/common/randomAddr";
import type {IDomainPostRequest} from "~/server/routes/api/domain/index.post";

const config = useRuntimeConfig()

const banlist = [ 'create', 'login', 'logout', 'admin', 'root', 'manage', 'privacy', 'www' ]
const domainlist = config.public.domainList.split(',')

const emit = defineEmits<{submit: []}>()
const props = defineProps<{submitText: string, isNew: boolean, lock: boolean}>()

const domainInfo: Ref<IDomainPostRequest> = inject('domainInfo') ?? ref({
  domain: '', expires: dayjs(getDate()).format('YYYY-MM-DD'), tld: '.sh0rt.store'
})
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
    const data = await $fetch(`${config.public.baseUrl}/api/domain/${value}`, {
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
      domain: '도메인',
      expires_in: '만료일'
    }
  },
  en: {
    names: {
      domain: 'Domain',
      expires_in: 'Expire date'
    }
  }
})

const schema = {
  domain: { alpha_num: true, min: 3, max: 20, required: true, unique: props.isNew },
  expires_in: { required: true, after_days: 6, before_days: 366 }
}

</script>

<template>
  <Form :validation-schema="schema" @submit="emit('submit')">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">도메인</label>
      </div>
      <div class="field-body">
        <div class="field is-expanded">
          <div class="field has-addons">
            <div class="control is-expanded">
              <Field v-model="domainInfo.domain" class="input" name="domain" type="text" maxlength="20" minlength="3" :delay="500" :disabled="!isNew || props.lock"/>
            </div>
            <div class="control">
              <div class="select">
                <Field v-model="domainInfo.tld" name="type" as="select" :disabled="!isNew || props.lock">
                  <option v-for="value in domainlist" :key="`tld-${value}`" :value="value">.{{ value }}</option>
                </Field>
              </div>
            </div>
            <div class="control">
              <button class="button is-info" type="button" :disabled="!isNew || props.lock" @click="domainInfo!!.domain = randomAddr()">
                랜덤 생성
              </button>
            </div>
          </div>
          <ErrorMessage name="uid" as="p" class="help is-danger"/>
          <p v-if="domainInfo.tld?.endsWith('.dev')" class="help is-warning">.dev TLD는 웹서비스에서 반드시 HTTPS로 접속되는 도메인입니다. 사용하실 때 주의가 필요합니다.</p>
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
            <Field v-model="domainInfo.expires" class="input" name="expires_in" type="date" :disabled="props.lock"/>
          </div>
          <ErrorMessage name="expires_in" as="p" class="help is-danger"/>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button type="submit" class="button is-link" :disabled="status == Status.PENDING || props.lock">{{ props.submitText }}</button>
      </div>
      <div class="control">
        <button type="reset" class="button is-link is-light" :disabled="status == Status.PENDING || props.lock">취소</button>
      </div>
    </div>
  </Form>
</template>

<style scoped>

</style>