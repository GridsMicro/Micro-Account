"use client";
import { useState } from 'react';
import axios from 'axios';

/**
 * UI component สำหรับส่งคำถามบัญชี/ภาษีไปยัง AI
 * ใช้ API /api/ai/accounting ที่สร้างไว้แล้ว
 */
export default function AiAccountingHelper() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await axios.post('/api/ai/accounting', { prompt });
      setAnswer(res.data.answer);
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        ผู้ช่วย AI ด้านบัญชี & ภาษี
      </h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          rows={4}
          placeholder="พิมพ์คำถามของคุณ เช่น: คำนวณ VAT 7% ของ 150,000 บาท"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'กำลังประมวลผล…' : 'ถาม AI'}
        </button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {answer && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <h3 className="font-medium mb-1 text-gray-800 dark:text-gray-200">คำตอบ:</h3>
          <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{answer}</p>
        </div>
      )}
    </div>
  );
}
