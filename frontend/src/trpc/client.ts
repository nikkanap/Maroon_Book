"use client";

import { createTRPCProxyClient, httpBatchStreamLink, loggerLink, type TRPCClient } from "@trpc/client";
import SuperJSON from "superjson";

import { type AppRouter } from "~/server/api/root";

let clientQueryClientSingleton: TRPCClient<AppRouter> | undefined = undefined;
const getQueryClient = () => {
    clientQueryClientSingleton ??= createTRPCProxyClient<AppRouter>({
        links: [
            loggerLink({
                enabled: (op) =>
                    process.env.NODE_ENV === "development" ||
                    (op.direction === "down" && op.result instanceof Error),
            }),
            httpBatchStreamLink({
                transformer: SuperJSON,
                url: getBaseUrl() + "/api/trpc",
                headers: () => {
                    const headers = new Headers();
                    headers.set("x-trpc-source", "nextjs-react");
                    return headers;
                },
            }),
        ],
    });

    return clientQueryClientSingleton;
};

export const api = getQueryClient();

function getBaseUrl() {
    if (typeof window !== "undefined") return window.location.origin;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
}
