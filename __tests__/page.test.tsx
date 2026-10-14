import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("home page shows The Campus Herald title", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "The Campus Herald" }),
  ).toBeDefined();
});
