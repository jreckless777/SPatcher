"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// Initialize the app if it hasn't been initialized already
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)({ projectId: process.env.GCLOUD_PROJECT || 'mock-project' });
}
exports.db = (0, firestore_1.getFirestore)();
