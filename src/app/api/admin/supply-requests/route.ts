export const instant = false;

import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { getAllSupplyRequests } from "@/lib/supplies/get-all-supply-requests";

export async function GET() {
  await connection();

  try {
    const auth = await requireStaff();

    if (!auth.authorized) {
      if (auth.reason === "unauthenticated") {
        return Response.json(
          {
            data: null,
            message: "Authentication required.",
          },
          { status: 401 },
        );
      }

      return Response.json(
        {
          data: null,
          message: "Staff access required.",
        },
        { status: 403 },
      );
    }

    const data = await getAllSupplyRequests();

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Failed to load staff supply requests:", error);

    return Response.json(
      {
        data: null,
        message: "Could not load supply requests.",
      },
      { status: 500 },
    );
  }
}