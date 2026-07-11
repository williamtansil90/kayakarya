ALTER TABLE `sales`
  ADD COLUMN `invoice_number` VARCHAR(100) NULL UNIQUE AFTER `amount`,
  ADD COLUMN `payment_url` VARCHAR(500) NULL AFTER `invoice_number`;
