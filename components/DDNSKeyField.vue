<script setup lang="ts">
import { ErrorMessage, Field, Form, configure, defineRule } from "vee-validate"
import { alpha_num, min, max} from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

import ko from '@vee-validate/i18n/dist/locale/ko.json'
import en from '@vee-validate/i18n/dist/locale/en.json'

import type { Ref } from "vue";

const emit = defineEmits<{submit: []}>()
const props = defineProps<{lock: boolean}>()

const data: Ref<{ password: string, password2: string }> = inject('ddns') ?? ref({
  password: '', password2: ''
})

defineRule('alpha_num', alpha_num)
defineRule('min', min)
defineRule('max', max)
defineRule('confirm', (value: string, [target]: [string]) => {
  return value === target;
})

configure({
  generateMessage: localize({
    ko,
    en
  })
})

localize({
  ko: {
    names: {
      password: '비밀번호',
      password2: '비밀번호 확인'
    }
  },
  en: {
    names: {
      password: 'Password',
      password2: 'Password Confirm'
    }
  }
})

const schema = {
  password: { min: 8, max: 20 },
  password2: { confirm: '@password2'}
}

</script>

<template>
  <Form :validation-schema="schema" @submit="emit('submit')">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">비밀번호</label>
      </div>
      <div class="field-body">
        <div class="field is-expanded">
          <Field v-model="data.password" class="input" name="password" type="password" />
        </div>
        <ErrorMessage name="type" as="p" class="help is-danger" />
      </div>
    </div>
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">비밀번호 확인</label>
      </div>
      <div class="field-body">
        <div class="field is-expanded">
          <Field v-model="data.password2" class="input" name="password2" type="password" />
        </div>
        <ErrorMessage name="type" as="p" class="help is-danger" />
      </div>
    </div>
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button type="submit" class="button is-link" :disabled="props.lock">설정</button>
      </div>
      <div class="control">
        <button type="reset" class="button is-link is-light" :disabled="props.lock">취소</button>
      </div>
    </div>
  </Form>
</template>

<style scoped>

</style>