import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function PublicLoading() {
  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <LoadingSkeleton height="2.5rem" width="60%" style={{ margin: '0 auto 1rem' }} />
        <LoadingSkeleton height="1.2rem" width="40%" style={{ margin: '0 auto' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <LoadingSkeleton height="160px" count={3} />
      </div>
    </div>
  );
}
