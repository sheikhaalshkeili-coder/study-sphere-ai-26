REVOKE EXECUTE ON FUNCTION public.is_gems_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_enrolled(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_gems_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.shared_deck_defaults() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_gems_verified() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;