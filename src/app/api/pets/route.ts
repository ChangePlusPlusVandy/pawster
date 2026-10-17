import { createPet } from "@/lib/pets/create-pet";
import { getPets } from "@/lib/pets/get-pets";
import { createPetSchema } from "@/lib/pets/validation";
import type { CreatePetResponse, GetPetsResponse } from "@/types";

export async function GET() {
  try {
    const pets = await getPets();

    const response: GetPetsResponse = {
      data: pets,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to get pets:", error);

    return Response.json(
      {
        data: null,
        message: "Failed to get pets.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createPetSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          data: null,
          message: "Invalid pet data.",
        },
        { status: 400 },
      );
    }

    const pet = await createPet(result.data);

    const response: CreatePetResponse = {
      data: pet,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create pet:", error);

    return Response.json(
      {
        data: null,
        message: "Failed to create pet.",
      },
      { status: 500 },
    );
  }
}