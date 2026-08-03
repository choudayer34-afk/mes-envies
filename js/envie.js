import { getEnvies } from "./storage.js";
import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";

let currentEnvieId = null;

export function getCurrentEnvieId() {
    return currentEnvieId;
}