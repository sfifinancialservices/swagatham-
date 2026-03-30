-- Adds invoice number for receipts / emails. Run: mysql -u root -p swagatham_foundation < database/migrations/003_payment_invoice_number.sql

USE swagatham_foundation;

ALTER TABLE payments
  ADD COLUMN invoice_number VARCHAR(48) NULL UNIQUE AFTER currency;
