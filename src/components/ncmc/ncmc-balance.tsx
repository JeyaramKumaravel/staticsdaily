import { useAppContext } from '@/contexts/app-context';

export default function NcmcBalance() {
  const { ncmcBalance } = useAppContext();
  return (
    <div className="rounded-lg bg-blue-50 p-4 shadow text-center">
      <div className="text-sm text-gray-500">NCMC Card Balance</div>
      <div className="text-2xl font-bold text-blue-700">₹{ncmcBalance.toLocaleString()}</div>
    </div>
  );
} 