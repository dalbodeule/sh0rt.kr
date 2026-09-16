<script setup lang="ts">
import { setLocale } from '@vee-validate/i18n'
import dayjs from 'dayjs'
import { Status } from '~/common/enums'
import getDate from '~/common/getDate'
import type { IUIDPostRequest, IUIDPostResponse } from '~/server/routes/api/forward/index.post'

const { loggedIn } = useUserSession()
if (!loggedIn.value) await navigateTo('/')
const config = useRuntimeConfig()
const addrInfo = ref<IUIDPostRequest>({ uid: '', forward: '', expires: dayjs(getDate()).format('YYYY-MM-DD'), token: '' })
const status = ref(Status.DEFAULT)
const errorMessage = ref('')
const createdLink = ref<IUIDPostResponse>()
provide('addrInfo', addrInfo); provide('status', status)

const onSubmit = async () => {
  status.value = Status.PENDING; errorMessage.value = ''
  try {
    createdLink.value = await $fetch<IUIDPostResponse>('/api/forward', { method: 'POST', body: addrInfo.value })
    status.value = Status.SUCCESS
  }
  catch (error: unknown) { status.value = Status.ERROR; errorMessage.value = error instanceof Error ? error.message : '단축주소를 만들지 못했습니다.' }
}
useSeoMeta({ title: 'sh0rt.kr :: 링크 만들기', description: '새 단축주소 만들기', robots: { all: false } })
setLocale('ko')
</script>

<template>
  <main class="mx-auto max-w-3xl py-4 sm:py-8">
    <header class="mb-6"><p class="text-sm font-semibold text-blue-600">NEW SHORT LINK</p><h1 class="mt-1 text-3xl font-black tracking-tight text-slate-950">새 단축주소 만들기</h1><p class="mt-2 text-sm text-slate-500">원본주소와 원하는 경로, 만료일을 입력하세요.</p></header>
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><ShorterField submit-text="단축주소 만들기" :is-new="true" :lock="status === Status.SUCCESS" @submit="onSubmit" /></section>
    <div v-if="status === Status.SUCCESS && createdLink" class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><p class="font-bold">단축주소를 만들었습니다.</p><a class="mt-1 block break-all text-sm underline" :href="`${config.public.baseUrl}/${addrInfo.uid}`">{{ config.public.baseUrl }}/{{ addrInfo.uid }}</a><p class="mt-1 text-sm">만료일 {{ dayjs(addrInfo.expires).format('YYYY-MM-DD') }}</p><NuxtLink :to="`/manage/${createdLink.manage_id}`" class="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">관리 페이지 열기</NuxtLink></div>
    <QRCodeGenerator v-if="status === Status.SUCCESS" :value="`${config.public.baseUrl}/${addrInfo.uid}`" class="mt-5" />
    <p v-if="status === Status.ERROR" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p>
  </main>
</template>
