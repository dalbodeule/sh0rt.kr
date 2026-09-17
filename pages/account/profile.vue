<script setup lang="ts">
const { loggedIn, user, fetch: fetchUserSession } = useUserSession();
const { t } = useI18n();
const { $csrfFetch } = useNuxtApp();

if (!loggedIn.value) await navigateTo('/login');

const name = ref(user.value?.name ?? '');
const saving = ref(false);
const saved = ref(false);
const errorMessage = ref('');

const save = async () => {
  saving.value = true;
  saved.value = false;
  errorMessage.value = '';

  try {
    await $csrfFetch('/api/account/profile', {
      method: 'PATCH',
      body: { name: name.value },
    });
    await fetchUserSession();
    saved.value = true;
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('profile.error');
  } finally {
    saving.value = false;
  }
};

useSeoMeta({
  title: `sh0rt.kr :: ${t('profile.title')}`,
  description: t('profile.description'),
  robots: { all: false },
});
</script>

<template>
  <main class="mx-auto max-w-2xl py-4 sm:py-8">
    <header class="mb-6">
      <p class="text-sm font-semibold text-blue-600">ACCOUNT SETTINGS</p>
      <h1 class="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {{ t('profile.title') }}
      </h1>
      <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('profile.description') }}</p>
    </header>

    <form
      class="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      @submit.prevent="save"
    >
      <div class="flex items-center gap-4 border-b border-slate-100 pb-6">
        <img class="h-14 w-14 rounded-2xl bg-slate-100" :src="user?.profile" :alt="user?.name" />
        <div>
          <p class="font-bold text-slate-950">{{ user?.name }}</p>
          <p class="text-sm text-slate-500">{{ user?.email }}</p>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-800" for="profile-name">
          {{ t('profile.name') }}
        </label>
        <input
          id="profile-name"
          v-model="name"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          name="name"
          type="text"
          maxlength="20"
          required
          autocomplete="nickname"
        />
        <p class="mt-1.5 text-sm text-slate-500">{{ t('profile.nameHelp') }}</p>
      </div>

      <div class="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p class="font-semibold text-slate-800">{{ t('profile.email') }}</p>
        <p class="mt-1">{{ t('profile.emailHelp') }}</p>
      </div>

      <p v-if="saved" class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
        {{ t('profile.saved') }}
      </p>
      <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end">
        <button
          class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          :disabled="saving || !name.trim()"
        >
          {{ saving ? t('profile.saving') : t('profile.save') }}
        </button>
      </div>
    </form>
  </main>
</template>
