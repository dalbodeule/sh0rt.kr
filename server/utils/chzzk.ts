const CHZZK_API_URL = 'https://openapi.chzzk.naver.com';
const CHZZK_USER_AGENT = 'sh0rt.kr OAuth client';

export interface IChzzkData<T> {
  code: number;
  message: string | null;
  content: T;
}

export interface IChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl?: string;
  followerCount?: number;
  verifiedMark?: boolean;
}

export const getChzzkUserInfo = async (
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<IChzzkData<{ data: IChzzkChannel[] }>> => {
  const response = await fetch(
    `${CHZZK_API_URL}/open/v1/channels?channelIds=${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': CHZZK_USER_AGENT,
        'Client-Id': clientId,
        'Client-Secret': clientSecret,
      },
    }
  );
  if (!response.ok) throw new Error(`CHZZK channel request failed: ${response.status}`);
  return (await response.json()) as IChzzkData<{ data: IChzzkChannel[] }>;
};
