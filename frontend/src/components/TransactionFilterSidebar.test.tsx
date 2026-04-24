/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionFilterSidebar from "./TransactionFilterSidebar";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("TransactionFilterSidebar", () => {
  const defaultFilters = {
    search: "",
    status: "all",
    asset: "all",
    dateFrom: "",
    dateTo: "",
  };

  const mockProps = {
    filters: defaultFilters,
    onFilterChange: vi.fn(),
    onClearFilter: vi.fn(),
    onClearAll: vi.fn(),
    hasActiveFilters: false,
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all filter sections", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/Search/i).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/Status/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Asset/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Date Range/i).length).toBeGreaterThan(0);
    });

    it("should display current filter values", () => {
      const activeFilters = {
        search: "test-id",
        status: "confirmed",
        asset: "USDC",
        dateFrom: "2023-01-01",
        dateTo: "2023-12-31",
      };

      render(<TransactionFilterSidebar {...mockProps} filters={activeFilters} />);

      const searchInputs = screen.getAllByLabelText(/Search/i);
      expect(searchInputs[0]).toHaveValue("test-id");
      
      const statusSelects = screen.getAllByLabelText(/Status/i);
      expect(statusSelects[0]).toHaveValue("confirmed");

      // Asset is using buttons, check for active class or just existence
      const usdcButtons = screen.getAllByRole("button", { name: /USDC/i });
      expect(usdcButtons[0]).toHaveClass("bg-[var(--pluto-500)]");
    });
  });

  describe("Interactions", () => {
    it("should call onFilterChange after debounce when typing in search", async () => {
      const user = userEvent.setup();
      render(<TransactionFilterSidebar {...mockProps} />);

      const searchInputs = screen.getAllByLabelText(/Search/i);
      await user.type(searchInputs[0], "new search");

      // Debounce is 350ms, wait for it
      await waitFor(() => {
        expect(mockProps.onFilterChange).toHaveBeenCalledWith("search", "new search");
      }, { timeout: 1000 });
    });

    it("should call onFilterChange immediately when selecting status", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      const statusSelects = screen.getAllByLabelText(/Status/i);
      fireEvent.change(statusSelects[0], { target: { value: "failed" } });

      expect(mockProps.onFilterChange).toHaveBeenCalledWith("status", "failed");
    });

    it("should call onFilterChange when clicking an asset button", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      const xlmButtons = screen.getAllByRole("button", { name: /XLM/i });
      fireEvent.click(xlmButtons[0]);

      expect(mockProps.onFilterChange).toHaveBeenCalledWith("asset", "XLM");
    });

    it("should call onFilterChange when changing dates", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      const fromInputs = screen.getAllByLabelText(/From/i, { selector: 'input' });
      fireEvent.change(fromInputs[0], { target: { value: "2024-01-01" } });
      expect(mockProps.onFilterChange).toHaveBeenCalledWith("dateFrom", "2024-01-01");
    });
  });

  describe("Filter Management", () => {
    it("should call onClearAll when clicking Clear All Filters button", () => {
      render(<TransactionFilterSidebar {...mockProps} hasActiveFilters={true} />);

      const clearAllButtons = screen.getAllByRole("button", { name: /Clear All Filters/i });
      fireEvent.click(clearAllButtons[0]);

      expect(mockProps.onClearAll).toHaveBeenCalled();
    });

    it("should disable Clear All button when no active filters", () => {
      render(<TransactionFilterSidebar {...mockProps} hasActiveFilters={false} />);

      const clearAllButtons = screen.getAllByRole("button", { name: /Clear All Filters/i });
      expect(clearAllButtons[0]).toBeDisabled();
    });
  });

  describe("Accessibility & UX", () => {
    it("should have proper ARIA labels", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      expect(screen.getByRole("dialog", { name: /Filter sidebar/i })).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      render(<TransactionFilterSidebar {...mockProps} />);

      const closeButtons = screen.getAllByLabelText(/Close filters/i);
      fireEvent.click(closeButtons[0]);

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});
