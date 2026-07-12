// Neutral placeholder shaped like a real product card — keeps the grid from
// looking frozen/blank on slow connections instead of a spinner that gives
// no sense of how much content is coming.
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 border border-oat animate-pulse">
      <div className="aspect-[4/5] w-full rounded-[2rem] bg-oat" />
      <div className="mt-6 px-2 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-oat" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-1/3 rounded-full bg-oat" />
          <div className="w-10 h-10 rounded-xl bg-oat" />
        </div>
      </div>
    </div>
  );
}
