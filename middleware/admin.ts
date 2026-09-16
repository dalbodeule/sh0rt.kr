import { UserRole } from '~/common/userRole';

export default defineNuxtRouteMiddleware(async () => {
  const session = useUserSession();
  if (!session.ready.value) await session.fetch();
  if (!session.user.value || session.user.value.role < UserRole.MODERATOR) return navigateTo('/');
});
