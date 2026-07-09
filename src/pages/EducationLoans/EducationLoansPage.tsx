// EducationLoansPage — entry point registered in AppRouter.
// Renders the fully implemented Education Loan Finder module.
// The route /education-loans is already wired in AppRouter; no router changes needed.

import EducationLoanFinderPage from '../EducationLoanFinder/EducationLoanFinderPage';

export default function EducationLoansPage() {
  return <EducationLoanFinderPage />;
}
