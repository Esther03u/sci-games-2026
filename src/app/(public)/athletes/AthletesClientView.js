'use client';
import { useState, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import TeamBadge from '@/components/ui/TeamBadge';
import GlassCard from '@/components/ui/GlassCard';
import { Search } from '@/components/animate-ui/icons';

export default function AthletesClientView({ athletes = [], sports = [], teams = [] }) {
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      // 1. Team filter
      const teamMatch = selectedTeam === 'all' || a.teams?.name === selectedTeam;

      // 2. Sport filter
      const sportMatch =
        selectedSport === 'all' ||
        a.registrations?.some((r) => r.sport_id === selectedSport && r.status === 'registered');

      // 3. Text search
      const q = search.toLowerCase().trim();
      const textMatch =
        !q ||
        a.full_name?.toLowerCase().includes(q) ||
        a.student_id?.toLowerCase().includes(q) ||
        a.departments?.name?.toLowerCase().includes(q);

      return teamMatch && sportMatch && textMatch;
    });
  }, [athletes, selectedSport, selectedTeam, search]);

  const columns = [
    {
      key: 'student_id',
      label: 'รหัสนักศึกษา',
      render: (val) => <span style={{ fontFamily: 'monospace', color: '#b45309', fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'full_name',
      label: 'ชื่อ - นามสกุล',
      render: (val) => <strong style={{ color: '#09090b' }}>{val}</strong>,
    },
    {
      key: 'department',
      label: 'สาขาวิชา',
      render: (_, row) => row.departments?.name || '-',
    },
    {
      key: 'team',
      label: 'สังกัดสี',
      render: (_, row) => (
        <TeamBadge
          name={row.teams?.name}
          colorHex={row.teams?.color_hex}
          emoji={row.teams?.logo_emoji}
          size="sm"
        />
      ),
    },
    {
      key: 'sports',
      label: 'กีฬาที่ลงแข่ง',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {row.registrations
            ?.filter((r) => r.status === 'registered')
            .map((r, i) => (
              <span
                key={i}
                className="badge"
                style={{ background: '#f4f4f5', color: '#52525b', border: '1px solid #e4e4e7', fontSize: '0.75rem', fontWeight: 500 }}
              >
                {r.sports?.name}
              </span>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Filters bar */}
      <GlassCard
        style={{
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อ / รหัส / สาขา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '240px', paddingLeft: '2.2rem' }}
            />
          </div>

          {/* Sport Filter */}
          <select
            className="form-select"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกชนิดกีฬา</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            className="form-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกสี</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
          พบทั้งหมด <strong style={{ color: '#fbbf24' }}>{filtered.length}</strong> คน
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="ไม่พบข้อมูลนักกีฬาตามเงื่อนไขที่ค้นหา"
      />
    </div>
  );
}
