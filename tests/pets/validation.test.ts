import { describe, expect, it } from "vitest";
import { createPetSchema } from "../../src/lib/pets/validation";

describe("createPetSchema", () => {
  it("trims required text fields and accepts optional values", () => {
    const result = createPetSchema.parse({
      name: "  Miso  ",
      species: " Cat ",
      status: " Available ",
    });

    expect(result).toEqual({
      name: "Miso",
      species: "Cat",
      status: "Available",
    });
  });

  it("rejects missing required text fields", () => {
    const result = createPetSchema.safeParse({
      name: "  ",
      species: "Dog",
      status: "Available",
    });

    expect(result.success).toBe(false);
  });
});
