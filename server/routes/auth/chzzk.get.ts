import { deleteCookie, getCookie, getQuery, getRequestURL, sendRedirect, setCookie } from 'h3';
import handleLoginUser from '~/server/routes/handleLoginUser';
import { getChzzkUserInfo } from '~/server/utils/chzzk';

const STATE_COOKIE = 'chzzk-oauth-state';
const AUTH_URL = 'https://chzzk.naver.com/account-interlock';
const TOKEN_URL = 'https://openapi.chzzk.naver.com/auth/v1/token';
const USER_URL = 'https://openapi.chzzk.naver.com/open/v1/users/me';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event).oauth.chzzk as {
    clientId?: string;
    clientSecret?: string;
  };
  if (!config.clientId || !config.clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'CHZZK OAuth is not configured' });
  }

  const query = getQuery(event);
  const redirectUri = `${getRequestURL(event).origin}/auth/chzzk`;
  const state = getCookie(event, STATE_COOKIE);
  const code = typeof query.code === 'string' ? query.code : undefined;
  const callbackState = typeof query.state === 'string' ? query.state : undefined;
  if (!code) {
    if (typeof query.error === 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'CHZZK OAuth authorization was rejected',
      });
    }
    const nextState = crypto.randomUUID();
    setCookie(event, STATE_COOKIE, nextState, {
      httpOnly: true,
      sameSite: 'lax',
      secure: getRequestURL(event).protocol === 'https:',
      maxAge: 600,
      path: '/auth/chzzk',
    });
    const authorization = new URL(AUTH_URL);
    authorization.search = new URLSearchParams({
      clientId: config.clientId,
      redirectUri,
      state: nextState,
    }).toString();
    return sendRedirect(event, authorization.toString());
  }
  if (!state || callbackState !== state) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid CHZZK OAuth state' });
  }
  deleteCookie(event, STATE_COOKIE, { path: '/auth/chzzk' });

  const tokenResponse = await $fetch<{
    accessToken?: string;
    content?: { accessToken?: string };
  }>(TOKEN_URL, {
    method: 'POST',
    body: {
      grantType: 'authorization_code',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      state,
    },
  });
  const token = tokenResponse.content ?? tokenResponse;
  if (!token.accessToken)
    throw createError({ statusCode: 502, statusMessage: 'Could not get CHZZK token' });
  const profileResponse = await $fetch<{
    channelId?: string;
    channelName?: string;
    content?: { channelId?: string; channelName?: string };
  }>(USER_URL, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  const profile = profileResponse.content ?? profileResponse;
  if (!profile.channelId || !profile.channelName) {
    throw createError({ statusCode: 502, statusMessage: 'Could not get CHZZK profile' });
  }
  let channelImageUrl: string | undefined;
  try {
    const channelResponse = await getChzzkUserInfo(
      profile.channelId,
      config.clientId,
      config.clientSecret
    );
    channelImageUrl = channelResponse.content.data[0]?.channelImageUrl;
  } catch {
    console.warn('Could not get CHZZK channel image');
  }
  const accepted = await handleLoginUser(event, 'chzzk', {
    accountId: profile.channelId,
    email: `${profile.channelId}@chzzk.local`,
    name: profile.channelName,
    avatar_url: channelImageUrl || '/favicon.png',
  });
  return sendRedirect(event, accepted ? '/' : '/login?restricted=1');
});
