import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "@/components/order-form";
import type { MenuItem } from "@/lib/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: rpcMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("OrderForm", () => {
  const menuItems: MenuItem[] = [
    {
      id: "item-1",
      name: "Chapati + Beans",
      price: 8000,
      description: "Classic breakfast",
      image_url: null,
      is_special: false,
      is_active: true,
      created_by: null,
      created_at: "2026-03-18T00:00:00Z",
      updated_at: "2026-03-18T00:00:00Z",
    },
  ];

  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("shows debt blocked banner and disables payment mode toggle", async () => {
    render(
      <OrderForm
        menuItems={menuItems}
        availableItemIds={null}
        balance={-12000}
        drainMode="automatic"
        orderDateLabel="Thursday, Mar 19"
        canOrder={true}
        cutoffMessage="Order before 8 PM tonight for tomorrow's breakfast."
        isDebtBlocked={true}
      />,
    );

    expect(screen.getByText("Orders suspended")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "payment-method-prepaid" })).toBeDisabled();
  });

  it("shows insufficient balance for prepaid automatic orders", async () => {
    const user = userEvent.setup();

    render(
      <OrderForm
        menuItems={menuItems}
        availableItemIds={null}
        balance={2000}
        drainMode="automatic"
        orderDateLabel="Thursday, Mar 19"
        canOrder={true}
        cutoffMessage="Order before 8 PM tonight for tomorrow's breakfast."
        isDebtBlocked={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "add-Chapati + Beans" }));

    expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Place Order/ })).toBeDisabled();
  });

  it("does not show insufficient balance when pay later is selected", async () => {
    const user = userEvent.setup();

    render(
      <OrderForm
        menuItems={menuItems}
        availableItemIds={null}
        balance={2000}
        drainMode="automatic"
        orderDateLabel="Thursday, Mar 19"
        canOrder={true}
        cutoffMessage="Order before 8 PM tonight for tomorrow's breakfast."
        isDebtBlocked={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "add-Chapati + Beans" }));
    expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "payment-method-pay_later" }));

    expect(screen.queryByText(/Insufficient balance/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay Later/ })).toBeEnabled();
  });
});
