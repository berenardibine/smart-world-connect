-- Update the validate_profile_update function to prevent users from editing phone numbers
-- Only admins can edit phone numbers after registration
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to update anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changes to admin-managed fields and phone numbers
  IF auth.uid() = NEW.id THEN
    -- Restore admin-managed fields to their original values
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.rating_count := OLD.rating_count;
    NEW.user_type := OLD.user_type;
    NEW.email := OLD.email;
    
    -- Prevent users from editing phone numbers once set (only admin can edit)
    NEW.phone_number := OLD.phone_number;
    NEW.whatsapp_number := OLD.whatsapp_number;
    NEW.call_number := OLD.call_number;
    
    RETURN NEW;
  END IF;
  
  -- Deny updates from other users (shouldn't reach here due to RLS)
  RAISE EXCEPTION 'Unauthorized profile update';
END;
$$;