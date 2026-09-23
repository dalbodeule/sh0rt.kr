<script lang="ts" setup>
import { UserRole } from '~/common/userRole';

const { loggedIn, user, fetch: fetchUserSession } = useUserSession();

(async () => {
  await fetchUserSession();

  if (
    !loggedIn.value ||
    !(user.value?.role === UserRole.MODERATOR || user.value?.role === UserRole.ADMIN)
  ) {
    return navigateTo('/');
  }

  return navigateTo('/admin/user');
})();
</script>
