-- Trigger 1: Update wallet balance on journal entry insert
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Lock wallet row for update
  SELECT balance INTO current_balance
  FROM user_wallet
  WHERE wallet_id = NEW.wallet_id
  FOR UPDATE;

  -- Validate balance_before matches current balance
  IF NEW.balance_before <> current_balance THEN
    RAISE EXCEPTION 'Balance mismatch: expected %, got %', current_balance, NEW.balance_before;
  END IF;

  -- Calculate new balance based on direction
  IF NEW.direction = 'credit' THEN
    new_balance := current_balance + NEW.amount;
  ELSIF NEW.direction = 'debit' THEN
    new_balance := current_balance - NEW.amount;
  ELSE
    RAISE EXCEPTION 'Invalid direction: %', NEW.direction;
  END IF;

  -- Validate balance_after matches calculation
  IF NEW.balance_after <> new_balance THEN
    RAISE EXCEPTION 'Balance calculation error: expected %, got %', new_balance, NEW.balance_after;
  END IF;

  -- Prevent overdraft
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Overdraft prevented: wallet % would have balance %', NEW.wallet_id, new_balance;
  END IF;

  -- Update wallet balance
  UPDATE user_wallet
  SET balance = new_balance, updated_at = NOW()
  WHERE wallet_id = NEW.wallet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_wallet_balance
BEFORE INSERT ON coin_journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

-- Trigger 2: Validate balanced ledger on transaction close
CREATE OR REPLACE FUNCTION validate_balanced_ledger()
RETURNS TRIGGER AS $$
DECLARE
  entry_count INTEGER;
  total_signed INTEGER;
BEGIN
  -- Only validate on transition to 'closed'
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status <> 'closed') THEN
    -- Count entries
    SELECT COUNT(*) INTO entry_count
    FROM coin_journal_entries
    WHERE ledger_transaction_id = NEW.id;

    -- Require at least 2 entries
    IF entry_count < 2 THEN
      RAISE EXCEPTION 'Ledger transaction % must have at least 2 entries, found %', NEW.id, entry_count;
    END IF;

    -- Calculate sum with direction signs
    SELECT SUM(
      CASE
        WHEN direction = 'credit' THEN amount
        WHEN direction = 'debit' THEN -amount
      END
    ) INTO total_signed
    FROM coin_journal_entries
    WHERE ledger_transaction_id = NEW.id;

    -- Ensure balanced (sum = 0)
    IF total_signed <> 0 THEN
      RAISE EXCEPTION 'Ledger transaction % is unbalanced: sum = %', NEW.id, total_signed;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_balanced_ledger
BEFORE UPDATE ON coin_ledger_transactions
FOR EACH ROW
EXECUTE FUNCTION validate_balanced_ledger();

-- Trigger 3: Prevent updates/deletes on journal entries (immutability)
CREATE OR REPLACE FUNCTION prevent_journal_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Journal entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_journal_update
BEFORE UPDATE ON coin_journal_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_journal_modifications();

CREATE TRIGGER trg_prevent_journal_delete
BEFORE DELETE ON coin_journal_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_journal_modifications();
