const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const s3 = require("../config/aws");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// ==========================================
// MULTER
// ==========================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    },

    fileFilter: (req, file, cb) => {

        if (!file.originalname) {
            return cb(new Error("Invalid filename"));
        }

        cb(null, true);
    }
});


// ==========================================
// CREATE UNIQUE FILE KEY
// ==========================================

function createFileKey(originalName) {

    const ext = path.extname(originalName);

    const cleanName = path
        .basename(originalName, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .substring(0, 80);

    const uniqueId =
        `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    return `${uniqueId}-${cleanName}${ext}`;
}


// ==========================================
// FORMAT FILE
// ==========================================

function formatFile(file) {

    const extension = path
        .extname(file.Key)
        .replace(".", "")
        .toUpperCase();

    return {
        name: file.Key,
        size: file.Size,
        type: extension || "FILE",
        lastModified: file.LastModified
    };
}


// ==========================================
// UPLOAD FILE
// POST /upload
// ==========================================

router.post("/", upload.single("file"), async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please select a file."
            });

        }

        if (!BUCKET_NAME) {

            return res.status(500).json({
                success: false,
                message: "AWS_BUCKET_NAME is missing in .env"
            });

        }


        const fileKey =
            createFileKey(req.file.originalname);


        const params = {

            Bucket: BUCKET_NAME,

            Key: fileKey,

            Body: req.file.buffer,

            ContentType:
                req.file.mimetype || "application/octet-stream",

            Metadata: {

                originalname:
                    req.file.originalname,

                uploadedAt:
                    new Date().toISOString()

            }

        };


        const result =
            await s3.upload(params).promise();


        console.log(
            "✅ S3 Upload:",
            result.Location
        );


        res.status(201).json({

            success: true,

            message:
                "File uploaded successfully to AWS S3!",

            filename:
                req.file.originalname,

            key:
                fileKey,

            size:
                req.file.size,

            url:
                result.Location

        });

    }

    catch (error) {

        console.error(
            "❌ S3 Upload Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to upload file to AWS S3.",

            error:
                error.message

        });

    }

});


// ==========================================
// GET ALL FILES
// GET /upload/files
// ==========================================

router.get("/files", async (req, res) => {

    try {

        if (!BUCKET_NAME) {

            return res.status(500).json({
                success: false,
                message: "AWS_BUCKET_NAME is missing in .env"
            });

        }


        const params = {

            Bucket: BUCKET_NAME

        };


        const data =
            await s3.listObjectsV2(params).promise();


        const files =
            (data.Contents || [])
                .map(formatFile)
                .sort(
                    (a, b) =>
                        new Date(b.lastModified) -
                        new Date(a.lastModified)
                );


        res.json(files);

    }

    catch (error) {

        console.error(
            "❌ S3 List Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to retrieve files from AWS S3.",

            error:
                error.message

        });

    }

});


// ==========================================
// DOWNLOAD FILE
// GET /upload/download/:filename
// ==========================================

router.get(
    "/download/:filename",
    async (req, res) => {

        try {

            const filename =
                req.params.filename;


            if (!filename) {

                return res.status(400).json({
                    message: "Filename is required."
                });

            }


            const params = {

                Bucket: BUCKET_NAME,

                Key: filename

            };


            const data =
                await s3.getObject(params).promise();


            res.setHeader(
                "Content-Type",
                data.ContentType ||
                "application/octet-stream"
            );


            res.setHeader(
                "Content-Length",
                data.ContentLength
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );


            res.send(data.Body);

        }

        catch (error) {

            console.error(
                "❌ S3 Download Error:",
                error
            );

            res.status(404).json({

                success: false,

                message:
                    "File not found in AWS S3."

            });

        }

    }
);


// ==========================================
// VIEW FILE
// GET /upload/view/:filename
// ==========================================

router.get(
    "/view/:filename",
    async (req, res) => {

        try {

            const filename =
                req.params.filename;


            const params = {

                Bucket: BUCKET_NAME,

                Key: filename

            };


            const data =
                await s3.getObject(params).promise();


            res.setHeader(
                "Content-Type",
                data.ContentType ||
                "application/octet-stream"
            );


            res.setHeader(
                "Content-Length",
                data.ContentLength
            );


            // Important:
            // inline = browser tries to display
            // instead of downloading

            res.setHeader(
                "Content-Disposition",
                "inline"
            );


            res.send(data.Body);

        }

        catch (error) {

            console.error(
                "❌ S3 View Error:",
                error
            );

            res.status(404).json({

                success: false,

                message:
                    "File not found in AWS S3."

            });

        }

    }
);


// ==========================================
// DELETE FILE
// DELETE /upload/delete/:filename
// ==========================================

router.delete(
    "/delete/:filename",
    async (req, res) => {

        try {

            const filename =
                req.params.filename;


            if (!filename) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Filename is required."

                });

            }


            const params = {

                Bucket: BUCKET_NAME,

                Key: filename

            };


            await s3.deleteObject(params).promise();


            console.log(
                "🗑️ Deleted from S3:",
                filename
            );


            res.json({

                success: true,

                message:
                    "File deleted successfully from AWS S3!",

                filename:
                    filename

            });

        }

        catch (error) {

            console.error(
                "❌ S3 Delete Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to delete file from AWS S3.",

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// AWS CONNECTION TEST
// GET /upload/test
// ==========================================

router.get("/test", async (req, res) => {

    try {

        const data =
            await s3.listObjectsV2({

                Bucket: BUCKET_NAME,

                MaxKeys: 1

            }).promise();


        res.json({

            success: true,

            message:
                "AWS S3 connection successful!",

            bucket:
                BUCKET_NAME,

            connected:
                true,

            objects:
                data.KeyCount || 0

        });

    }

    catch (error) {

        console.error(
            "❌ AWS Test Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "AWS S3 connection failed.",

            error:
                error.message

        });

    }

});


module.exports = router;