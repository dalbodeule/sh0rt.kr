<script setup lang="ts">
import type {Ref} from "vue";
import { configure, defineRule, ErrorMessage, Field, Form } from "vee-validate";
import { integer, max, min, required, alpha_num } from "@vee-validate/rules";
import { localize } from "@vee-validate/i18n";
import ko from "@vee-validate/i18n/dist/locale/ko.json";
import en from "@vee-validate/i18n/dist/locale/en.json";

interface SRVStruct {
  service: string,
  protocol: string,
  name: string,
  priority: number,
  weight: number,
  port: number,
  target: string
}

const props = defineProps<{
  modalValue: { type: string, name: string, value: string},
  isActive: boolean
}>()
const emit = defineEmits<{
  update: [{ type: string, name: string, value: string}],
  close: []
}>()
const selectedAlias = ref('')

const aliases: { [key: string]: SRVStruct} = {
  minecraft: {
    service: '_minecraft',
    protocol: '_tcp',
    name: '',
    priority: 0,
    weight: 5,
    port: 25565,
    target: ''
  },
  factrio: {
    service: '_factrio',
    protocol: '_tcp',
    name: '',
    priority: 0,
    weight: 5,
    port: 34197,
    target: ''
  }
}

const srvDetails: Ref<SRVStruct> = ref({
  service: '',
  protocol: '',
  name: '',
  priority: 0,
  weight: 5,
  port: 0,
  target: ''
})

const applyAlias = () => {
  const key = selectedAlias.value as string
  if(aliases[key]) {
    srvDetails.value = aliases[key]
  }
}

const saveChanges = () => {
  emit('update', {
    type: props.modalValue.type,
    name: `${srvDetails.value.service}.${srvDetails.value.protocol}.${srvDetails.value.name}`,
    value: `${srvDetails.value.priority} ${srvDetails.value.weight} ${srvDetails.value.port} ${srvDetails.value.target}.`
  })
  emit('close')
}

defineRule('alpha_num', alpha_num)
defineRule('integer', integer)
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
      service: '서비스',
      protocol: '프로토콜',
      name: '이름',
      priority: 'Priority',
      weight: 'Weight',
      port: '포트',
      target: '포워딩 주소'
    }
  },
  en: {
    names: {
      service: 'Service',
      protocol: 'Protocol',
      name: 'Name',
      priority: 'Priority',
      weight: 'Weight',
      port: 'Port',
      target: 'Forward address'
    }
  }
})

const schema = {
  service: { required: true },
  protocol: { required: true },
  name: { alpha_num: true },
  priority: { required: true, integer: true },
  weight: { required: true, integer: true },
  port: { required: true, integer: true },
  target: { required: true }
}

const setValues = (newVal: { type: string, name: string, value: string }) => {
  if(newVal.type == 'SRV') {
    const [part1, part2] = [newVal.name?.split('.'), newVal.value?.split(' ')]
    if(Array.isArray(part1) && Array.isArray(part2)) {
      srvDetails.value = {
        service: part1[0],
        protocol: part1[1],
        name: part1[2],
        priority: parseInt(part2[0]),
        weight: parseInt(part2[1]),
        port: parseInt(part2[2]),
        target: part2[3]
      }

      srvDetails.value.target = srvDetails.value.target.replace(/(\.+)$/gm, '')
    }
  } else {
    srvDetails.value = {
      service: '',
      protocol: '',
      name: '',
      priority: 0,
      weight: 5,
      port: 0,
      target: ''
    }
  }
}

watch(() => props.modalValue, (newVal) => {
  setValues(newVal)
}, { deep: true })
setValues(props.modalValue)
</script>

<template>
  <div class="modal" :class="isActive ? 'is-active' : ''">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">SRV 레코드 마법사</p>
        <button class="delete" aria-label="close" type="button" @click="emit('close')"></button>
      </header>
      <section class="modal-card-body">
        <Form :validation-schema="schema" @submit="saveChanges">
          <div class="field">
            <label class="label">서비스 선택</label>
            <div class="control">
              <div class="select">
                <select v-model="selectedAlias" @change="applyAlias">
                  <option value="">Select service</option>
                  <option value="minecraft">마인크래프트</option>
                  <option value="factorio">팩토리오</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">서비스</label>
            <div class="control">
              <Field name="service" class="input" type="text" placeholder="Enter service" v-model="srvDetails.service" />
              <ErrorMessage name="service" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">프로토콜</label>
            <div class="control">
              <Field name="protocol" class="input" type="text" placeholder="Enter protocol" v-model="srvDetails.protocol" />
              <ErrorMessage name="protocol" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">서브도메인</label>
            <div class="control">
              <Field name="name" class="input" type="text" placeholder="Enter name" v-model="srvDetails.name" />
              <ErrorMessage name="name" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">Priority</label>
            <div class="control">
              <Field name="priority" class="input" type="number" placeholder="Enter priority" v-model="srvDetails.priority" />
              <ErrorMessage name="priority" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">Weight</label>
            <div class="control">
              <Field name="weight" class="input" type="number" placeholder="Enter weight" v-model="srvDetails.weight" />
              <ErrorMessage name="weight" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">포트</label>
            <div class="control">
              <Field name="port" class="input" type="number" placeholder="Enter port" v-model="srvDetails.port" />
              <ErrorMessage name="port" class="help is-danger" />
            </div>
          </div>

          <div class="field">
            <label class="label">포워딩 주소</label>
            <div class="control">
              <Field name="target" class="input" type="text" placeholder="Enter target" v-model="srvDetails.target" />
              <ErrorMessage name="target" class="help is-danger" />
            </div>
          </div>

          <footer class="modal-card-foot">
            <div class="field is-grouped">
              <div class="control">
                <button class="button is-success" type="submit">저장하기</button>
              </div>
              <div class="control">
                <button class="button" type="button" @click="emit('close')">취소</button>
              </div>
            </div>
          </footer>
        </Form>
      </section>
    </div>
  </div>
</template>

<style scoped>

</style>