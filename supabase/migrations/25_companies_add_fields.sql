-- Migration 25: Add rtn, department, and city columns to companies table
-- These fields were missing from the original schema

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS rtn        TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS city       TEXT;
