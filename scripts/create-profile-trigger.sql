-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into user_profiles table when a new user is created
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create a default project for the new user
  INSERT INTO public.projects (id, user_id, name, description, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'My Finance Timeline',
    'Track your financial journey',
    CURRENT_DATE - INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year'
  )
  ON CONFLICT DO NOTHING;

  -- Create default wallets for the new user
  INSERT INTO public.wallets (id, user_id, name, type, currency, balance, is_active)
  VALUES 
    (gen_random_uuid(), NEW.id, 'Cash', 'cash', 'USD', 0, true),
    (gen_random_uuid(), NEW.id, 'Bank Account', 'bank', 'USD', 0, true),
    (gen_random_uuid(), NEW.id, 'Credit Card', 'credit', 'USD', 0, true)
  ON CONFLICT DO NOTHING;

  -- Create default categories for the new user
  INSERT INTO public.categories (id, user_id, name, type, color, icon, is_active)
  VALUES 
    (gen_random_uuid(), NEW.id, 'Food & Dining', 'expense', '#ef4444', '🍽️', true),
    (gen_random_uuid(), NEW.id, 'Transportation', 'expense', '#f97316', '🚗', true),
    (gen_random_uuid(), NEW.id, 'Shopping', 'expense', '#8b5cf6', '🛍️', true),
    (gen_random_uuid(), NEW.id, 'Salary', 'income', '#22c55e', '💰', true),
    (gen_random_uuid(), NEW.id, 'Investment', 'income', '#3b82f6', '📈', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
