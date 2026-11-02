import { createPlacement } from "@/lib/placements/create-placement";
import { getActivePlacements } from "@/lib/placements/get-active-placements";

export async function GET() {
  try {
    const placements = await getActivePlacements();

    return Response.json(
      { data: placements },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to get placements:", error);

    return Response.json(
      {
        data: null,
        message: "Failed to get placements.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { petId, fosterId, startDate, status } = body;

    if (!petId || !fosterId || !startDate || !status) {
      return Response.json(
        {
          data: null,
          message: "petId, fosterId, startDate, and status are required.",
        },
        { status: 400 },
      );
    }

    const placement = await createPlacement({
      petId,
      fosterId,
      shelterluvPlacementId: body.shelterluvPlacementId,
      startDate,
      endDate: body.endDate,
      status,
    });

    return Response.json(
      { data: placement },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create placement:", error);

    return Response.json(
      {
        data: null,
        message: "Failed to create placement.",
      },
      { status: 500 },
    );
  }
}