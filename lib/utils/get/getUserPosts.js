"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPosts = void 0;
const axios_1 = __importDefault(require("axios"));
const api_1 = require("../../constants/api");
const https_proxy_agent_1 = require("https-proxy-agent");
const socks_proxy_agent_1 = require("socks-proxy-agent");
const getProfile_1 = require("../get/getProfile");
const async_retry_1 = __importDefault(require("async-retry"));
const xbogus_1 = __importDefault(require("../../../helper/xbogus"));
const getUserPosts = (username, cookie, proxy, postLimit) => new Promise(async (resolve) => {
    try {
        let cookies = "";
        if (cookie) {
            cookies = Array.isArray(cookie) ? cookie.join("; ") : cookie;
        }
        else {
            cookies = await getCookiesFromProfile(username, proxy);
        }
        (0, getProfile_1.StalkUser)(username, proxy).then(async (res) => {
            if (res.status === "error") {
                return resolve({
                    status: "error",
                    message: res.message
                });
            }
            const secUid = res.result.user.secUid;
            try {
                const data = await parseUserPosts(secUid, postLimit, proxy, cookies);
                if (!data.length)
                    return resolve({
                        status: "error",
                        message: "Unable to fetch posts. TikTok API returned empty response. " +
                            "This is often due to TikTok's anti-bot protection. " +
                            "Try providing a cookie string from your browser session for better results."
                    });
                resolve({
                    status: "success",
                    result: data,
                    totalPosts: data.length
                });
            }
            catch (err) {
                return resolve({
                    status: "error",
                    message: err.message || "Unable to fetch posts"
                });
            }
        });
    }
    catch (err) {
        if (err.status == 400 ||
            (err.response?.data && err.response.data.statusCode == 10201)) {
            return resolve({
                status: "error",
                message: "User not found!"
            });
        }
        return resolve({
            status: "error",
            message: err.message || "Unknown error"
        });
    }
});
exports.getUserPosts = getUserPosts;
const getCookiesFromProfile = async (username, proxy) => {
    try {
        const response = await axios_1.default.get(`${api_1._tiktokDesktopUrl}/@${username.replace("@", "")}`, {
            headers: {
                "User-Agent": userAgent,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9"
            },
            httpsAgent: (proxy &&
                (proxy.startsWith("http") || proxy.startsWith("https")
                    ? new https_proxy_agent_1.HttpsProxyAgent(proxy)
                    : proxy.startsWith("socks")
                        ? new socks_proxy_agent_1.SocksProxyAgent(proxy)
                        : undefined)) ||
                undefined
        });
        const setCookies = response.headers["set-cookie"] || [];
        return setCookies.map((c) => c.split(";")[0]).join("; ");
    }
    catch (error) {
        return "";
    }
};
const parseUserPosts = async (secUid, postLimit, proxy, cookies) => {
    let page = 1;
    let hasMore = true;
    let responseCursor = 0;
    const posts = [];
    while (hasMore) {
        let result = null;
        let count = 35;
        if (page === 1) {
            count = 35;
        }
        else {
            count = 30;
        }
        result = await requestUserPosts(secUid, responseCursor, count, proxy, cookies);
        result?.itemList?.forEach((v) => {
            const author = {
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
            };
            if (v.imagePost) {
                const imagePost = v.imagePost.images.map((img) => img.imageURL.urlList[0]);
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
                });
            }
            else {
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
                };
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
                });
            }
        });
        hasMore = result?.hasMore || false;
        responseCursor = hasMore ? result.cursor : 0;
        page++;
        if (postLimit && posts.length >= postLimit) {
            hasMore = false;
            break;
        }
    }
    return postLimit ? posts.slice(0, postLimit) : posts;
};
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0";
const requestUserPosts = async (secUid, cursor = 0, count = 35, proxy, cookies) => {
    return (0, async_retry_1.default)(async (bail, attempt) => {
        try {
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
            });
            const msTokenMatch = cookies?.match(/msToken=([^;]+)/);
            if (msTokenMatch) {
                params.append("msToken", msTokenMatch[1]);
            }
            const baseUrl = `${api_1._tiktokDesktopUrl}/api/post/item_list/?${params.toString()}`;
            const xBogusValue = (0, xbogus_1.default)(baseUrl, userAgent);
            const finalUrl = `${baseUrl}&X-Bogus=${xBogusValue}`;
            const { data } = await axios_1.default.get(finalUrl, {
                headers: {
                    "User-Agent": userAgent,
                    Accept: "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    Referer: `${api_1._tiktokDesktopUrl}/`,
                    "Sec-Ch-Ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"',
                    "Sec-Ch-Ua-Mobile": "?0",
                    "Sec-Ch-Ua-Platform": '"Windows"',
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    ...(cookies ? { Cookie: cookies } : {})
                },
                httpsAgent: (proxy &&
                    (proxy.startsWith("http") || proxy.startsWith("https")
                        ? new https_proxy_agent_1.HttpsProxyAgent(proxy)
                        : proxy.startsWith("socks")
                            ? new socks_proxy_agent_1.SocksProxyAgent(proxy)
                            : undefined)) ||
                    undefined
            });
            if (data === "" || !data) {
                if (attempt >= 3) {
                    bail(new Error("TikTok API returned empty response. This is often due to TikTok's anti-bot protection. " +
                        "Try providing a cookie string from your browser session for better results."));
                    return;
                }
                throw new Error("Empty response");
            }
            return data;
        }
        catch (error) {
            if (error.response?.status === 400 ||
                error.response?.data?.statusCode === 10201) {
                bail(new Error("Video not found!"));
                return;
            }
            if (error.response?.status === 429) {
                if (attempt >= 3) {
                    bail(new Error("Rate limited by TikTok. Please try again later."));
                    return;
                }
                throw new Error("Rate limited");
            }
            throw error;
        }
    }, {
        retries: 5,
        minTimeout: 2000,
        maxTimeout: 10000,
        factor: 2,
        onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} due to: ${error}`);
        }
    });
};
