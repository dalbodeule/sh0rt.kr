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
const emit = defineEmits<{
  'remove': [number],
  'update': [number, { type: string, name: string, value: string }]
}>()
const isSRVWizardActive = ref(false)

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

const updateRecord = (newRecord: { type: string, name: string, value: string }) => {
  console.log(newRecord)
  emit('update', props.index, newRecord)
}

watch(() => props.record, (newRecord) => {
  emit('update', props.index, newRecord);
}, { deep: true });

</script>

<template>
  <Form class="box" :validation-schema="schema">
    <div class="field">
      <label class="label">레코드 타입</label>
      <div class="select">
        <Field name="type" as="select" v-model="record.type">
          <option value="A">A</option>
          <option value="AAAA">AAAA</option>
          <option value="CNAME">CNAME</option>
          <option value="SRV">SRV</option>
          <option value="TXT">TXT</option>
        </Field>
      </div>
      <ErrorMessage name="type" as="p" class="help is-danger" />
    </div>
    <div class="field">
      <label class="label">레코드 이름</label>
      <div class="control">
        <Field class="input" name="name" as="input" type="text" v-model="record.name" placeholder="Enter record name" :disabled="record.type == 'SRV'"/>
      </div>
      <ErrorMessage name="name" as="p" class="help is-danger" />
    </div>

    <div class="field">
      <label class="label">레코드 값</label>
      <div class="control">
        <Field class="input" name="value" as="input" type="text" v-model="record.value" placeholder="Enter record value" :disabled="record.type == 'SRV'" />
      </div>
      <ErrorMessage name="value" as="p" class="help is-danger" />
    </div>
    <div class="field is-grouped">
      <div class="control" v-if="record.type == 'SRV'">
        <button class="button is-primary" type="button" @click="isSRVWizardActive = true">SRV 레코드 설정</button>
      </div>
      <div class="control">
        <button class="button is-danger" @click="emit('remove', index)">제거</button>
      </div>
    </div>
    <SRVRecordWizard
      :modal-value="record"
      :isActive="isSRVWizardActive"
      @update="updateRecord"
      @close="isSRVWizardActive = false"
    />
  </Form>
</template>
