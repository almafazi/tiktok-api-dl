import { fetch } from "undici"
import { _tiktokSearchUserFull, _tiktokDesktopUrl } from "../../constants/api"
import {
  UserSearchResult,
  TiktokUserSearchResponse
} from "../../types/search/userSearch"
import { _userSearchParams } from "../../constants/params"
import { TiktokService } from "../../services/tiktokService"
import { webUserAgent } from "../../constants/headers"
import { ERROR_MESSAGES } from "../../constants"
import { createDispatcher } from "../proxy"

const formatCookie = (cookie: string | any[]): string =>
  Array.isArray(cookie)
    ? cookie.map((v: any) => `${v.name}=${v.value}`).join("; ")
    : cookie

export const SearchUser = async (
  username: string,
  cookie: string | any[],
  page: number = 1,
  proxy?: string
): Promise<TiktokUserSearchResponse> => {
  try {
    if (!cookie) {
      return { status: "error", message: ERROR_MESSAGES.COOKIE_REQUIRED }
    }

    const Tiktok = new TiktokService()
    const res = await fetch(Tiktok.generateURLXbogus(username, page), {
      method: "GET",
      headers: {
        "User-Agent": webUserAgent,
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
    if (!data.user_list) {
      return { status: "error", message: ERROR_MESSAGES.USER_NOT_FOUND }
    }

    const result: UserSearchResult[] = data.user_list.map((user: any) => ({
      uid: user.user_info.uid,
      username: user.user_info.unique_id,
      nickname: user.user_info.nickname,
      signature: user.user_info.signature,
      followerCount: user.user_info.follower_count,
      avatarThumb: user.user_info.avatar_thumb,
      isVerified: user.custom_verify !== "",
      secUid: user.user_info.sec_uid,
      url: `${_tiktokDesktopUrl}/@${user.user_info.unique_id}`
    }))

    if (!result.length) {
      return { status: "error", message: ERROR_MESSAGES.USER_NOT_FOUND }
    }

    return { status: "success", result, page, totalResults: result.length }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to search users"
    }
  }
}
