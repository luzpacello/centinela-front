import { readStoredAccessToken } from "./apiClient";

interface Irequest {
    url: string
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    token: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
}

async function request(params: Irequest) {
    const {
        method, token, url, body
    } = params;

    const confi = {
        method,
        credentials: 'include',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        },
        body: body ? JSON.stringify(body) : null,
    }

    try {
        const respuesta = await fetch(url, confi);

        if (respuesta.ok) {
            const data = await respuesta.json();
            return data;
        } else {
            throw new Error("Ocurrio un error en la respuesta")
        }
    } catch (error) {
        console.error(error);
        return error;
    }
}

export async function get(url: string) {
    const token = readStoredAccessToken();
    if (token === null) {
        console.error("no hay token para el GET  ", url)
    }

    return request({
        method: "GET",
        token: token || "",
        url
    })
}