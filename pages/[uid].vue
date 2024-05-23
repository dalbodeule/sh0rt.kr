<script setup lang="ts">
import type {IUIDGetResponse} from "~/server/routes/api/[uid].get";
import type {Ref} from "vue";

const route = useRoute()
const router = useRouter()
const uid = route.params.uid as string

const data: Ref<IUIDGetResponse> = ref({
  id: 0,
  uid: '',
  forward: '',
  user: 0,
  created_at: new Date(),
  updated_at: new Date(),
  expires: new Date()
})

const request = async (uid: string) => {
  data.value = await $fetch(`/api/forward/${uid}`, {
    method: 'GET',
  })
}

const wait = (time: number): Promise<void> => new Promise((resolve, reject) => {
  setTimeout(() => resolve(), time);
});

(async () => {
  await request(uid)

  await wait(3000)

  window.location.href = data.value.forward
})()

</script>

<template>
  <div class="container box" style="min-height: 80vh">
    <h1>잠시 후 이동합니다.</h1>
  </div>
</template>

<style scoped>

</style>