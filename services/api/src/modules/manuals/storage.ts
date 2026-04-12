import { mkdir } from "node:fs/promises";
import path from "node:path";

import multer from "multer";

import { HttpError } from "../../utils/httpError.js";

const manualsDir = path.resolve(process.cwd(), "storage", "manuals");

const storage = multer.diskStorage({
    destination: async (_request, _file, callback) => {
        try {
            await mkdir(manualsDir, { recursive: true });
            callback(null, manualsDir);
        } catch (error) {
            callback(error as Error, manualsDir);
        }
    },
    filename: (_request, file, callback) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        callback(null, `${Date.now()}-${safeName}`);
    },
});

export const manualUpload = multer({
    storage,
    limits: {
        fileSize: 60 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const looksPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
        if (!looksPdf) {
            callback(new HttpError("Only PDF files are allowed.", 400));
            return;
        }
        callback(null, true);
    },
});
