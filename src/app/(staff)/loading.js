import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function StaffLoading() {
  return (
    <div className="stl-wrap">
      <LoadingSkeleton height="2rem" width="60%" style={{ marginBottom: '1rem' }} />
      <LoadingSkeleton height="90px" count={3} />
    </div>
  );
}
