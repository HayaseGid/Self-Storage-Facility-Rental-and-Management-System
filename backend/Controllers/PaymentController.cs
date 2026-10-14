using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SelfStorageAPI.Data;
using SelfStorageAPI.DTOs;
using SelfStorageAPI.Models;

namespace SelfStorageAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly SelfStorageDbContext _context;

        public PaymentController(SelfStorageDbContext context)
        {
            _context = context;
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] CreatePaymentDTO request)
        {
            var reservation = await _context.Reservations
                .Include(r => r.AssignedUnit)
                .FirstOrDefaultAsync(r => r.ReservationID == request.ReservationID);

            if (reservation == null) return NotFound(new { message = "Không tìm thấy Reservation." });

            var payment = new Payment
            {
                ReservationID = request.ReservationID,
                TransactionReference = "TXN" + DateTime.Now.Ticks.ToString(),
                Amount = request.Amount,
                PaymentType = request.PaymentType,
                PaymentDate = DateTime.Now.Date,
                PaymentStatus = "Completed"
            };

            _context.Payments.Add(payment);

            // Update status to Paid directly for simpler testing flow
            reservation.Status = "Paid"; 

            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán thành công. Đơn hàng chuyển sang trạng thái đã thanh toán.", paymentId = payment.PaymentID });
        }
    }
}
