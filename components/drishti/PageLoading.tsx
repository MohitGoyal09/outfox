import { PageHeader } from "./PageHeader";
import { Skeleton, SkeletonRegion } from "./Skeleton";

export function PageLoading() {
  return (
    <SkeletonRegion label="Loading page">
      <PageHeader
        eyebrow={<Skeleton variant="text" width={72} height={10} />}
        title={<Skeleton variant="text" width={240} height={30} />}
        sub={<Skeleton variant="text" width={360} height={14} />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="row" height={120} />
        ))}
      </div>
    </SkeletonRegion>
  );
}
