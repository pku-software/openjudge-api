import { CookieJar } from "tough-cookie";
import got, { type OptionsOfTextResponseBody } from "got";
import { load } from "cheerio";

const cookieJar = new CookieJar();
let logged = false;

function fetch(url: string, options?: OptionsOfTextResponseBody) {
    return got(url, {
        ...options,
        cookieJar,
    });
}

function getHost() {
    return process.env.OPENJUDGE_HOST || "rjsj.openjudge.cn";
}

async function login() {
    const result = await fetch(`http://${getHost()}/api/auth/login/`, {
        method: "POST",
        form: {
            email: process.env.OPENJUDGE_USERNAME,
            password: process.env.OPENJUDGE_PASSWORD,
        }
    });
    logged = true;
    return result;
}

export async function get(pathname: string) {
    if (!logged) {
        await login();
    }
    let tried = false;
    do {
        try {
            const url = new URL(pathname, `http://${getHost()}`);
            const result = await fetch(url.href);
            return load(result.body);
        } catch (e) {
            if (!tried) {
                await login();
                tried = true;
                continue;
            }
            throw e;
        }
    } while (true);
}