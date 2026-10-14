using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SelfStorageAPI.Data;
using SelfStorageAPI.DTOs;
using SelfStorageAPI.Models;

namespace SelfStorageAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly SelfStorageDbContext _context;

        public ReservationController(SelfStorageDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDTO request)
        {
            var customer = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.CustomerEmail);
            if (customer == null) return NotFound(new { message = "Không tìm thấy tài khoản khách hàng." });

            var unit = await _context.StorageUnits.Include(u => u.UnitType).FirstOrDefaultAsync(u => u.UnitNumber == request.UnitNumber);
            if (unit == null) return NotFound(new { message = "Không tìm thấy kho." });
            if (unit.Status != "Available") return BadRequest(new { message = "Kho này không khả dụng để đặt." });

            var reservation = new Reservation
            {
                CustomerID = customer.UserID,
                FacilityID = unit.FacilityID,
                UnitTypeID = unit.UnitTypeID,
                AssignedUnitID = unit.UnitID,
                StartDate = request.StartDate,
                RentalPeriod = request.Months,
                EndDate = request.StartDate.AddMonths(request.Months).AddDays(-1),
                TotalEstimatedCost = request.TotalEstimatedCost,
                Status = "Pending Deposit" // Trạng thái chờ cọc
            };

            // Đổi trạng thái kho thành Reserved để không ai khác đặt được
            unit.Status = "Reserved";

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đặt kho thành công, đang chờ đặt cọc.", reservationId = reservation.ReservationID });
        }
    }
}
