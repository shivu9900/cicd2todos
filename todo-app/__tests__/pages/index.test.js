import { render, screen } from "@testing-library/react";
import Home from "../../pages/index";

describe("Home page", () => {
  it("renders Todo List heading and Add button", () => {
    render(<Home />);
    expect(screen.getByText("Todo List")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });
});
