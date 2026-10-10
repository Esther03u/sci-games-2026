'use client';
import { useCallback, useRef, useState } from 'react';
import PodiumCountdown from '@/components/public/PodiumCountdown';
import PodiumReveal from './PodiumReveal';

/**
 * Home page podium. Before the reveal: equal "?" bars in the real colours and
 * the countdown — the page carries no totals (lib/queries/placements). When
 * the podium opens while the page is open, the results are fetched from
 * /api/standings and the reveal plays (~40 s); a page opened after the reveal
 * gets them from the server and shows the result with a replay button.
 *
 * @param {{ teams: object[], countdownSettings: object,
 *   revealedData?: { events: object[], points: number[] } | null }} props
 */
export default function HomePodium({
  teams = [],
  countdownSettings = null,
  revealedData = null,
  teaser = null,
}) {
  const [revealed, setRevealed] = useState(Boolean(revealedData));
  const [data, setData] = useState(revealedData);
  const [live, setLive] = useState(false); // revealed while this page was open → animate
  const mounted = useRef(false);
  const loading = useRef(false);

  const hasData = useRef(Boolean(revealedData));

  const onRevealChange = useCallback((open) => {
    const firstCall = !mounted.current;
    mounted.current = true;
    setRevealed(open);
    if (!open) {
      hasData.current = false;
      setData(null);
      setLive(false);
      return;
    }
    // animate only a reveal that happens while the page is open, not the state it loaded in
    if (!firstCall) setLive(true);
    if (hasData.current || loading.current) return;
    loading.current = true;
    fetch('/api/standings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.data?.revealed) return;
        hasData.current = true;
        setData({ events: j.data.events || [], points: j.data.points });
      })
      .catch(() => {})
      .finally(() => {
        loading.current = false;
      });
  }, []);

  const showData = revealed && data;
  const mode = !showData ? 'mystery' : live ? 'play' : 'final';

  return (
    <div className="podium-card">
      <PodiumReveal
        teams={teams}
        events={showData ? data.events : []}
        points={data?.points}
        mode={mode}
        teaser={revealed ? null : teaser}
      />
      <PodiumCountdown
        initialSettings={countdownSettings}
        isRevealed={revealed}
        onRevealChange={onRevealChange}
        confetti={false}
      />
    </div>
  );
}
