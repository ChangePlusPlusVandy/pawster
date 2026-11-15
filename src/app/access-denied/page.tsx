import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>

      <Link href="/">Return to Pawster</Link>
    </main>
  );
}