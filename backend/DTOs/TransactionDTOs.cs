using System.ComponentModel.DataAnnotations;

namespace SelfStorageAPI.DTOs
{
    public class CreateReservationDTO
    {
        [Required]
        public string CustomerEmail { get; set; } = string.Empty;
        [Required]
        public string UnitNumber { get; set; } = string.Empty;
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public int Months { get; set; }
        [Required]
        public decimal TotalEstimatedCost { get; set; }
    }

    public class CreatePaymentDTO
    {
        [Required]
        public int ReservationID { get; set; }
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public string PaymentType { get; set; } = string.Empty;
    }

    public class CompleteHandoverDTO
    {
        [Required]
        public int ReservationID { get; set; }
        [Required]
        public string StaffEmail { get; set; } = string.Empty;
        [Required]
        public string AccessType { get; set; } = string.Empty;
        [Required]
        public string AccessValue { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
