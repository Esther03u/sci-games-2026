import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function AdminLoading() {
  return (
    <div style={{ padding: '1rem 0' }}>
      <LoadingSkeleton height="2.5rem" width="40%" style={{ marginBottom: '1.5rem' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <LoadingSkeleton height="110px" count={4} />
      </div>
      <LoadingSkeleton height="350px" />
    </div>
  );
}
