package com.hospital.hms.repository;

import com.hospital.hms.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    // Calculate the total revenue by summing all bill amounts
    @Query("SELECT SUM(b.totalAmount) FROM Bill b")
    Double getTotalRevenue();
}