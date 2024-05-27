<script setup lang="ts">
import {useAsyncData} from "#app";
import wait from "~/common/wait";
import {Status} from "~/common/enums";
import type {Ref} from "vue";
import type {IUIDGetResponse} from "~/server/routes/api/forward/[uid].get"
import { parseHTML } from 'linkedom'

const status: Ref<Status> = ref(Status.DEFAULT)

const route = useRoute()
const router = useRouter()
const uid = route.params.uid as string
const config = useRuntimeConfig()

const event = useRequestEvent()
const cloudflare = event?.context!!.cloudflare!!

const {data, error } = await useAsyncData(
  'API_FORWARD_UID', async (): Promise<IUIDGetResponse> => {
      if (process.client || process.dev)
        return await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
          method: 'GET'
        })
      else {
        const data =  await cloudflare.env.SELF.fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET'
        })
        return await data.json()
      }
    }
)

async function fetchAndParseOGTags(url: string) {
  try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = parseHTML(html);
      const metas = dom.window.document.head.querySelectorAll('meta[property^="og:"]');

      const ogTags: { [key: string]: string } = {};
      metas.forEach(meta => {
        const property = meta.getAttribute('property') ?? 'a'
        ogTags[property] = meta.getAttribute('content') ?? ''
      })

      return ogTags;
  } catch (error) {
      console.error("Error fetching or parsing:", error);
      return null;
  }
}

if (error.value || data.value && data.value.forward) {
  status.value = Status.ERROR
  throw createError({
    statusCode: 404,
    message: "Page not found",
    fatal: true
  })
}
else status.value = Status.SUCCESS

const ogData = await fetchAndParseOGTags(data.value?.forward ?? '')
if (ogData)
  useSeoMeta({
    title: ogData['og:title'] ?? '',
    description: ogData['og:description'] ?? '',
    robots: {all: false},
    ogType: ogData['og:type'] ?? 'website',
    ogSiteName: ogData['og:siteName'] ?? '',
    ogImage: ogData['og:image'] ?? '',
  })

if (process.client) {
  if(data.value && data.value.forward) {
    useHead({
      title: `sh0rt.kr :: forward :: ${uid}`,
    })
    await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {method: 'PUT'})
    await wait(3000)
    router.push(data.value.forward)
  } else {
    throw createError({
      statusCode: 404,
      message: "Page not found",
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
      <h3>이동할 주소: {{ data?.forward }}</h3>
    </template>
    <template v-else-if="status == Status.ERROR">
      <h1>데이터를 찾을 수 없습니다.</h1>
    </template>
  </div>
</template>

<style scoped>

</style>