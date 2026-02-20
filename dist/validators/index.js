"use strict";
/**
 * Registry of service validators.
 * Each validator: (key: string) => Promise<{ valid: boolean; message?: string }>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.envKeys = exports.validators = void 0;
exports.getSupportedServices = getSupportedServices;
const openai_js_1 = require("./openai.js");
exports.validators = {
    openai: openai_js_1.validateOpenAI,
};
exports.envKeys = {
    openai: "OPENAI_API_KEY",
};
function getSupportedServices() {
    return Object.keys(exports.validators);
}
