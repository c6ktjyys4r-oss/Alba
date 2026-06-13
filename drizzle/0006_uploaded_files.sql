-- DB-backed file storage fallback for environments without an object-storage
-- proxy (e.g. Render, where BUILT_IN_FORGE_API_* are not set). Request/document
-- attachments are persisted here and served via GET /api/files/<fileKey>.
-- Migration: 0006_uploaded_files

CREATE TABLE IF NOT EXISTS "uploaded_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"fileKey" varchar(500) NOT NULL,
	"filename" varchar(255),
	"mimeType" varchar(100),
	"dataBase64" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uploaded_files_fileKey_unique" UNIQUE("fileKey")
);
