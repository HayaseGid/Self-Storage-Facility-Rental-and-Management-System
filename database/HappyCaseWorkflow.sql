USE SelfStorageDB;
GO

IF COL_LENGTH('dbo.Reservation', 'DepositAmount') IS NULL
BEGIN
    ALTER TABLE dbo.Reservation
        ADD DepositAmount DECIMAL(12,2) NOT NULL
            CONSTRAINT DF_Reservation_DepositAmount DEFAULT 0;
END
GO

IF OBJECT_ID('dbo.RentalPolicy', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RentalPolicy (
        RentalPolicyID INT IDENTITY(1,1) PRIMARY KEY,
        FacilityID INT NOT NULL UNIQUE,
        DepositPercent DECIMAL(5,2) NOT NULL
            CONSTRAINT DF_RentalPolicy_DepositPercent DEFAULT 20.00,
        CONSTRAINT CK_RentalPolicy_DepositPercent
            CHECK (DepositPercent >= 0 AND DepositPercent <= 100),
        CONSTRAINT FK_RentalPolicy_Facility
            FOREIGN KEY (FacilityID) REFERENCES dbo.Facility(FacilityID)
    );
END
GO

IF OBJECT_ID('dbo.RentalRate', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RentalRate (
        RentalRateID INT IDENTITY(1,1) PRIMARY KEY,
        FacilityID INT NOT NULL,
        UnitTypeID INT NOT NULL,
        UnitSizeID INT NOT NULL,
        MonthlyPrice DECIMAL(12,2) NOT NULL,
        CONSTRAINT UQ_RentalRate_Facility_Type_Size
            UNIQUE (FacilityID, UnitTypeID, UnitSizeID),
        CONSTRAINT CK_RentalRate_MonthlyPrice
            CHECK (MonthlyPrice > 0),
        CONSTRAINT FK_RentalRate_Facility
            FOREIGN KEY (FacilityID) REFERENCES dbo.Facility(FacilityID),
        CONSTRAINT FK_RentalRate_UnitType
            FOREIGN KEY (UnitTypeID) REFERENCES dbo.UnitType(UnitTypeID),
        CONSTRAINT FK_RentalRate_UnitSize
            FOREIGN KEY (UnitSizeID) REFERENCES dbo.UnitSize(UnitSizeID)
    );
END
GO

INSERT INTO dbo.RentalRate (FacilityID, UnitTypeID, UnitSizeID, MonthlyPrice)
SELECT u.FacilityID, u.UnitTypeID, u.UnitSizeID, MAX(u.BasePrice)
FROM dbo.StorageUnit AS u
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.RentalRate AS r
    WHERE r.FacilityID = u.FacilityID
      AND r.UnitTypeID = u.UnitTypeID
      AND r.UnitSizeID = u.UnitSizeID
)
GROUP BY u.FacilityID, u.UnitTypeID, u.UnitSizeID
HAVING MAX(u.BasePrice) > 0;
GO

INSERT INTO dbo.RentalPolicy (FacilityID, DepositPercent)
SELECT f.FacilityID, 20.00
FROM dbo.Facility AS f
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.RentalPolicy AS p
    WHERE p.FacilityID = f.FacilityID
);
GO
