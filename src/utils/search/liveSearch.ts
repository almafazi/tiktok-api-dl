import { fetch } from "undici"
import { _tiktokSearchLiveFull } from "../../constants/api"
import { _liveSearchParams } from "../../constants/params"
import {
  LiveInfo,
  Owner,
  OwnerStats,
  LiveSearchResult,
  TiktokLiveSearchResponse
} from "../../types/search/liveSearch"
import { ERROR_MESSAGES } from "../../constants"
import { createDispatcher } from "../proxy"

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"

const formatCookie = (cookie: string | any[]): string =>
  Array.isArray(cookie)
    ? cookie.map((v: any) => `${v.name}=${v.value}`).join("; ")
    : cookie

export const SearchLive = async (
  keyword: string,
  cookie: string | any[],
  page: number = 1,
  proxy?: string
): Promise<TiktokLiveSearchResponse> => {
  try {
    if (!cookie) {
      return { status: "error", message: ERROR_MESSAGES.COOKIE_REQUIRED }
    }

    const res = await fetch(_tiktokSearchLiveFull(_liveSearchParams(keyword, page)), {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        cookie: formatCookie(cookie)
      },
      ...createDispatcher(proxy)
    })

    const data = await res.json() as any

    if (data.status_code === 2483) {
      return { status: "error", message: ERROR_MESSAGES.INVALID_COOKIE }
    }
    if (data.status_code !== 0) {
      return { status: "error", message: data.status_msg || "TikTok API error" }
    }
    if (!data.data) {
      return { status: "error", message: "No live streams found!" }
    }

    const result: LiveSearchResult[] = data.data.map((v: any) => {
      const content = JSON.parse(v.live_info.raw_data)

      const liveInfo: LiveInfo = {
        id: content.id,
        title: content.title,
        cover: content.cover?.url_list || [],
        squareCover: content.square_cover_img?.url_list || [],
        rectangleCover: content.rectangle_cover_img?.url_list || [],
        liveTypeThirdParty: content.live_type_third_party,
        hashtag: content.hashtag?.title || "",
        startTime: content.start_time,
        stats: {
          totalUser: content.stats.total_user,
          viewerCount: content.user_count,
          likeCount: content.like_count
        },
        owner: {
          uid: content.owner.id,
          nickname: content.owner.nickname,
          username: content.owner.display_id,
          signature: content.owner.bio_description,
          avatarThumb: content.owner.avatar_thumb?.url_list || [],
          avatarMedium: content.owner.avatar_medium?.url_list || [],
          avatarLarge: content.owner.avatar_large?.url_list || [],
          modifyTime: content.owner.modify_time,
          stats: {
            followingCount: content.owner.follow_info.following_count,
            followerCount: content.owner.follow_info.follower_count
          } as OwnerStats,
          isVerified:
            content.owner?.authentication_info?.custom_verify === "verified account" || false
        } as Owner
      }

      return {
        roomInfo: {
          hasCommerceGoods: v.live_info.room_info.has_commerce_goods,
          isBattle: v.live_info.room_info.is_battle
        },
        liveInfo
      }
    })

    if (!result.length) {
      return { status: "error", message: "No live streams found!" }
    }

    return { status: "success", result, page, totalResults: result.length }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to search live streams"
    }
  }
}
