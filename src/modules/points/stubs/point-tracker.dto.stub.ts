import { PointTracker } from '../entities/point-tracker.entity';

export const PointTrackerDtoStub = (): PointTracker => {
  return {
    _id: '1',
    author_user_id: '1',
    date: new Date(),
    hours_processed: [1, 2, 3],
  };
};
