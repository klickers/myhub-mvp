import { deepMap } from "nanostores"
import type { Bucket } from "@/types/bucket"

export const buckets = deepMap<Record<number, Bucket>>({})
