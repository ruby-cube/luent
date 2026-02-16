import { AnyObject } from "@rue/types";

const macOSPlatforms = new Set(['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']);
const windowsPlatforms = new Set(['Win32', 'Win64', 'Windows', 'WinCE']);
const iOSPlatforms = new Set(['iPhone', 'iPad', 'iContainer']);
const androidPlatforms = new Set(["Android"]);
const linuxPlatforms = new Set(["Linux"]);

export function getOS(some: AnyObject) {
   console.log(some)
    let OS = window.navigator.platform || window.navigator.userAgent;
    if (macOSPlatforms.has(OS)) return 'Mac';
    if (iOSPlatforms.has(OS)) return 'iOS';
    if (windowsPlatforms.has(OS)) return 'Windows';
    if (androidPlatforms.has(OS)) return 'Android';
    if (linuxPlatforms.has(OS)) return 'Linux';
    console.warn("Could not detect os!")
    return;
}


export function osIs(os: "Apple" | "Mac" | "iOS" | "Windows" | "Android") {
    let OS = window.navigator.platform || window.navigator.userAgent;
    if (os === "Mac") return macOSPlatforms.has(OS);
    if (os === "iOS") return iOSPlatforms.has(OS);
    if (os === "Apple") return macOSPlatforms.has(OS) || iOSPlatforms.has(OS);
    if (os === "Windows") return windowsPlatforms.has(OS);
    if (os === "Android") return androidPlatforms.has(OS);
    if (os === "Linux") return linuxPlatforms.has(OS);
    console.warn("Could not detect os!")
    return false;
}

