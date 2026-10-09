'use client';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { RotateCcw } from '@/components/animate-ui/icons';

const WALKOVER_BTN = {
  fontWeight: 700,
  fontSize: '0.8rem',
  borderColor: 'rgba(245, 158, 11, 0.4)',
  background: 'var(--surface)',
};

function SetScoreRows({ score, nameA, nameB }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {score.sets.map((s, idx) => (
        <div
          key={s.set_number}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr',
            gap: '0.75rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.4rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-2)' }}>
            เซตที่ {s.set_number}
          </span>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder={nameA}
            value={s.score_a}
            onChange={(e) => score.setSetScore(idx, 'score_a', e.target.value)}
          />
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder={nameB}
            value={s.score_b}
            onChange={(e) => score.setSetScore(idx, 'score_b', e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

/** Record a result: status, points or per-set scores, audit note, walkover, reset */
export default function ScoreModal({ score, sportById, teamName, loading }) {
  const m = score.match;
  const sport = m ? sportById.get(m.sport_id) : null;
  const isSetSport = sport?.scoring_type === 'sets';
  const nameA = m ? teamName(m.team_a_id, 'ทีม A') : 'ทีม A';
  const nameB = m ? teamName(m.team_b_id, 'ทีม B') : 'ทีม B';

  return (
    <Modal isOpen={!!m} onClose={score.close} title="บันทึกผลคะแนนและสถานะแมตช์">
      {m && (
        <form onSubmit={score.submit} style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
              {sport?.name}
              {m.round ? ` · รอบ ${m.round}` : ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
              {teamName(m.team_a_id, 'รอผลการแข่งขัน')} vs {teamName(m.team_b_id, 'รอผลการแข่งขัน')}
            </div>
          </div>

          <FormField label="สถานะการแข่งขัน" required>
            <select
              className="form-select"
              value={score.status}
              onChange={(e) => score.setStatus(e.target.value)}
              required
            >
              <option value="upcoming">ยังไม่แข่ง (Upcoming)</option>
              <option value="live">กำลังแข่งขัน (Live)</option>
              <option value="finished">จบการแข่งขัน (Finished)</option>
              <option value="postponed">เลื่อนการแข่งขัน (Postponed)</option>
            </select>
          </FormField>

          {/* Score inputs: Sets or Points */}
          {isSetSport ? (
            <div style={{ margin: '1rem 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  คะแนนรายเซต ({sport?.name})
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                  onClick={score.addSet}
                >
                  + เพิ่มเซต
                </button>
              </div>
              <SetScoreRows score={score} nameA={nameA} nameB={nameB} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
              <FormField label={`คะแนน: ${nameA}`}>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={score.scoreA}
                  onChange={(e) => score.setScoreA(e.target.value)}
                  placeholder="0"
                />
              </FormField>

              <FormField label={`คะแนน: ${nameB}`}>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={score.scoreB}
                  onChange={(e) => score.setScoreB(e.target.value)}
                  placeholder="0"
                />
              </FormField>
            </div>
          )}

          <FormField label="หมายเหตุการแก้ไข (ถ้ามี — บันทึกลง Audit Log)">
            <input
              type="text"
              className="form-input"
              placeholder='เช่น "แก้ไขคะแนนเซต 1", "กรรมการบันทึกผิด"'
              value={score.reason}
              onChange={(e) => score.setReason(e.target.value)}
            />
          </FormField>

          {/* Walkover section */}
          <div
            style={{
              margin: '1.25rem 0',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.88rem',
                color: 'var(--gold-700)',
                marginBottom: '0.35rem',
              }}
            >
              ตัดสินชนะบาย (Walkover)
            </div>
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-2)',
                marginBottom: '0.75rem',
                lineHeight: 1.4,
              }}
            >
              ใช้กรณีคู่แข่งไม่มาทำการแข่งขันตามกำหนด หรือสละสิทธิ์ ระบบจะปรับคะแนนชนะบาย จบการแข่งขัน
              และส่งทีมเข้ารอบอัตโนมัติ
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading || !m.team_a_id}
                onClick={() => score.walkover('a')}
                style={WALKOVER_BTN}
              >
                {nameA} ชนะบาย
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading || !m.team_b_id}
                onClick={() => score.walkover('b')}
                style={WALKOVER_BTN}
              >
                {nameB} ชนะบาย
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={score.openReset}
              className="btn btn-secondary btn-sm"
              style={{
                color: 'var(--gold-700)',
                borderColor: 'rgba(245, 158, 11, 0.45)',
                background: 'rgba(245, 158, 11, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <RotateCcw size={12} />
              <span>ล้างผลคู่นี้ (รีเซ็ต)</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={score.close} className="btn btn-secondary btn-sm">
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกผล'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
