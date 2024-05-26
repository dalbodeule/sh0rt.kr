<script setup lang="ts">
import { useAsyncData } from "#app";

import type { IAnalyticsResponse } from "~/server/routes/api/analytics/[uid].get";
import {GChart} from "vue-google-charts";
const route = useRoute()
const config = useRuntimeConfig()

const uid = route.params.uid as string

const event = useRequestEvent()
const cloudflare = event?.context!!.cloudflare!!

const aggregateCountryData = (response: IAnalyticsResponse): [string, string|number][] => {
  const countryCount: { [country: string]: number } = {}
  let result: [string, string|number][] = [['Country', 'Access count']]

  response.data.forEach(item => {
    if (countryCount[item.country]) {
      countryCount[item.country]++
    } else {
      countryCount[item.country] = 1
    }
  })

  result = result.concat(Object.entries(countryCount).map(([country, count]) => [country, count]))
  return result
}

const {data, error } = await useAsyncData(
  'API_FORWARD_UID', async (): Promise<IAnalyticsResponse> => {
      if (process.client || process.dev)
        return await $fetch(`${config.public.baseUrl}/api/analytics/${uid}`, {
          method: 'GET'
        })
      else {
        const data =  await cloudflare.env.SELF.fetch(`${config.public.baseUrl}/api/analytics/${uid}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET'
        })
        return await data.json()
      }
    }
)

let countryData = {}
if(data.value) {
  countryData = aggregateCountryData(data.value)
}

</script>

<template>
  <div class="box content">
    <h1>{{config.public.baseUrl}}/{{uid}} 의 접속통계</h1>
    <GChart type="GeoChart" :data="countryData" :settings="{ packages: ['geochart']}"/>
    <div style="min-height: 20em;"/>
  </div>
</template>

<style scoped>

</style>