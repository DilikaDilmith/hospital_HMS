package com.hospital.hms.repository;

import com.hospital.hms.entity.Bed;
import com.hospital.hms.entity.BedStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    // Retrieve all beds in a ward
    List<Bed> findByWardId(Long wardId);

    // Retrieve beds filtered by status (AVAILABLE, OCCUPIED, MAINTENANCE)
    List<Bed> findByStatus(BedStatus status);

    // Retrieve beds in a specific ward by status
    List<Bed> findByWardIdAndStatus(Long wardId, BedStatus status);

    // Count beds by status
    long countByStatus(BedStatus status);

    // Pessimistic write lock for safe concurrent bed assignment
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bed b WHERE b.id = :id")
    Optional<Bed> findByIdForUpdate(@Param("id") Long id);
}
