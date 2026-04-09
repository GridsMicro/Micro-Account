import AiAccountingHelper from '@/components/AiAccountingHelper';

export default function AiPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
        AI ผู้ช่วยด้านบัญชี & ภาษี
      </h1>
      <AiAccountingHelper />
    </main>
  );
}
