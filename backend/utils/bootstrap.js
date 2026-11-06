/**
 * Bootstrap utility – no longer provisions Protected Admin.
 *
 * Protected Admin credentials are now managed exclusively through
 * environment variables (PROTECTED_ADMIN_EMAIL, PROTECTED_ADMIN_PASSWORD).
 *
 * Protected Admin accounts are NOT created in MongoDB.
 * They exist only as .env-based authentication.
 *
 * This bootstrap function is now a no-op kept for backward compatibility.
 */

const bootstrapProtectedAdmin = async () => {
  console.log("✅ Bootstrap: Protected Admin credentials are managed via .env file (not MongoDB)");
  // No-op: Protected Admin is now authenticated via .env in the login handler and auth middleware
};

module.exports = bootstrapProtectedAdmin;
