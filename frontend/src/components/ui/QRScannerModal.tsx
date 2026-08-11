import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import QRScanner from './QRScanner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Scan Attendance QR</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 text-center mb-6">
              Position the QR code within the frame to automatically scan and mark your attendance.
            </p>
            <div className="rounded-2xl overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700">
              <QRScanner
                onScanSuccess={onScanSuccess}
                onScanError={(err) => {
                  // Suppress noisy QR scan errors
                  if (!err.includes('NotFound')) {
                    console.log('QR Scan Error:', err);
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QRScannerModal;
