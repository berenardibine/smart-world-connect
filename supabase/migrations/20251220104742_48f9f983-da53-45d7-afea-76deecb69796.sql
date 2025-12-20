
-- Fix the calculate_engagement_score function to have proper search_path
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_impressions integer, p_clicks integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_impressions = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((p_clicks::numeric / p_impressions::numeric) * 100, 2);
END;
$$;
