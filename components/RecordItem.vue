<script setup lang="ts">
import { configure, defineRule, ErrorMessage, Field, Form } from "vee-validate";
import { alpha_num, max, min, required } from "@vee-validate/rules";
import { localize } from "@vee-validate/i18n";
import ko from "@vee-validate/i18n/dist/locale/ko.json";
import en from "@vee-validate/i18n/dist/locale/en.json";

const props = defineProps<{
  record: { type: string, name: string, value: string},
  index: number
}>()
const emit = defineEmits<{ remove: [number], update: [] }>()

defineRule('alpha_num', alpha_num)
defineRule('min', min)
defineRule('max', max)
defineRule('required', required)

configure({
  generateMessage: localize({
    ko,
    en
  }),
});

localize({
  ko: {
    names: {
      type: '레코드 타입',
      name: '레코드 이름',
      value: '레코드 값'
    }
  },
  en: {
    names: {
      type: 'Record type',
      name: 'Record name',
      value: 'Record value'
    }
  }
})

const schema = {
  type: { required: true },
  name: { max: 20 },
  value: { required: true, min:7, max:1024 }
}


const onTypeChange = async () => {

}

</script>

<template>
  <Form class="box" :validation-schema="schema">
    <div class="field">
      <label class="label">레코드 타입</label>
      <div class="select">
        <Field name="type" as="select" v-model="record.type" @change="onTypeChange">
          <option>A</option>
          <option>AAAA</option>
          <option>CNAME</option>
          <option>SRV</option>
          <option>TXT</option>
        </Field>
      </div>
      <ErrorMessage name="type" as="p" class="help is-danger" />
    </div>

    <div class="field">
      <label class="label">레코드 이름</label>
      <div class="control">
        <Field class="input" name="name" as="input" type="text" v-model="record.name" placeholder="Enter record name" />
      </div>
      <ErrorMessage name="name" as="p" class="help is-danger" />
    </div>

    <div class="field">
      <label class="label">레코드 값</label>
      <div class="control">
        <Field class="input" name="value" as="input" type="text" v-model="record.value" placeholder="Enter record value" />
      </div>
      <ErrorMessage name="value" as="p" class="help is-danger" />
    </div>
    <button class="button is-danger" @click="emit('remove', index)">Remove</button>
  </Form>
</template>

<style scoped>

</style>