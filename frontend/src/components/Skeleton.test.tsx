import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a skeleton element with animation class", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains("animate-pulse")).toBe(true);
    expect(el.classList.contains("h-4")).toBe(true);
    expect(el.classList.contains("w-20")).toBe(true);
  });

  it("renders a skeleton card", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders a skeleton list with default count", () => {
    const { container } = render(<SkeletonList />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("renders a skeleton list with custom count", () => {
    const { container } = render(<SkeletonList count={5} />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });
});
