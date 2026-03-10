import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Stethoscope, Droplets, Scissors, Syringe, HeartPulse, Home,
  Clock, X, ChevronRight, CalendarDays, PawPrint, MessageSquare, Check
} from 'lucide-react';
import { mockServices, mockPets, timeSlots, formatCurrency } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  droplets: Droplets,
  scissors: Scissors,
  syringe: Syringe,
  'heart-pulse': HeartPulse,
  home: Home,
};

export function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(0); // 0: none, 1: select pet, 2: select time, 3: confirm
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-03-11');
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const bookedSlots = ['09:00', '14:00', '15:30']; // mock
  const service = mockServices.find(s => s.id === selectedService);
  const customerPets = mockPets.filter(p => p.ownerId === 'u1');

  const resetBooking = () => {
    setSelectedService(null);
    setBookingStep(0);
    setSelectedPet('');
    setSelectedTime('');
    setNote('');
    setBookingSuccess(false);
  };

  const handleBook = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      resetBooking();
    }, 3000);
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl text-[#2d2a26] mb-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Dịch vụ chăm sóc thú cưng
          </h1>
          <p className="text-[#7a756e] max-w-lg mx-auto">
            Chọn dịch vụ phù hợp và đặt lịch hẹn ngay. Chúng tôi sẵn sàng chăm sóc bé cưng của bạn.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServices.map((s, i) => {
            const Icon = iconMap[s.icon] || Stethoscope;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => { setSelectedService(s.id); setBookingStep(1); }}
                className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={s.image}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2d2a26]/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/90 rounded-full text-xs">
                      <Clock className="w-3 h-3" />
                      {s.duration}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6b8f5e]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#6b8f5e]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#2d2a26] mb-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                        {s.name}
                      </h3>
                      <p className="text-xs text-[#7a756e] line-clamp-2">{s.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#2d2a26]/10">
                    <span className="text-lg text-[#6b8f5e]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {formatCurrency(s.price)}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-[#c67d5b]">
                      Đặt lịch <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedService && service && !bookingSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={resetBooking}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#2d2a26]/20">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  Đặt lịch hẹn
                </h2>
                <button onClick={resetBooking} className="p-1 hover:bg-[#f0ede8] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress */}
              <div className="px-5 py-3 flex items-center gap-2 text-sm">
                {['1. Dịch vụ', '2. Thú cưng', '3. Thời gian'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs border ${
                      bookingStep > i + 1 ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' :
                      bookingStep === i + 1 ? 'bg-[#c67d5b] text-white border-[#c67d5b]' :
                      'bg-white text-[#7a756e] border-[#2d2a26]/20'
                    }`}>
                      {step}
                    </span>
                    {i < 2 && <ChevronRight className="w-4 h-4 text-[#7a756e]" />}
                  </div>
                ))}
              </div>

              {/* Service info */}
              <div className="mx-5 p-4 bg-[#f0ede8] rounded-xl border border-[#2d2a26]/20 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6b8f5e]/10 flex items-center justify-center">
                    {(() => { const Icon = iconMap[service.icon] || Stethoscope; return <Icon className="w-5 h-5 text-[#6b8f5e]" />; })()}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{service.name}</p>
                    <p className="text-xs text-[#7a756e]">{service.duration} &bull; {formatCurrency(service.price)}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Step 1: Select Pet */}
                {bookingStep >= 1 && (
                  <div>
                    <label className="text-sm text-[#2d2a26] mb-2 flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-[#6b8f5e]" />
                      Chọn thú cưng
                    </label>
                    <select
                      value={selectedPet}
                      onChange={e => { setSelectedPet(e.target.value); if (bookingStep === 1) setBookingStep(2); }}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl bg-white focus:ring-2 focus:ring-[#6b8f5e] focus:outline-none"
                    >
                      <option value="">-- Chọn thú cưng --</option>
                      {customerPets.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                      ))}
                      <option value="none">Chưa đăng ký thú cưng</option>
                    </select>
                  </div>
                )}

                {/* Step 2: Select Date & Time */}
                {bookingStep >= 2 && (
                  <div>
                    <label className="text-sm text-[#2d2a26] mb-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#6b8f5e]" />
                      Chọn ngày
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min="2026-03-10"
                      className="w-full p-3 border border-[#2d2a26] rounded-xl bg-white focus:ring-2 focus:ring-[#6b8f5e] focus:outline-none mb-4"
                    />

                    <label className="text-sm text-[#2d2a26] mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#6b8f5e]" />
                      Chọn khung giờ
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            disabled={isBooked}
                            onClick={() => { setSelectedTime(slot); if (bookingStep === 2) setBookingStep(3); }}
                            className={`py-2 rounded-xl text-sm transition-all border ${
                              isBooked
                                ? 'bg-[#e8e4de] text-[#7a756e]/50 border-transparent line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#6b8f5e] text-white border-[#6b8f5e] -translate-y-0.5'
                                : 'bg-white text-[#2d2a26] border-[#2d2a26]/30 hover:-translate-y-0.5 hover:border-[#6b8f5e]'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Note & Confirm */}
                {bookingStep >= 3 && selectedTime && (
                  <div>
                    <label className="text-sm text-[#2d2a26] mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#6b8f5e]" />
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Mô tả triệu chứng, yêu cầu đặc biệt..."
                      className="w-full p-3 border border-[#2d2a26] rounded-xl bg-white focus:ring-2 focus:ring-[#6b8f5e] focus:outline-none resize-none"
                      rows={3}
                    />

                    {/* Summary */}
                    <div className="mt-4 p-4 bg-[#f0ede8] rounded-xl border border-[#2d2a26]/20 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[#7a756e]">Dịch vụ:</span><span>{service.name}</span></div>
                      <div className="flex justify-between"><span className="text-[#7a756e]">Ngày:</span><span>{selectedDate}</span></div>
                      <div className="flex justify-between"><span className="text-[#7a756e]">Giờ:</span><span>{selectedTime}</span></div>
                      <div className="flex justify-between"><span className="text-[#7a756e]">Thú cưng:</span><span>{customerPets.find(p => p.id === selectedPet)?.name || 'Chưa chọn'}</span></div>
                      <hr className="border-[#2d2a26]/10" />
                      <div className="flex justify-between" style={{ fontWeight: 600 }}>
                        <span>Tổng cộng:</span>
                        <span className="text-[#6b8f5e]">{formatCurrency(service.price)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleBook}
                      className="w-full mt-4 py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-1 active:translate-y-0 transition-all border border-[#2d2a26]"
                    >
                      Xác nhận đặt lịch
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-[#2d2a26] rounded-2xl p-8 text-center max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl text-[#2d2a26] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Đặt lịch thành công!
              </h3>
              <p className="text-sm text-[#7a756e]">
                Lịch hẹn của bạn đang ở trạng thái <span className="text-amber-600" style={{ fontWeight: 600 }}>Chờ xác nhận</span>.
                Chúng tôi sẽ thông báo khi quản lý xác nhận.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
