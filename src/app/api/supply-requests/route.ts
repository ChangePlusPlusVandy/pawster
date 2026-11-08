import { getMySupplyRequests } from "@/lib/supplies/get-my-supply-requests";

export async function GET() {
  try {
    const data = await getMySupplyRequests();
    return Response.json({ data });
  } catch (error) {
    return Response.json(
      {
        data: null,
        message:
          error instanceof Error
            ? error.message
            : "Could not load supply requests.",
      },
      { status: 500 },
    );
  }
}
