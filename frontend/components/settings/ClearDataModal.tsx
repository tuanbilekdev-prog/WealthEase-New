'use client'

type ClearDataModalProps = {
  isOpen: boolean
  isProcessing: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ClearDataModal({
  isOpen,
  isProcessing,
  onConfirm,
  onCancel,
}: ClearDataModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1E1E] border border-red-200 dark:border-red-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tindakan ini akan menghapus seluruh data finansial Anda (transaksi, bills, histori AI) secara permanen.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 leading-relaxed">
          Apakah Anda yakin ingin menghapus seluruh data finansial? <strong>Tindakan ini tidak bisa dibatalkan.</strong> Akun
          Anda tetap aman, namun semua transaksi, Smart Bill, dan riwayat terkait akan hilang.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed hover:bg-red-700 transition"
          >
            {isProcessing ? 'Menghapus...' : 'Yes, Delete All Data'}
          </button>
        </div>
      </div>
    </div>
  )
}


