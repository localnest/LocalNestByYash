import { useState } from 'react';
import type { Review, Complaint } from '../types.ts';

export function useReviewSlice(initialReviews: Review[] = [], initialComplaints: Complaint[] = []) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);

  const addReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const addComplaint = (complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
  };

  return {
    reviews,
    complaints,
    addReview,
    addComplaint,
  };
}
