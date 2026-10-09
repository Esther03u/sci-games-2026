import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function AdminLoading() {
  return (
    <div className="ld-wrap">
      <LoadingSkeleton height="2.5rem" width="40%" style={{ marginBottom: '1.5rem' }} />
      <div className="ld-grid">
        <LoadingSkeleton height="110px" count={4} />
      </div>
      <LoadingSkeleton height="350px" />
    </div>
  );
}
