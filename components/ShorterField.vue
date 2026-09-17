<script setup lang="ts">
import { ErrorMessage, Field, Form, configure, defineRule } from 'vee-validate';
import { alpha_num, min, max, required, url } from '@vee-validate/rules';
import { localize, setLocale } from '@vee-validate/i18n';

import ko from '@vee-validate/i18n/dist/locale/ko.json';
import en from '@vee-validate/i18n/dist/locale/en.json';
import ja from '@vee-validate/i18n/dist/locale/ja.json';
import type { IUIDPostRequest } from '~/server/routes/api/forward/index.post';
import getDate from '~/common/getDate';
import type { Ref } from 'vue';
import { Status } from '~/common/enums';
import dayjs from 'dayjs';
import randomAddr from '~/common/randomAddr';
import { reservedPaths } from '~/common/reservedPaths';

const config = useRuntimeConfig();
const { t } = useI18n();
const { locale } = useI18n();

const emit = defineEmits<{ submit: [] }>();
const props = defineProps<{ submitText: string; isNew: boolean; lock: boolean }>();

// datetime picker default value
// https://futurestud.io/tutorials/vue-js-3-bind-a-value-to-an-html-datetime-input
const addrInfo: Ref<IUIDPostRequest> =
  inject('addrInfo') ??
  ref({
    uid: '',
    forward: '',
    expires: dayjs().add(3, 'year').format('YYYY-MM-DD'),
    token: '',
  });
const status: Ref<Status> = inject('status') ?? ref(Status.DEFAULT);
const minExpirationDate = dayjs(getDate(6)).format('YYYY-MM-DD');
const maxExpirationDate = dayjs().add(3, 'year').format('YYYY-MM-DD');

defineRule('alpha_num', alpha_num);
defineRule('min', min);
defineRule('max', max);
defineRule('required', required);
defineRule('url', url);
defineRule('unique', async (value: string) => {
  if (!value) return true;
  if (reservedPaths.has(value.toLowerCase())) return false;

  try {
    const data = await $fetch(`${config.public.baseUrl}/api/forward/${value}`, {
      method: 'GET',
    });
    return !data;
  } catch {
    return true;
  }
});
defineRule('after_days', (value: string, [days = 7]: [number?]) => {
  if (!value) return true;
  const selectedDate = new Date(value);
  const currentDate = getDate(days);

  return selectedDate.getTime() >= currentDate.getTime();
});
defineRule('before_years', (value: string, [years = 3]: [number?]) => {
  if (!value) return true;
  const selectedDate = dayjs(value).endOf('day');
  const maximumDate = dayjs().add(years, 'year').endOf('day');

  return selectedDate.isValid() && !selectedDate.isAfter(maximumDate);
});

configure({
  generateMessage: localize({
    ko,
    en,
    ja,
  }),
});

localize({
  ko: {
    names: {
      uid: '단축주소',
      origin: '원본주소',
      expires_in: '만료일',
    },
  },
  en: {
    names: {
      uid: 'Shorted address',
      origin: 'Origin address',
      expires_in: 'Expire date',
    },
  },
  ja: {
    names: {
      uid: '短縮リンク',
      origin: '元のURL',
      expires_in: '有効期限',
    },
  },
});

watchEffect(() => setLocale(locale.value));

const schema = {
  uid: { alpha_num: true, min: 3, max: 20, required: true, unique: props.isNew },
  origin: { url: true, required: true },
  expires_in: { required: true, after_days: 6, before_years: 3 },
};
</script>

<template>
  <Form class="space-y-6" :validation-schema="schema" @submit="emit('submit')">
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-800" for="short-uid">{{
        t('shorter.short')
      }}</label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="flex min-w-0 flex-1">
          <span
            class="flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500"
            >{{ config.public.baseUrl }}/</span
          ><Field
            id="short-uid"
            v-model="addrInfo.uid"
            class="min-w-0 flex-1 rounded-r-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            name="uid"
            type="text"
            maxlength="20"
            minlength="3"
            :delay="500"
            :disabled="!isNew || props.lock"
            autocomplete="off"
          />
        </div>
        <button
          class="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          type="button"
          :disabled="!isNew || props.lock"
          @click="addrInfo.uid = randomAddr()"
        >
          {{ t('shorter.random') }}
        </button>
      </div>
      <ErrorMessage name="uid" as="p" class="mt-1.5 text-sm text-red-600" />
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-800" for="short-origin">{{
        t('shorter.original')
      }}</label
      ><Field
        id="short-origin"
        v-model="addrInfo.forward"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        name="origin"
        type="url"
        :placeholder="t('shorter.placeholder')"
        maxlength="4096"
        minlength="10"
        :disabled="props.lock"
        autocomplete="url"
      /><ErrorMessage name="origin" as="p" class="mt-1.5 text-sm text-red-600" />
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-800" for="short-expires">{{
        t('shorter.expires')
      }}</label
      ><Field
        id="short-expires"
        v-model="addrInfo.expires"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
        name="expires_in"
        type="date"
        :min="minExpirationDate"
        :max="maxExpirationDate"
        :disabled="props.lock"
      /><ErrorMessage name="expires_in" as="p" class="mt-1.5 text-sm text-red-600" />
    </div>
    <div class="flex justify-end overflow-x-auto">
      <NuxtTurnstile v-model="addrInfo.token" :options="{ theme: 'light', size: 'flexible' }" />
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="reset"
        class="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        :disabled="status === Status.PENDING || props.lock"
      >
        {{ t('shorter.reset') }}</button
      ><button
        type="submit"
        class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="status === Status.PENDING || !addrInfo.token || props.lock"
      >
        {{ status === Status.PENDING ? t('manage.loading') : props.submitText }}
      </button>
    </div>
  </Form>
</template>

<style scoped></style>
