<script setup lang="ts">
import { useAsyncData } from "#app";
import wait from "~/common/wait";
import {Status} from "~/common/enums";
import type {Ref} from "vue";
import type {IUIDGetResponse} from "~/server/routes/api/forward/[uid].get"

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

if (error.value) {
  status.value = Status.ERROR
  throw createError({
    statusCode: 404,
    message: error.value?.message ?? "",
    fatal: true
  })
}
else status.value = Status.SUCCESS

if (process.client) {
  await $fetch(`/api/forward/${uid}`, { method: 'PUT' })
  await wait(3000)
  window.location.href = data.value?.forward ?? ''
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