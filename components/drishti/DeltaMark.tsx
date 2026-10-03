export function DeltaMark({ direction }: { direction: "up" | "down" }) {
  return (
    <span
      aria-hidden="true"
      className="mr-1 inline-block size-[7px] bg-current align-middle"
      style={{
        clipPath:
          direction === "up"
            ? "polygon(50% 0, 100% 100%, 0 100%)"
            : "polygon(0 0, 100% 0, 50% 100%)",
      }}
    />
  );
}
