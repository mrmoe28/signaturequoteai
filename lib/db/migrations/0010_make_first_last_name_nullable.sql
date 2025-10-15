-- Migration: Make first_name and last_name nullable in users table
-- This fixes the registration error where users without first/last names couldn't register

ALTER TABLE "users" ALTER COLUMN "first_name" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL;
