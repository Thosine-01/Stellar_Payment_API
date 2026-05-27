import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import confetti from "canvas-confetti";
import { PaymentSuccessAnimation } from "./PaymentSuccessAnimation";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("PaymentSuccessAnimation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders nothing when show is false", () => {
    render(<PaymentSuccessAnimation show={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog content when show is true", () => {
    render(<PaymentSuccessAnimation show amount="100" asset="XLM" txId="tx123" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("payment.successTitle")).toBeInTheDocument();
    expect(screen.getByText("100 XLM")).toBeInTheDocument();
    expect(screen.getByText("tx123")).toBeInTheDocument();
  });

  it("triggers confetti once on show", () => {
    const { rerender } = render(<PaymentSuccessAnimation show amount="1" asset="XLM" />);
    rerender(<PaymentSuccessAnimation show amount="1" asset="XLM" />);

    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete from buttons", async () => {
    const onComplete = vi.fn();
    render(<PaymentSuccessAnimation show onComplete={onComplete} />);

    await userEvent.click(screen.getByLabelText("common.close"));
    await userEvent.click(screen.getByLabelText("common.continue"));

    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("calls onComplete after timeout", () => {
    const onComplete = vi.fn();
    vi.useFakeTimers();
    render(<PaymentSuccessAnimation show onComplete={onComplete} />);

    vi.advanceTimersByTime(4000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("has expected screen reader semantics", () => {
    render(<PaymentSuccessAnimation show amount="20" asset="USDC" />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "payment-success-title");
    expect(dialog).toHaveAttribute("aria-describedby", "payment-success-description");

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "assertive");
    expect(status).toHaveTextContent("payment.successAnnounce");
  });
});
