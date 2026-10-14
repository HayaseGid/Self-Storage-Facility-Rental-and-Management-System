using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SelfStorageAPI.Data;
using SelfStorageAPI.DTOs;
using SelfStorageAPI.Models;

namespace SelfStorageAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HandoverController : ControllerBase
    {
        private readonly SelfStorageDbContext _context;

        public HandoverController(SelfStorageDbContext context)
        {
            _context = context;
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteHandover([FromBody] CompleteHandoverDTO request)
        {
            var reservation = await _context.Reservations
                .Include(r => r.AssignedUnit)
                .FirstOrDefaultAsync(r => r.ReservationID == request.ReservationID);

            if (reservation == null) return NotFound(new { message = "Không tìm thấy Reservation." });

            var staff = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.StaffEmail);
            if (staff == null) return NotFound(new { message = "Không tìm thấy nhân viên." });

            var task = new HandoverTask
            {
                StaffID = staff.UserID,
                TaskType = "Move In",
                ScheduledDate = reservation.StartDate,
                ActualDate = DateTime.Now.Date,
                UnitConditionNotes = request.Notes,
                Status = "Completed",
                ReservationID = reservation.ReservationID,
                CustomerID = reservation.CustomerID,
                UnitID = reservation.AssignedUnitID ?? 0
            };

            _context.HandoverTasks.Add(task);

            reservation.Status = "Handed Over";
            
            if (reservation.AssignedUnit != null)
            {
                reservation.AssignedUnit.Status = "In Use";
            }

            // Create an active Contract automatically after handover
            var contract = new Contract
            {
                ReservationID = reservation.ReservationID,
                ContractTypeID = 1, // Default to Monthly
                StartDate = reservation.StartDate,
                EndDate = reservation.EndDate,
                DepositAmount = reservation.TotalEstimatedCost.GetValueOrDefault(0m) * 2, // Assuming 2 months deposit policy
                TotalFee = reservation.TotalEstimatedCost.GetValueOrDefault(0m) * reservation.RentalPeriod,
                ContractStatus = "Active"
            };
            _context.Contracts.Add(contract);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Bàn giao thành công. Đã tự động kích hoạt Hợp đồng!" });
        }
    }
}
