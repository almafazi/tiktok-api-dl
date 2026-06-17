export const TIKTOK_URL_REGEX =
  /https:\/\/(?:m|t|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/

export const DOWNLOADER_VERSIONS = {
  V1: "v1",
  V2: "v2",
  V3: "v3"
} as const

export const SEARCH_TYPES = {
  USER: "user",
  LIVE: "live",
  VIDEO: "video"
} as const

export const ERROR_MESSAGES = {
  COOKIE_REQUIRED: "Cookie is required!",
  INVALID_COOKIE: "Invalid cookie!",
  INVALID_VERSION: "Invalid downloader version",
  INVALID_SEARCH_TYPE: "Invalid search type",
  INVALID_URL: "Invalid TikTok URL",
  NETWORK_ERROR: "Network error occurred",
  RATE_LIMIT: "Rate limit exceeded",
  USER_NOT_FOUND: "User not found!",
  NO_RESULTS: "No results found!"
} as const

export const DEFAULT_LIMITS = {
  POST_LIMIT: 30,
  COMMENT_LIMIT: 20,
  SEARCH_PAGE_SIZE: 20
} as const
