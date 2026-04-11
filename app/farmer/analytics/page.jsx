import AnalyticsDashboard from '@/components/AnalyticsDashboard/AnalyticsDashboard';

export const metadata = {
  title: 'Farm Analytics | AgroLink',
  description: 'Real-time insights from your orders, listings, payments, and ratings.',
};

export default function FarmerAnalyticsPage() {
  return (
    <div className="page-container">
      <AnalyticsDashboard />
    </div>
  );
}
