<script setup lang="ts">
import { useAsyncData } from "#app";
import wait from "~/common/wait";
import { Status } from "~/common/enums";
import type { Ref } from "vue";
import type { IUIDGetResponse } from "~/server/routes/api/forward/[uid].get"
import dayjs from "dayjs";

const status: Ref<Status> = ref(Status.DEFAULT)

const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const router = useRouter()
const uid = route.params.uid as string
const config = useRuntimeConfig()

const event = useRequestEvent()
const cloudflare = event?.context!.cloudflare

const { data: forwardData, error: forwardError } = await useAsyncData('API_FORWARD_UID', async (): Promise<IUIDGetResponse> => {
      if (import.meta.client || import.meta.dev)
        return await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
          method: 'GET'
        })
      else {
        try {
          const p =  await cloudflare.env.SELF.fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'GET'
          })

          const data = await p.json()
          return data
        } catch(e) {
          console.error(e)
          throw e
        }
      }
    }
  )

if (forwardError.value) {
  status.value = Status.ERROR
  throw createError({
    statusCode: 403,
    message: "Fatal error on fetch",
    stack: Object.values(forwardError.value).join('/'),
    fatal: true
  })
}
else status.value = Status.SUCCESS

const { data: ogData, error: _ogError } = await useAsyncData('OG_FINDING', async(): Promise<{[key: string]: string}> => {
  if(import.meta.client || import.meta.dev)
    return await $fetch(`${config.public.baseUrl}/api/opengraph`, {
      method: 'POST', body: JSON.stringify({ url: forwardData.value?.forward })
    })
  else {
    try {
      const p =  await cloudflare.env.SELF.fetch(`${config.public.baseUrl}/api/opengraph`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: forwardData.value?.forward }),
        method: 'POST'
      })

      return await p.json()
    } catch(e) {
      console.error(e)
      throw e
    }
  }
})

if (ogData.value)
  useSeoMeta({
    title: ogData.value['og:title'] ?? '',
    description: ogData.value['og:description'] ?? '',
    robots: {all: false},
    ogType: ogData.value['og:type'] ?? 'website',
    ogSiteName: ogData.value['og:site_name'] ?? '',
    ogImage: ogData.value['og:image'] ?? '',
  })

if (import.meta.client) {
  if(forwardData.value && forwardData.value.forward) {
    useHead({
      title: `sh0rt.kr :: forward :: ${uid}`,
    })
    await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {method: 'PUT'})
    await wait(3000)
    window.location.href = forwardData.value.forward
  } else {
    throw createError({
      statusCode: 404,
      message: "Not found",
      stack: Object.values(forwardData.value ?? {}).join('/'),
      fatal: true
    })
  }
}
</script>

<template>
  <div class="box content">
    <template v-if="status == Status.SUCCESS">
      <h1>잠시 후 이동합니다.</h1>
      <br>
      <table class="table is-fullwidth is-striped">
        <tbody>
          <tr>
            <td>주소</td>
            <td>{{ forwardData?.forward }}</td>
          </tr>
          <tr>
            <td>만든사람</td>
            <td>{{ forwardData?.user.name}}</td>
          </tr>
          <tr>
            <td>만료일</td>
            <td>{{ dayjs(forwardData?.expires).format("YYYY-MM-DD") }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else-if="status == Status.ERROR">
      <h1>데이터를 찾을 수 없습니다.</h1>
    </template>
  </div>
</template>

<style scoped>

</style>