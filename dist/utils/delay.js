"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.randomDelay = randomDelay;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function randomDelay(minMs = 900, maxMs = 1800) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return delay(ms);
}
