import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function PublicLoading() {
  return (
    <div className="pl-wrap">
      <div className="pl-head">
        <LoadingSkeleton height="2.5rem" width="60%" style={{ margin: '0 auto 1rem' }} />
        <LoadingSkeleton height="1.2rem" width="40%" style={{ margin: '0 auto' }} />
      </div>

      <div className="pl-grid">
        <LoadingSkeleton height="160px" count={3} />
      </div>
    </div>
  );
}
