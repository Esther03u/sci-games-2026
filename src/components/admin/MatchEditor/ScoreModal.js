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
    <div className="me-sets">
      {score.sets.map((s, idx) => (
        <div key={s.set_number} className="me-set-row">
          <span className="me-set-label">เซตที่ {s.set_number}</span>
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
        <form onSubmit={score.submit} className="me-modal-body">
          <div className="me-score-head">
            <div className="me-score-title">
              {sport?.name}
              {m.category ? ` · ${m.category}` : ''}
              {m.round ? ` · รอบ ${m.round}` : ''}
            </div>
            <div className="me-score-teams">
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
            <div className="me-sets-wrap">
              <div className="me-sets-head">
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
            <div className="me-score-grid">
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
          <div className="me-wo-box">
            <div className="me-wo-title">ตัดสินชนะบาย (Walkover)</div>
            <p className="me-wo-text">
              ใช้กรณีคู่แข่งไม่มาทำการแข่งขันตามกำหนด หรือสละสิทธิ์ ระบบจะปรับคะแนนชนะบาย จบการแข่งขัน
              และส่งทีมเข้ารอบอัตโนมัติ
            </p>
            <div className="me-wo-grid">
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

          <div className="me-score-foot">
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

            <div className="me-score-foot-right">
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
