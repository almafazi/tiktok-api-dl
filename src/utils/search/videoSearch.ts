import { fetch } from "undici"
import { _tiktokSearchVideoFull } from "../../constants/api"
import { _videoSearchParams } from "../../constants/params"
import retry from "async-retry"
import {
  TiktokVideoSearchResponse,
  AuthorVideoSearch,
  MusicVideoSearch,
  VideoSearch,
  VideoSearchResult,
  StatisticsVideoSearch
} from "../../types/search/videoSearch"
import { ERROR_MESSAGES } from "../../constants"
import { createDispatcher } from "../proxy"

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"

const formatCookie = (cookie: string | any[]): string =>
  Array.isArray(cookie)
    ? cookie.map((v: any) => `${v.name}=${v.value}`).join("; ")
    : cookie

export const SearchVideo = async (
  keyword: string,
  cookie: string | any[],
  page: number = 1,
  proxy?: string
): Promise<TiktokVideoSearchResponse> => {
  try {
    if (!cookie) {
      return { status: "error", message: ERROR_MESSAGES.COOKIE_REQUIRED }
    }

    const data = await requestVideoSearch(keyword, page, cookie, proxy)

    if (data.status_code === 2483) {
      return { status: "error", message: ERROR_MESSAGES.INVALID_COOKIE }
    }
    if (data.status_code !== 0) {
      return { status: "error", message: data.status_msg || "TikTok API error" }
    }
    if (!data.item_list) {
      return { status: "error", message: "No videos found!" }
    }

    const result: VideoSearchResult[] = data.item_list.map((v: any) => ({
      id: v.id,
      desc: v.desc,
      createTime: v.createTime,
      author: {
        id: v.author.id,
        uniqueId: v.author.uniqueId,
        nickname: v.author.nickname,
        avatarThumb: v.author.avatarThumb,
        avatarMedium: v.author.avatarMedium,
        avatarLarger: v.author.avatarLarger,
        signature: v.author.signature,
        verified: v.author.verified,
        secUid: v.author.secUid,
        openFavorite: v.author.openFavorite,
        privateAccount: v.author.privateAccount,
        isADVirtual: v.author.isADVirtual,
        tiktokSeller: v.author.ttSeller,
        isEmbedBanned: v.author.isEmbedBanned
      } as AuthorVideoSearch,
      stats: {
        likeCount: v.stats.diggCount,
        shareCount: v.stats.shareCount,
        commentCount: v.stats.commentCount,
        playCount: v.stats.playCount,
        collectCount: v.stats.collectCount
      } as StatisticsVideoSearch,
      video: {
        id: v.video.id,
        ratio: v.video.ratio,
        cover: v.video.cover,
        originCover: v.video.originCover,
        dynamicCover: v.video.dynamicCover,
        playAddr: v.video.playAddr,
        downloadAddr: v.video.downloadAddr,
        format: v.video.format
      } as VideoSearch,
      music: {
        id: v.music.id,
        title: v.music.title,
        playUrl: v.music.playUrl,
        coverThumb: v.music.coverThumb,
        coverMedium: v.music.coverMedium,
        coverLarge: v.music.coverLarge,
        authorName: v.music.authorName,
        original: v.music.original,
        album: v.music.album,
        duration: v.music.duration,
        isCopyrighted: v.music.isCopyrighted
      } as MusicVideoSearch
    }))

    if (!result.length) {
      return { status: "error", message: "No videos found!" }
    }

    return { status: "success", result, page, totalResults: result.length }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to search videos"
    }
  }
}

const requestVideoSearch = async (
  keyword: string,
  page: number,
  cookie: string | any[],
  proxy?: string
): Promise<any> => {
  return retry(
    async () => {
      const res = await fetch(
        _tiktokSearchVideoFull(_videoSearchParams(keyword, page)),
        {
          method: "GET",
          headers: {
            "User-Agent": USER_AGENT,
            cookie: formatCookie(cookie)
          },
          ...createDispatcher(proxy)
        }
      )

      if (!res.ok) throw new Error("Empty response")
      const data = await res.json() as any
      return data
    },
    {
      retries: 10,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2
    }
  )
}
