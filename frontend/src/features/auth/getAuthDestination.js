export function getAuthDestination(user) {
  if (!user?.onboarding_completed) return "/onboarding";
  if (!user.getting_started_completed) return "/getting-started";
  return "/app/dashboard";
}
