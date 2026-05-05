import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingPage from "./pages/Loading/LoadingPage";

test("renders the project loading state", () => {
  render(<LoadingPage />);
  expect(screen.getByText(/загружаем/i)).toBeInTheDocument();
});
