import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedisConfig = Boolean(url && token);

export const redis = hasRedisConfig ? new Redis({ url: url!, token: token! }) : null;
