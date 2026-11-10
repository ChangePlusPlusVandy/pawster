export const instant = false;

type LoginErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function LoginErrorPage({
  searchParams,
}: LoginErrorPageProps) {
  const { reason } = await searchParams;

  const message =
    reason === "expired"
      ? "This sign-in link is expired or has already been used."
      : "This sign-in link is invalid.";

  return (
    <main>
      <h1>Unable to log in</h1>

      <p>{message}</p>

      <a href="/login">Request a new sign-in link</a>
    </main>
  );
}