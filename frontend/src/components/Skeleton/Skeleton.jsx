import './Skeleton.css';

export function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <main className="skeleton-page skeleton-dashboard" aria-label="대시보드를 불러오는 중입니다">
      <section className="skeleton-dashboard__hero">
        <Skeleton className="skeleton-dashboard__image" />
        <div className="skeleton-dashboard__summary">
          <Skeleton className="skeleton-line skeleton-line--short" />
          <Skeleton className="skeleton-line skeleton-line--medium" />
          <Skeleton className="skeleton-line skeleton-line--long" />
        </div>
      </section>
      <section className="skeleton-dashboard__metrics">
        {[0, 1, 2].map((index) => <Skeleton key={index} className="skeleton-dashboard__metric" />)}
      </section>
      <section className="skeleton-dashboard__chart">
        <Skeleton className="skeleton-line skeleton-line--medium" />
        <Skeleton className="skeleton-dashboard__graph" />
      </section>
    </main>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="skeleton-page skeleton-profile" aria-label="프로필을 불러오는 중입니다">
      <Skeleton className="skeleton-line skeleton-line--short" />
      <Skeleton className="skeleton-profile__tabs" />
      <div className="skeleton-profile__grid">
        {[0, 1, 2].map((index) => <Skeleton key={index} className="skeleton-profile__card" />)}
      </div>
    </main>
  );
}

export function PlantListSkeleton() {
  return (
    <div className="skeleton-profile__grid" aria-label="식물 목록을 불러오는 중입니다">
      {[0, 1, 2].map((index) => <Skeleton key={index} className="skeleton-profile__card" />)}
    </div>
  );
}
