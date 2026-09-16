<script lang="ts" setup>
import { UserRole } from '~/common/userRole';

const { loggedIn, user, fetch: fetchUserSession } = useUserSession();

(async () => {
  await fetchUserSession();

  if (
    !loggedIn ||
    !(user.value?.role === UserRole.MODERATOR || user.value?.role === UserRole.ADMIN)
  ) {
    navigateTo('/');
  }

  navigateTo('/admin/user');
})();
</script>
