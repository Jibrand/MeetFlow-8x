import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from './root';
import { SEEDED_MEETINGS } from '../data/seeded-meetings';
import { MeetingDetailScaffold } from '../features/meeting-detail/meeting-detail-scaffold';

export const meetingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meetings/$meetingId',
  component: MeetingDetailPage,
});

function MeetingDetailPage() {
  const { meetingId } = useParams({ from: '/meetings/$meetingId' });
  const meeting = SEEDED_MEETINGS.find((m) => m.id === meetingId);

  return <MeetingDetailScaffold meeting={meeting} meetingId={meetingId} />;
}
