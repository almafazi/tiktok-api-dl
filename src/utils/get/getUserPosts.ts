import { fetch } from "undici"
import { _tiktokDesktopUrl } from "../../constants/api"
import {
  AuthorPost,
  Posts,
  TiktokUserPostsResponse
} from "../../types/get/getUserPosts"
import { StalkUser } from "../get/getProfile"
import retry from "async-retry"
import { createDispatcher } from "../proxy"
// @ts-ignore
import xbogus from "../../../helper/xbogus"

export const getUserPosts = async (
  username: string,
  cookie?: string | string[],
  proxy?: string,
  postLimit?: number
): Promise<TiktokUserPostsResponse> => {
  try {
    let cookies = ""
    if (cookie) {
      cookies = Array.isArray(cookie) ? cookie.join("; ") : cookie
    } else {
      cookies = await getCookiesFromProfile(username, proxy)
    }

    const profileRes = await StalkUser(username, proxy, cookies || undefined)
    if (profileRes.status === "error") {
      return { status: "error", message: profileRes.message }
    }

    if (!profileRes.result) {
      return { status: "error", message: "User not found!" }
    }

    const secUid = profileRes.result.user.secUid
    const data = await parseUserPosts(secUid, postLimit, proxy, cookies)

    if (!data.length) {
      return {
        status: "error",
        message:
          "Unable to fetch posts. TikTok API returned empty response. " +
          "Try providing a cookie string from your browser session."
      }
    }

    return { status: "success", result: data, totalPosts: data.length }
  } catch (err: any) {
    if (err.status == 400 || err.response?.data?.statusCode == 10201) {
      return { status: "error", message: "User not found!" }
    }
    return { status: "error", message: err.message || "Failed to fetch posts" }
  }
}

const getCookiesFromProfile = async (username: string, proxy?: string): Promise<string> => {
  try {
    const response = await fetch(
      `${_tiktokDesktopUrl}/@${username.replace("@", "")}`,
      {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        },
        ...createDispatcher(proxy)
      }
    )
    const setCookies = (response.headers as any).getSetCookie?.() || []
    return setCookies.map((c: string) => c.split(";")[0]).join("; ")
  } catch {
    return ""
  }
}

const parseUserPosts = async (
  secUid: string,
  postLimit?: number,
  proxy?: string,
  cookies?: string
): Promise<Posts[]> => {
  // Posts Result
  let page = 1
  let hasMore = true
  let responseCursor = 0
  const posts: Posts[] = []

  while (hasMore) {
    let result: any | null = null
    let count = 35

    if (page === 1) {
      count = 35
    } else {
      count = 30
    }

    // Prevent missing response posts
    result = await requestUserPosts(secUid, responseCursor, count, proxy, cookies)

    result?.itemList?.forEach((v: any) => {
      const author: AuthorPost = {
        id: v.author.id,
        username: v.author.uniqueId,
        nickname: v.author.nickname,
        avatarLarger: v.author.avatarLarger,
        avatarThumb: v.author.avatarThumb,
        avatarMedium: v.author.avatarMedium,
        signature: v.author.signature,
        verified: v.author.verified,
        openFavorite: v.author.openFavorite,
        privateAccount: v.author.privateAccount,
        isADVirtual: v.author.isADVirtual,
        isEmbedBanned: v.author.isEmbedBanned
      }

      if (v.imagePost) {
        const imagePost: string[] = v.imagePost.images.map(
          (img: any) => img.imageURL.urlList[0]
        )

        posts.push({
          id: v.id,
          desc: v.desc,
          createTime: v.createTime,
          digged: v.digged,
          duetEnabled: v.duetEnabled,
          forFriend: v.forFriend,
          officalItem: v.officalItem,
          originalItem: v.originalItem,
          privateItem: v.privateItem,
          shareEnabled: v.shareEnabled,
          stitchEnabled: v.stitchEnabled,
          stats: v.stats,
          music: v.music,
          author,
          imagePost
        })
      } else {
        const video = {
          id: v.video.id,
          duration: v.video.duration,
          format: v.video.format,
          bitrate: v.video.bitrate,
          ratio: v.video.ratio,
          playAddr: v.video.playAddr,
          cover: v.video.cover,
          originCover: v.video.originCover,
          dynamicCover: v.video.dynamicCover,
          downloadAddr: v.video.downloadAddr
        }

        posts.push({
          id: v.id,
          desc: v.desc,
          createTime: v.createTime,
          digged: v.digged,
          duetEnabled: v.duetEnabled,
          forFriend: v.forFriend,
          officalItem: v.officalItem,
          originalItem: v.originalItem,
          privateItem: v.privateItem,
          shareEnabled: v.shareEnabled,
          stitchEnabled: v.stitchEnabled,
          stats: v.stats,
          music: v.music,
          author,
          video
        })
      }
    })

    hasMore = result?.hasMore || false
    responseCursor = hasMore ? result.cursor : 0
    page++

    // Check post limit if specified
    if (postLimit && posts.length >= postLimit) {
      hasMore = false
      break
    }
  }

  return postLimit ? posts.slice(0, postLimit) : posts
}

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0"

const requestUserPosts = async (
  secUid: string,
  cursor: number = 0,
  count: number = 35,
  proxy?: string,
  cookies?: string
): Promise<any> => {
  return retry(
    async (bail, attempt) => {
      // Build params matching working browser request
        const params = new URLSearchParams({
          WebIdLastTime: Math.floor(Date.now() / 1000).toString(),
          aid: "1988",
          app_language: "en",
          app_name: "tiktok_web",
          browser_language: "en-US",
          browser_name: "Mozilla",
          browser_online: "true",
          browser_platform: "Win32",
          browser_version: userAgent.replace("Mozilla/", ""),
          channel: "tiktok_web",
          cookie_enabled: "true",
          count: count.toString(),
          coverFormat: "2",
          cursor: cursor.toString(),
          device_platform: "web_pc",
          focus_state: "true",
          history_len: "2",
          is_fullscreen: "false",
          is_page_visible: "true",
          language: "en",
          os: "windows",
          priority_region: "",
          referer: "",
          region: "ID",
          screen_height: "1080",
          screen_width: "1920",
          secUid: secUid,
          tz_name: "Asia/Jakarta",
          user_is_login: "false",
          webcast_language: "en"
        })

        // Extract msToken from cookies if available
        const msTokenMatch = cookies?.match(/msToken=([^;]+)/)
        if (msTokenMatch) {
          params.append("msToken", msTokenMatch[1])
        }

        // Generate X-Bogus signature using simple xbogus helper
        const baseUrl = `${_tiktokDesktopUrl}/api/post/item_list/?${params.toString()}`
        const xBogusValue = xbogus(baseUrl, userAgent)
        const finalUrl = `${baseUrl}&X-Bogus=${xBogusValue}`

        const res = await fetch(finalUrl, {
          headers: {
            "User-Agent": userAgent,
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            Referer: `${_tiktokDesktopUrl}/`,
            "Sec-Ch-Ua":
              '"Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            ...(cookies ? { Cookie: cookies } : {})
          },
          ...createDispatcher(proxy)
        })

        if (res.status === 400) {
          bail(new Error("Video not found!"))
          return
        }
        if (res.status === 429) {
          if (attempt >= 3) {
            bail(new Error("Rate limited by TikTok. Please try again later."))
            return
          }
          throw new Error("Rate limited")
        }

        const raw = await res.text()
        if (!raw) {
          if (attempt >= 3) {
            bail(
              new Error(
                "TikTok API returned empty response. This is often due to TikTok's anti-bot protection. " +
                  "Try providing a cookie string from your browser session for better results."
              )
            )
            return
          }
          throw new Error("Empty response")
        }

        let data: any
        try { data = JSON.parse(raw) } catch { data = null }
        if (!data) {
          if (attempt >= 3) {
            bail(
              new Error(
                "TikTok API returned empty response. This is often due to TikTok's anti-bot protection. " +
                  "Try providing a cookie string from your browser session for better results."
              )
            )
            return
          }
          throw new Error("Empty response")
        }

        return data
    },
    {
      retries: 5,
      minTimeout: 2000,
      maxTimeout: 10000,
      factor: 2
    }
  )
}
